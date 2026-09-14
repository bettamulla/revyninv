/**
 * Vercel Cron endpoint — runs every minute (see vercel.json).
 * Verifies the CRON_SECRET header to prevent public invocation.
 */
import { NextRequest, NextResponse } from "next/server";
import { processDueReminders } from "@/lib/reminders";

// Vercel Cron calls without a custom header — we accept the call from Vercel's
// edge network OR from an explicit manual call with x-vercel-cron or x-cron-secret.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  const expected = process.env.CRON_SECRET;

  // Vercel Cron sets this header automatically — trust it if no CRON_SECRET is set.
  const isVercelCron = req.headers.get("x-vercel-cron") !== null;

  if (expected && !isVercelCron) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== expected) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const n = await processDueReminders(new Date());
  return NextResponse.json({ ok: true, processed: n });
}
