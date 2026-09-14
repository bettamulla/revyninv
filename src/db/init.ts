/**
 * One-shot DB init for Postgres.
 * Generates SQL migrations from the schema and applies them.
 *
 * Run with: npm run db:init
 *
 * Requires DATABASE_URL. Locally, set it in .env.local or pass it in your shell.
 * On Vercel, the migration runs automatically as part of the deploy
 * (see package.json `postinstall` hook → scripts/migrate.ts).
 */
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error(
    "[db:init] DATABASE_URL is required.\n" +
      "  • On Vercel: add a Postgres database in the Storage tab.\n" +
      "  • Locally: copy .env.example to .env.local and set DATABASE_URL.",
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function main() {
  const url = process.env.DATABASE_URL!;
  console.log("[db:init] applying migrations to", maskUrl(url));
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[db:init] done");
}

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "***";
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
