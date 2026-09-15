import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

let _checked = false;
let _ranMigrations = false;
let _migrating: Promise<void> | null = null;

async function tableExists(): Promise<boolean> {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  const client = neon(url);
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    ) AS exists
  `;
  return Boolean((result as any)?.[0]?.exists);
}

async function runMigrations(): Promise<void> {
  const url = process.env.DATABASE_URL as string;
  const client = neon(url);
  const db = drizzle(client);
  console.log("[auto-migrate] running pending migrations…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[auto-migrate] done");
  _ranMigrations = true;
}

export async function ensureSchema(): Promise<void> {
  if (_checked && _ranMigrations) return;
  if (_migrating) return _migrating;
  _checked = true;
  _migrating = (async () => {
    try {
      const exists = await tableExists();
      if (!exists) await runMigrations();
      else _ranMigrations = true;
    } catch (err) {
      console.error("[auto-migrate] failed:", err);
      _checked = false;
      throw err;
    } finally {
      _migrating = null;
    }
  })();
  return _migrating;
}
