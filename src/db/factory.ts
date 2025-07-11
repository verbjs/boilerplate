// In db/factory.ts

import type { Pool } from "pg";
import type { PaginatedResult, PaginateOptions, Schema, Statement } from "./types";

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export type ExtensionsFactory<Ext extends Record<string, unknown>> = (
  pool: Pool,
  table: string,
  returnFields: string[],
) => Ext;

const Factory = <E extends Schema, Ext extends Record<string, unknown> = Record<string, unknown>>(
  pool: Pool,
  table: string,
  returnFields: string[] = ["*"],
  extensionsFactory?: ExtensionsFactory<Ext>,
) => {
  const toSnakeCaseObj = (obj: Statement): Statement =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [camelToSnake(k), v]));

  // --------------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------------
  const create = async (stmt: Statement): Promise<E> => {
    const now = Date.now();
    const createdAt = Object.keys(stmt).includes("createdAt") ? (stmt.createdAt ?? now) : now;
    const updatedAt = now;
    const updatedStmt = { ...stmt, createdAt, updatedAt };
    const snakeStmt = toSnakeCaseObj(updatedStmt);
    const fields = Object.keys(snakeStmt);
    const values = Object.values(snakeStmt);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");

    const query = `
      INSERT INTO ${table} (${fields.join(", ")})
      VALUES (${placeholders})
      RETURNING ${returnFields.join(", ")}
    `;
    const result = await pool.query(query, values);
    return result.rows[0] as E;
  };

  // --------------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------------
  const update = async <T = E>(stmt: Statement, where: Statement): Promise<T> => {
    const updatedAt = Date.now();
    const updatedStmt = { ...stmt, updatedAt };
    const snakeStmt = toSnakeCaseObj(updatedStmt);
    const setFields = Object.keys(snakeStmt);
    const setValues = Object.values(snakeStmt);
    const setClause = setFields.map((field, i) => `${field} = $${i + 1}`).join(", ");

    const snakeWhere = toSnakeCaseObj(where);
    const whereFields = Object.keys(snakeWhere);
    const whereValues = Object.values(snakeWhere);
    const whereClause = whereFields
      .map((field, i) => `${camelToSnake(field)} = $${setFields.length + i + 1}`)
      .join(" AND ");

    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING ${returnFields.join(", ")}
    `;

    const result = await pool.query(query, [...setValues, ...whereValues]);
    if (result.rows.length === 0) {
      throw new Error(`Update failed: No rows found matching criteria in table ${table}.`);
    }
    return result.rows[0] as T;
  };

  // --------------------------------------------------------------------------------
  // UPSERT
  // --------------------------------------------------------------------------------
  const upsert = async <T = E>(stmt: Statement): Promise<T> => {
    const now = Date.now();
    const createdAt = Object.keys(stmt).includes("createdAt") ? (stmt.createdAt ?? now) : now;
    const updatedAt = now;
    const updatedStmt = { ...stmt, createdAt, updatedAt };
    const snakeStmt = toSnakeCaseObj(updatedStmt);
    const fields = Object.keys(snakeStmt);
    const values = Object.values(snakeStmt);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");

    // Assuming 'id' is the conflict target
    const conflictTarget = "id";
    const updateClause = fields
      .filter((f) => f !== conflictTarget && f !== "created_at")
      .map((f) => `${f} = EXCLUDED.${f}`)
      .join(", ");
    const finalUpdateClause = updateClause
      ? `${updateClause}, updated_at = EXCLUDED.updated_at`
      : "updated_at = EXCLUDED.updated_at";

    const query = `
      INSERT INTO ${table} (${fields.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT (${conflictTarget})
      DO UPDATE SET ${finalUpdateClause}
      RETURNING ${returnFields.join(", ")}
    `;
    const result = await pool.query(query, values);
    return result.rows[0] as T;
  };

  // --------------------------------------------------------------------------------
  // GET
  // --------------------------------------------------------------------------------
  const get = async <T = E>(where: Statement): Promise<T | undefined> => {
    const snakeWhere = toSnakeCaseObj(where);
    const whereFields = Object.keys(snakeWhere);
    const whereValues = Object.values(snakeWhere);
    const whereClause = whereFields.map((field, i) => `${field} = $${i + 1}`).join(" AND ");
    const query = `
      SELECT ${returnFields.join(", ")}
      FROM ${table}
      WHERE ${whereClause}
      LIMIT 1
    `;
    const result = await pool.query(query, whereValues);
    return result.rows[0] as T | undefined;
  };

  // --------------------------------------------------------------------------------
  // LIST (Updated to accept a "where" Statement)
  // --------------------------------------------------------------------------------
  const list = async <T = E>(where?: Statement): Promise<T[]> => {
    let whereClause = "";
    const values: any[] = [];

    if (where) {
      const snakeWhere = toSnakeCaseObj(where);
      const whereFields = Object.keys(snakeWhere);
      const whereValues = Object.values(snakeWhere);

      if (whereFields.length > 0) {
        whereClause = `WHERE ${whereFields.map((field, i) => `${field} = $${i + 1}`).join(" AND ")}`;
        values.push(...whereValues);
      }
    }

    const query = `
      SELECT ${returnFields.join(", ")}
      FROM ${table}
      ${whereClause}
    `;
    const result = await pool.query(query, values);
    return result.rows as T[];
  };

  // --------------------------------------------------------------------------------
  // FIND
  // --------------------------------------------------------------------------------
  const find = async <T = E>(where: Statement): Promise<T[]> => {
    const snakeWhere = toSnakeCaseObj(where);
    const whereFields = Object.keys(snakeWhere);
    const whereValues = Object.values(snakeWhere);
    const whereClause = whereFields.map((field, i) => `${field} = $${i + 1}`).join(" AND ");

    const query = `
      SELECT ${returnFields.join(", ")}
      FROM ${table}
      WHERE ${whereClause}
    `;
    const result = await pool.query(query, whereValues);
    return result.rows as T[];
  };

  // --------------------------------------------------------------------------------
  // DELETE
  // --------------------------------------------------------------------------------
  const del = async (where: Statement): Promise<number> => {
    const snakeWhere = toSnakeCaseObj(where);
    const whereFields = Object.keys(snakeWhere);
    const whereValues = Object.values(snakeWhere);
    const whereClause = whereFields.map((field, i) => `${field} = $${i + 1}`).join(" AND ");

    const query = `
      DELETE FROM ${table}
      WHERE ${whereClause}
    `;
    const result = await pool.query(query, whereValues);
    return result.rowCount ?? 0;
  };

  // --------------------------------------------------------------------------------
  // PAGINATE
  // --------------------------------------------------------------------------------
  const paginate = async <T = E>(options: PaginateOptions): Promise<PaginatedResult<T>> => {
    const { page, pageSize, where, orderBy } = options;
    const offset = (page - 1) * pageSize;
    let paramIndex = 1;
    const queryParams: any[] = [];

    // Build WHERE clause
    let whereClause = "";
    if (where && Object.keys(where).length > 0) {
      const snakeWhere = toSnakeCaseObj(where);
      const conditions = Object.entries(snakeWhere).map(([field, value]) => {
        queryParams.push(value);
        return `${field} = $${paramIndex++}`;
      });
      whereClause = `WHERE ${conditions.join(" AND ")}`;
    }

    // Build ORDER BY clause
    let orderByClause = "";
    if (orderBy) {
      // Validate or safely map orderBy.field in real usage to avoid injection
      const snakeField = camelToSnake(orderBy.field);
      const direction = orderBy.direction === "DESC" ? "DESC" : "ASC";
      orderByClause = `ORDER BY ${snakeField} ${direction}`;
    } else {
      // Default ordering
      orderByClause = "ORDER BY created_at DESC";
    }

    // --- Query 1: Get total count ---
    const countQuery = `
      SELECT COUNT(*)
      FROM ${table}
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = Number.parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / pageSize);

    // --- Query 2: Get paginated data ---
    queryParams.push(pageSize);
    const limitClause = `LIMIT $${paramIndex++}`;
    queryParams.push(offset);
    const offsetClause = `OFFSET $${paramIndex++}`;

    const dataQuery = `
      SELECT ${returnFields.join(", ")}
      FROM ${table}
      ${whereClause}
      ${orderByClause}
      ${limitClause}
      ${offsetClause}
    `;
    const dataResult = await pool.query(dataQuery, queryParams);

    return {
      data: dataResult.rows as T[],
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
    };
  };

  // --------------------------------------------------------------------------------
  // EXTENSIONS
  // --------------------------------------------------------------------------------
  const extend = extensionsFactory ? extensionsFactory(pool, table, returnFields) : ({} as Ext);

  return {
    create,
    update,
    upsert,
    get,
    list,
    find,
    del,
    paginate,
    ...extend,
  };
};

export default Factory;
