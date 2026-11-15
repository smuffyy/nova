import { NextResponse } from "next/server";
import { accessHas, getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const existing = db.getInvite(id);
  if (!existing || existing.workspace_id !== access.workspace.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const invite = db.revokeInvite(id);
  return NextResponse.json({
    ok: true,
    invite: invite
      ? {
          id: invite.id,
          code: invite.code,
          revoked: invite.revoked,
        }
      : null,
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  return POST(req, ctx);
}
