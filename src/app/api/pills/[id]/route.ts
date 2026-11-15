import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { serializePill } from "@/lib/pills";

function ownPill(pillId: string, workspaceId: string, userId: string) {
  const pill = db.getPill(pillId);
  if (!pill) return null;
  if (pill.workspace_id !== workspaceId || pill.user_id !== userId) return null;
  return pill;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pill = ownPill(id, access.workspace.id, access.user.id);
  if (!pill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ pill: serializePill(pill) });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pill = ownPill(id, access.workspace.id, access.user.id);
  if (!pill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: string;
    body?: string;
    bullets?: string[];
  };

  const updated = db.updatePill(id, {
    title: body.title,
    body: body.body,
    bullets: body.bullets,
  });

  return NextResponse.json({ pill: serializePill(updated!) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pill = ownPill(id, access.workspace.id, access.user.id);
  if (!pill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.deletePill(id);
  return NextResponse.json({ ok: true });
}
