import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { users, invoices } from "@/db/schema";
import { signSession, buildSetCookie } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { addDays, format } from "date-fns";
import { scheduleInvoiceReminders } from "@/lib/reminders";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(1).max(120),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { email, password, businessName } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const id = nanoid(16);
  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    id, email, passwordHash, businessName,
    reminderOffsets: "-3,0,3,7,14",
  });

  await seedSampleInvoices(id);

  const token = await signSession({ sub: id, email });
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", buildSetCookie(token));
  return res;
}

async function seedSampleInvoices(userId: string) {
  const dueSoon = format(addDays(new Date(), 5), "yyyy-MM-dd");
  const duePast = format(addDays(new Date(), -7), "yyyy-MM-dd");
  const issued = format(new Date(), "yyyy-MM-dd");

  const id1 = nanoid(16);
  await db.insert(invoices).values({
    id: id1, userId,
    invoiceNumber: "DEMO-1001",
    clientName: "Sample Client",
    clientEmail: "client@example.com",
    clientPhone: null,
    amount: 250.0, currency: "USD",
    description: "Sample invoice — feel free to delete.",
    dueDate: dueSoon, issuedDate: issued,
    paidToken: nanoid(24),
    reviewPlatform: "google",
  });
  await scheduleInvoiceReminders(id1).catch(() => null);

  const id2 = nanoid(16);
  const token2 = nanoid(24);
  await db.insert(invoices).values({
    id: id2, userId,
    invoiceNumber: "DEMO-1000",
    clientName: "Happy Customer",
    clientEmail: "happy@example.com",
    clientPhone: null,
    amount: 480.0, currency: "USD",
    description: "Sample paid invoice — shows the review flow.",
    dueDate: duePast,
    issuedDate: format(addDays(new Date(), -21), "yyyy-MM-dd"),
    paidToken: token2,
    reviewPlatform: "google",
  });
  await scheduleInvoiceReminders(id2).catch(() => null);

  const { markInvoicePaidByToken } = await import("@/lib/reminders");
  await markInvoicePaidByToken(token2).catch(() => null);
}
