import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";

function serialize(sk: NonNullable<ReturnType<typeof db.getSidekick>>) {
  const files = db.listPersonalSources(
    sk.workspace_id,
    sk.user_id,
    sk.id
  );
  const skills = db.getSkillTokensByIds(sk.skill_ids || []).map((t) => ({
    id: t.id,
    name: t.name,
    topic: t.topic,
    proficiency: t.proficiency,
    proficiencyLabel:
      t.proficiency >= 3 ? "SME" : t.proficiency === 2 ? "Working" : "Emerging",
  }));
  return {
    id: sk.id,
    name: sk.name,
    description: sk.description,
    skillIds: sk.skill_ids || [],
    activeSkillIds: sk.active_skill_ids || [],
    skills,
    createdAt: sk.created_at,
    updatedAt: sk.updated_at,
    fileCount: files.length,
    readyCount: files.filter((f) => f.status === "ready").length,
  };
}

function ownSidekick(id: string, workspaceId: string, userId: string) {
  const sk = db.getSidekick(id);
  if (!sk) return null;
  if (sk.workspace_id !== workspaceId || sk.user_id !== userId) return null;
  return sk;
}

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  db.ensureDefaultSidekick(access.workspace.id, access.user.id);
  const sidekicks = db
    .listSidekicks(access.workspace.id, access.user.id)
    .map(serialize);

  return NextResponse.json({ sidekicks });
}

export async function POST(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
  };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const existing = db.listSidekicks(access.workspace.id, access.user.id);
  if (existing.length >= 12) {
    return NextResponse.json(
      { error: "Limit of 12 Sidekicks per person" },
      { status: 400 }
    );
  }

  const sidekick = db.createSidekick({
    workspaceId: access.workspace.id,
    userId: access.user.id,
    name,
    description: body.description,
  });

  return NextResponse.json({ sidekick: serialize(sidekick) });
}

export async function PATCH(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    id?: string;
    name?: string;
    description?: string;
    skillIds?: string[];
    activeSkillIds?: string[];
  };
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const sk = ownSidekick(body.id, access.workspace.id, access.user.id);
  if (!sk) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.skillIds) {
    const allowed = new Set(
      db.listSkillTokens(access.workspace.id, access.user.id).map((t) => t.id)
    );
    for (const sid of body.skillIds) {
      if (!allowed.has(sid)) {
        return NextResponse.json(
          { error: "Cannot equip a skill you do not own" },
          { status: 400 }
        );
      }
    }
  }

  const updated = db.updateSidekick(body.id, {
    name: body.name,
    description: body.description,
    skill_ids: body.skillIds,
    active_skill_ids: body.activeSkillIds,
  });
  return NextResponse.json({ sidekick: serialize(updated!) });
}

export async function DELETE(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const sk = ownSidekick(id, access.workspace.id, access.user.id);
  if (!sk) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = db.deleteSidekick(id);
  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.reason === "last"
            ? "Keep at least one Sidekick"
            : "Could not delete",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, fallbackId: result.fallbackId });
}
