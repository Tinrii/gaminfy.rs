import "server-only";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "@/lib/env";
import * as schema from "./schema";

type Db = MySql2Database<typeof schema>;

// Reuse one pool per server instance (and across dev hot reloads).
const globalForDb = globalThis as unknown as { gaminfyDb?: Db };

export function db(): Db {
  if (!globalForDb.gaminfyDb) {
    const pool = mysql.createPool({
      uri: env().DATABASE_URL,
      connectionLimit: 5,
      // Enable once MariaDB on the Ubuntu host has TLS configured (DATABASE_SSL=true).
      ssl: env().DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
    });
    globalForDb.gaminfyDb = drizzle({ client: pool, schema, mode: "default" });
  }
  return globalForDb.gaminfyDb;
}

export { schema };
