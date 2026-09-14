/**
 * Database client — lazy-initialized.
 *
 * The Neon HTTP client is created on first use, not at module load. This:
 *   1. Lets the Next.js build complete without a live DATABASE_URL.
 *   2. Speeds up cold starts on Vercel (the client is created on first query).
 *
 * All other code should import { db } from this file as usual — the lazy
 * wrapper is API-compatible.
 */
import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import ws from "ws";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;
let _sql: NeonQueryFunction<false, false> | null = null;

function init(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. On Vercel: add a Postgres database in the Storage tab. " +
        "Locally: copy .env.example to .env.local and set DATABASE_URL.",
    );
  }

  // In Node.js (not Edge), Neon needs a WebSocket polyfill for some operations.
  if (typeof WebSocket === "undefined") {
    neonConfig.webSocketConstructor = ws;
  }

  _sql = neon(url);
  _db = drizzle(_sql, { schema });
  return _db;
}

/**
 * Proxy that lazily resolves the Drizzle instance on every property access.
 * This means every `db.query.users.findFirst(...)` triggers init() exactly once
 * (subsequent calls hit the cached `_db`).
 */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, _receiver) {
    const real = init();
    const value = (real as any)[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
