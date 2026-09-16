import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import ws from "ws";
import * as schema from "./schema";
import { ensureSchema } from "@/lib/migrate-on-boot";

const url = process.env.DATABASE_URL;

if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

let _db: NeonHttpDatabase<typeof schema> | null = null;

if (url) {
  const sql: NeonQueryFunction<false, false> = neon(url);
  _db = drizzle(sql, { schema });

  // Fire-and-forget auto-migration. If it fails, queries still work —
  // the user just sees a clear error pointing at /api/admin/migrate.
  ensureSchema().catch((err) => {
    console.error("[db] auto-migration failed. Hit POST /api/admin/migrate. Error:", err);
  });
}

export const db = _db ?? (new Proxy({} as any, {
  get() {
    throw new Error("DATABASE_URL is not set. On Vercel: add a Postgres database in the Storage tab.");
  },
}) as unknown as NeonHttpDatabase<typeof schema>);

export { schema };
