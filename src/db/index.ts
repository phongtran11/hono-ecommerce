import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

function createDb(connectionString: string) {
  const pool = new Pool({ connectionString, max: 10 });
  return drizzle(pool, { schema, logger: true });
}

type Database = ReturnType<typeof createDb>;

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

type DB = Database | Transaction;

export { createDb, schema, DB };
