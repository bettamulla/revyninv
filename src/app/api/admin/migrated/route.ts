/**
 * One-shot migration endpoint. Hit this once after deploying (or after adding
 * a new env var) to apply any pending Drizzle migrations.
 *
 * Protected by CRON_SECRET (or x-vercel-cron if called by Vercel).
 * Idempotent — safe to hit multiple times.
 */
import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

async function handle(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const isVercelCron = req.headers.get("x-vercel-cron") !== null;
  if (expected && !isVercelCron) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== expected) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: "./drizzle" });
    return NextResponse.json({ ok: true, message: "Migrations applied" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}
export async function GET(req: NextRequest) {
  return handle(req);
}
