import { SQL } from "bun";

const db = new SQL({
  url: process.env.DATABASE_URL,
  max: 100,
  idleTimeout: 500,
  maxLifetime: 0,
  connectionTimeout: 30,
  tls: true,

  onconnect: (_) => console.log("Connected to Postgres"),
  onclose: (_) => console.log("Disconnected from Postgres"),
});

export default db;
