import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { eq } from "drizzle-orm";

const Body = z.object({
  businessName: z.string().min(1).max(120),
  contactPhone: z.string().optional().or(z.literal("")),
  reviewLinkGoogle: z.string().optional().or(z.literal("")),
  reviewLinkTrustpilot: z.string().optional().or(z.literal("")),
  reviewLinkCustom: z.string().optional().or(z.literal("")),
  reminderOffsets: z.string().regex(/^[\s\-\d,]+$/).max(120),
  emailTemplate: z.string().optional().or(z.literal("")),
  whatsappTemplate: z.string().optional().or(z.literal("")),
  thankYouTemplate: z.string().optional().or(z.literal("")),
});

export async function PUT(req: NextRequest) {
  let session;
  try {
    session = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  await db
    .update(users)
    .set({
      businessName: d.businessName,
      contactPhone: d.contactPhone || null,
      reviewLinkGoogle: d.reviewLinkGoogle || null,
      reviewLinkTrustpilot: d.reviewLinkTrustpilot || null,
      reviewLinkCustom: d.reviewLinkCustom || null,
      reminderOffsets: d.reminderOffsets,
      emailTemplate: d.emailTemplate || null,
      whatsappTemplate: d.whatsappTemplate || null,
      thankYouTemplate: d.thankYouTemplate || null,
    })
    .where(eq(users.id, session.sub));

  return NextResponse.json({ ok: true });
}
