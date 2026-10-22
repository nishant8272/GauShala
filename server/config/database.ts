import pg, { Pool } from "pg";
import { env } from "./env";

export let pool: Pool | null = null;


if (env.DATABASE_URL) {
  // Normalize sslmode=require to sslmode=verify-full to silence pg v9 / pg-connection-string deprecation warning
  const connectionString = env.DATABASE_URL.includes("sslmode=require")
    ? env.DATABASE_URL.replace("sslmode=require", "sslmode=verify-full")
    : env.DATABASE_URL;

  pool = new Pool({
    connectionString,
  });
}
