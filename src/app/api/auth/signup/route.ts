import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signSession, buildSetCookie } from "@/lib/auth";
import { eq } from "drizzle-orm";

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
    id,
    email,
    passwordHash,
    businessName,
  });

  const token = await signSession({ sub: id, email });
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", buildSetCookie(token));
  return res;
}
