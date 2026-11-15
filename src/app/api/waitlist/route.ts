import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; company?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  db.addWaitlist({
    id: uuid(),
    email,
    company: body.company?.trim() || null,
  });

  return NextResponse.json({ ok: true });
}
