import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const email = (process.env.DEMO_EMAIL || "demo@portal.local").toLowerCase();
  const password = process.env.DEMO_PASSWORD || "portal-demo";

  const user = db.getUserByEmail(email);
  if (!user || user.password_hash !== hashPassword(password)) {
    return NextResponse.json(
      { error: "Demo workspace not seeded. Run npm run db:seed" },
      { status: 404 }
    );
  }

  const membership = db.getFirstMembership(user.id);
  if (!membership) {
    return NextResponse.json({ error: "Demo workspace missing" }, { status: 404 });
  }

  await createSession(user.id, membership.workspace_id);
  return NextResponse.json({ ok: true });
}
