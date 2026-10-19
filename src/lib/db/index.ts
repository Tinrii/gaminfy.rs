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
      connectionLimit: 10,
      // The DB is remote: routers/NAT silently drop idle TCP connections, and a query
      // sent on such a dead socket hangs until TCP gives up (seen as a stuck
      // "use cache" fill in dev). Keep-alive probes keep live sockets open and detect
      // dead ones.
      // Don't set maxIdle below connectionLimit: mysql2 then starts a 1s idle-sweep
      // timer that calls Date.now() inside whichever render first created the pool,
      // which Next.js reports as "unstable value Date.now() while prerendering".
      enableKeepAlive: true,
      keepAliveInitialDelay: 10_000,
      connectTimeout: 10_000,
      // Enable once MariaDB on the Ubuntu host has TLS configured (DATABASE_SSL=true).
      ssl: env().DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
    });
    globalForDb.gaminfyDb = drizzle({ client: pool, schema, mode: "default" });
  }
  return globalForDb.gaminfyDb;
}

export { schema };
