import { NextRequest, NextResponse } from "next/server";
import { markInvoicePaidByToken } from "@/lib/reminders";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await markInvoicePaidByToken(token);
  if (!result.ok) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
