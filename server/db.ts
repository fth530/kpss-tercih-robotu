import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { env } from "./env";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: any = null;

// Only create database connection if DATABASE_URL is provided
if (env.DATABASE_URL) {
  // Optimize connection pool settings
  pool = new Pool({ 
    connectionString: env.DATABASE_URL,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  });

  db = drizzle(pool, { schema });
}

export { pool, db };
