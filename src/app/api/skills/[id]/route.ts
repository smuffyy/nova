import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { serializeSkillToken } from "@/lib/skills";

function ownSkill(id: string, workspaceId: string, userId: string) {
  const token = db.getSkillToken(id);
  if (!token) return null;
  if (token.workspace_id !== workspaceId || token.user_id !== userId) {
    return null;
  }
  return token;
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
  const token = ownSkill(id, access.workspace.id, access.user.id);
  if (!token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ skill: serializeSkillToken(token) });
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
  const token = ownSkill(id, access.workspace.id, access.user.id);
  if (!token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    name?: string;
    topic?: string;
    body?: string;
    bullets?: string[];
    proficiency?: 1 | 2 | 3;
  };

  const updated = db.updateSkillToken(id, {
    name: body.name,
    topic: body.topic,
    body: body.body,
    bullets: body.bullets,
    proficiency: body.proficiency,
  });

  return NextResponse.json({ skill: serializeSkillToken(updated!) });
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
  const token = ownSkill(id, access.workspace.id, access.user.id);
  if (!token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  db.deleteSkillToken(id);
  return NextResponse.json({ ok: true });
}
