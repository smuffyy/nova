import { NextResponse } from "next/server";
import { accessHas, getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";

function serializeInvite(
  invite: NonNullable<ReturnType<typeof db.getInvite>>
) {
  return {
    id: invite.id,
    workspaceId: invite.workspace_id,
    code: invite.code,
    role: invite.role,
    createdBy: invite.created_by,
    createdAt: invite.created_at,
    expiresAt: invite.expires_at,
    maxUses: invite.max_uses,
    useCount: invite.use_count,
    revoked: invite.revoked,
    joinUrl: `/join?code=${encodeURIComponent(invite.code)}`,
  };
}

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!accessHas(access, "roles.manage")) {
    return NextResponse.json(
      { error: "Forbidden", code: "ROLES_MANAGE_REQUIRED" },
      { status: 403 }
    );
  }

  const invites = db
    .listInvites(access.workspace.id)
    .map(serializeInvite);

  return NextResponse.json({ invites });
}

export async function POST(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!accessHas(access, "roles.manage")) {
    return NextResponse.json(
      { error: "Forbidden", code: "ROLES_MANAGE_REQUIRED" },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    role?: string;
    expiresAt?: string | null;
    maxUses?: number | null;
  };

  const policy = db.getRolePolicy(access.workspace.id);
  const role = body.role || "member";
  if (!policy.roles.some((r) => r.id === role)) {
    return NextResponse.json({ error: "Unknown role" }, { status: 400 });
  }

  const invite = db.createInvite({
    workspaceId: access.workspace.id,
    createdBy: access.user.id,
    role,
    expiresAt: body.expiresAt ?? null,
    maxUses: body.maxUses ?? null,
  });

  return NextResponse.json({ invite: serializeInvite(invite), code: invite.code });
}
