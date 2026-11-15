import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import {
  assertAskInWorkspace,
  assertAskMember,
  ensureAskCollaborator,
  serializeAskProjectDetail,
} from "@/lib/asks";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string; itemId: string }> };

function detailPayload(projectId: string, workspaceId: string, userId: string) {
  const project = db.getAskProject(projectId)!;
  const membership = assertAskMember(projectId, userId);
  const members = db.listMemberships(workspaceId).map((m) => {
    const user = db.getUserById(m.user_id);
    return {
      userId: m.user_id,
      name: user?.name || "Unknown",
      email: user?.email || "",
      role: m.role,
    };
  });
  return {
    project: serializeAskProjectDetail(project),
    members,
    you: {
      userId,
      isCollaborator: Boolean(membership),
      role: membership?.role || null,
    },
  };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, itemId } = await ctx.params;
  const project = assertAskInWorkspace(id, access.workspace.id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!assertAskMember(id, access.user.id)) {
    return NextResponse.json(
      { error: "Only collaborators can edit this ask" },
      { status: 403 }
    );
  }

  const kind = new URL(req.url).searchParams.get("kind");
  const body = (await req.json()) as Record<string, unknown>;

  if (kind === "task") {
    const task = db.getAskTask(itemId);
    if (!task || task.project_id !== id) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    const assigneeId =
      body.assigneeId === undefined
        ? undefined
        : body.assigneeId
          ? String(body.assigneeId)
          : null;
    if (assigneeId) {
      const membership = db.getMembership(assigneeId, access.workspace.id);
      if (!membership) {
        return NextResponse.json(
          { error: "Assignee must be in the workspace" },
          { status: 400 }
        );
      }
      ensureAskCollaborator(id, assigneeId);
    }
    db.updateAskTask(itemId, {
      title: body.title as string | undefined,
      notes: body.notes as string | undefined,
      status: body.status as "todo" | "doing" | "done" | undefined,
      assignee_id: assigneeId,
      starts_on:
        body.startsOn === undefined
          ? undefined
          : body.startsOn
            ? String(body.startsOn)
            : null,
      ends_on:
        body.endsOn === undefined
          ? undefined
          : body.endsOn
            ? String(body.endsOn)
            : null,
    });
  } else if (kind === "checklist") {
    db.updateAskChecklistItem(itemId, {
      title: body.title as string | undefined,
      done: body.done as boolean | undefined,
    });
  } else if (kind === "path") {
    db.updateAskPathStep(itemId, {
      label: body.label as string | undefined,
      detail: body.detail as string | undefined,
      status: body.status as "pending" | "current" | "done" | undefined,
    });
  } else if (kind === "cost") {
    db.updateAskCostLine(itemId, {
      label: body.label as string | undefined,
      category: body.category as string | undefined,
      amount: body.amount as number | undefined,
    });
  } else if (kind === "bom") {
    db.updateAskBomItem(itemId, {
      part_number: body.partNumber as string | undefined,
      name: body.name as string | undefined,
      qty: body.qty as number | undefined,
      unit: body.unit as string | undefined,
      unit_cost: body.unitCost as number | undefined,
      notes: body.notes as string | undefined,
    });
  } else {
    return NextResponse.json({ error: "kind required" }, { status: 400 });
  }

  return NextResponse.json(
    detailPayload(id, access.workspace.id, access.user.id)
  );
}

export async function DELETE(req: Request, ctx: Ctx) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, itemId } = await ctx.params;
  const project = assertAskInWorkspace(id, access.workspace.id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!assertAskMember(id, access.user.id)) {
    return NextResponse.json(
      { error: "Only collaborators can edit this ask" },
      { status: 403 }
    );
  }

  const kind = new URL(req.url).searchParams.get("kind");
  if (kind === "task") db.deleteAskTask(itemId);
  else if (kind === "checklist") db.deleteAskChecklistItem(itemId);
  else if (kind === "path") db.deleteAskPathStep(itemId);
  else if (kind === "comment") db.deleteAskComment(itemId);
  else if (kind === "cost") db.deleteAskCostLine(itemId);
  else if (kind === "bom") db.deleteAskBomItem(itemId);
  else if (kind === "file") {
    const file = db.deleteAskFile(itemId);
    if (file) {
      const fs = await import("fs");
      const pathMod = await import("path");
      const abs = pathMod.join(process.cwd(), file.storage_path);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    }
  } else {
    return NextResponse.json({ error: "kind required" }, { status: 400 });
  }

  return NextResponse.json(
    detailPayload(id, access.workspace.id, access.user.id)
  );
}
