import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = db.getUserByEmail(email);
  if (!user || user.password_hash !== hashPassword(password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const membership = db.getFirstMembership(user.id);
  if (!membership) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  await createSession(user.id, membership.workspace_id);
  return NextResponse.json({ ok: true });
}
