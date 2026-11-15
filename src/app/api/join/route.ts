import { NextResponse } from "next/server";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";

function inviteUsable(
  invite: NonNullable<ReturnType<typeof db.getInviteByCode>>
): { ok: true } | { ok: false; error: string; status: number } {
  if (invite.revoked) {
    return { ok: false, error: "Invite revoked", status: 410 };
  }
  if (invite.expires_at) {
    const expires = new Date(invite.expires_at).getTime();
    if (!Number.isNaN(expires) && Date.now() > expires) {
      return { ok: false, error: "Invite expired", status: 410 };
    }
  }
  if (
    invite.max_uses != null &&
    invite.use_count >= invite.max_uses
  ) {
    return { ok: false, error: "Invite has reached max uses", status: 410 };
  }
  return { ok: true };
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    code?: string;
    name?: string;
    email?: string;
    password?: string;
  };

  const code = body.code?.trim();
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password || "";

  if (!code || !name || !email || !password) {
    return NextResponse.json(
      { error: "code, name, email, and password required" },
      { status: 400 }
    );
  }

  const invite = db.getInviteByCode(code);
  if (!invite) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const usable = inviteUsable(invite);
  if (!usable.ok) {
    return NextResponse.json(
      { error: usable.error },
      { status: usable.status }
    );
  }

  const workspace = db.getWorkspaceById(invite.workspace_id);
  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 }
    );
  }

  let user = db.getUserByEmail(email);
  if (user) {
    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: "Account exists — password does not match" },
        { status: 401 }
      );
    }
  } else {
    user = db.createUser({
      id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
      email,
      password_hash: hashPassword(password),
      name,
    });
  }

  db.ensureMembership({
    user_id: user.id,
    workspace_id: invite.workspace_id,
    role: invite.role || "member",
  });

  db.consumeInvite(invite.id);
  await createSession(user.id, invite.workspace_id);

  return NextResponse.json({
    ok: true,
    workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
  });
}
