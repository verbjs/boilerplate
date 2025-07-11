export interface Schema {
  id: string | null;
  updatedAt: number;
  createdAt: number;
}

export type Statement = {
  [key: string]: string | number | boolean | Record<string, any>;
};

export interface PaginateOptions {
  page: number; // Page number (usually 1-based)
  pageSize: number; // Number of items per page
  where?: Statement; // Optional filtering conditions
  orderBy?: { field: string; direction: "ASC" | "DESC" }; // Optional sorting
}

// Interface for the pagination result
export interface PaginatedResult<E> {
  data: E[]; // The data for the current page
  totalCount: number; // Total number of records matching the where clause
  totalPages: number; // Total number of pages
  currentPage: number; // The current page number
  pageSize: number; // The requested page size
}
