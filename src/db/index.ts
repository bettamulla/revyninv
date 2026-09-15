import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import ws from "ws";
import * as schema from "./schema";
import { ensureSchema } from "@/lib/migrate-on-boot";

let _db: NeonHttpDatabase<typeof schema> | null = null;
let _initPromise: Promise<NeonHttpDatabase<typeof schema>> | null = null;

async function init(): Promise<NeonHttpDatabase<typeof schema>> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. On Vercel: add a Postgres database in the Storage tab. Locally: set DATABASE_URL in .env.local.");
  }

  _initPromise = (async () => {
    if (typeof WebSocket === "undefined") {
      neonConfig.webSocketConstructor = ws;
    }
    await ensureSchema();
    const sql: NeonQueryFunction<false, false> = neon(url);
    _db = drizzle(sql, { schema });
    return _db;
  })();

  return _initPromise;
}

function makeProxy(): any {
  return new Proxy({} as any, {
    get(_t, prop) {
      return (...args: any[]) =>
        init().then((real: any) => {
          const v = real[prop];
          if (typeof v === "function") return v.apply(real, args);
          if (typeof v === "object" && v !== null) {
            return new Proxy(v, {
              get(_t2, prop2) {
                return (...args2: any[]) => init().then(() => {
                  const v2 = real[prop][prop2];
                  if (typeof v2 === "function") return v2.apply(real[prop], args2);
                  return v2;
                });
              },
            });
          }
          return v;
        });
    },
  });
}

export const db = makeProxy() as unknown as NeonHttpDatabase<typeof schema>;
export { init as initDb };
export { schema };
