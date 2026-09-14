import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { scheduleInvoiceReminders } from "@/lib/reminders";

const Body = z.object({
  invoiceNumber: z.string().min(1).max(64),
  clientName: z.string().min(1).max(120),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional().or(z.literal("")),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default("USD"),
  description: z.string().optional().or(z.literal("")),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviewPlatform: z.enum(["google", "trustpilot", "custom"]).optional(),
});

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const id = nanoid(16);
  const paidToken = nanoid(24);

  await db.insert(invoices).values({
    id,
    userId: session.sub,
    invoiceNumber: d.invoiceNumber,
    clientName: d.clientName,
    clientEmail: d.clientEmail,
    clientPhone: d.clientPhone || null,
    amount: d.amount,
    currency: d.currency,
    description: d.description || null,
    dueDate: d.dueDate,
    issuedDate: new Date().toISOString().slice(0, 10),
    paidToken,
    reviewPlatform: d.reviewPlatform || "google",
  });

  // Schedule reminders (best-effort; if this fails the invoice still exists)
  try {
    const n = await scheduleInvoiceReminders(id);
    console.log(`[invoices] scheduled ${n} reminders for ${id}`);
  } catch (err) {
    console.error("[invoices] failed to schedule reminders", err);
  }

  return NextResponse.json({ ok: true, id });
}
