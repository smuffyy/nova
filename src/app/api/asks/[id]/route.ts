import path from "path";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getSessionAccess } from "@/lib/access";
import {
  addAskCollaborator,
  assertAskInWorkspace,
  assertAskMember,
  cancelAskDelete,
  confirmAskDelete,
  ensureAskCollaborator,
  purgeAskFiles,
  removeAskCollaborator,
  serializeAskProjectDetail,
} from "@/lib/asks";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

function workspacePeople(workspaceId: string) {
  return db.listMemberships(workspaceId).map((m) => {
    const user = db.getUserById(m.user_id);
    return {
      userId: m.user_id,
      name: user?.name || "Unknown",
      email: user?.email || "",
      role: m.role,
    };
  });
}

function detailPayload(
  projectId: string,
  workspaceId: string,
  userId: string
) {
  const project = db.getAskProject(projectId)!;
  const membership = assertAskMember(projectId, userId);
  return {
    project: serializeAskProjectDetail(project),
    members: workspacePeople(workspaceId),
    you: {
      userId,
      isCollaborator: Boolean(membership),
      role: membership?.role || null,
    },
  };
}

export async function GET(_req: Request, ctx: Ctx) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const project = assertAskInWorkspace(id, access.workspace.id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    detailPayload(id, access.workspace.id, access.user.id)
  );
}

export async function PATCH(req: Request, ctx: Ctx) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
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

  const body = (await req.json()) as {
    title?: string;
    aim?: string;
    objective?: string;
    documentation?: string;
    status?: "active" | "paused" | "done";
  };

  const patch: {
    title?: string;
    aim?: string;
    objective?: string;
    documentation?: string;
    status?: "active" | "paused" | "done";
  } = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.aim !== undefined) patch.aim = body.aim;
  if (body.objective !== undefined) patch.objective = body.objective;
  if (body.documentation !== undefined)
    patch.documentation = body.documentation;
  if (body.status !== undefined) patch.status = body.status;

  db.updateAskProject(id, patch);

  return NextResponse.json(
    detailPayload(id, access.workspace.id, access.user.id)
  );
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const project = assertAskInWorkspace(id, access.workspace.id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = confirmAskDelete({
    project,
    userId: access.user.id,
  });
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  if (result.deleted) {
    purgeAskFiles(id);
    db.deleteAskProject(id);
    return NextResponse.json({ ok: true, deleted: true });
  }

  return NextResponse.json({
    ok: true,
    deleted: false,
    ...detailPayload(id, access.workspace.id, access.user.id),
  });
}

/** Nested actions via ?action= */
export async function POST(req: Request, ctx: Ctx) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const project = assertAskInWorkspace(id, access.workspace.id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const contentType = req.headers.get("content-type") || "";
  const isMember = Boolean(assertAskMember(id, access.user.id));

  if (action === "file" || contentType.includes("multipart/form-data")) {
    if (!isMember) {
      return NextResponse.json(
        { error: "Only collaborators can upload files" },
        { status: 403 }
      );
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    const taskId = String(form.get("taskId") || "") || null;
    const fileId = uuid();
    const dir = path.join(
      process.cwd(),
      "uploads",
      access.workspace.id,
      "asks",
      id
    );
    const fs = await import("fs");
    fs.mkdirSync(dir, { recursive: true });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const rel = path.join(
      "uploads",
      access.workspace.id,
      "asks",
      id,
      `${fileId}-${safeName}`
    );
    fs.writeFileSync(
      path.join(process.cwd(), rel),
      Buffer.from(await file.arrayBuffer())
    );
    db.createAskFile({
      id: fileId,
      project_id: id,
      task_id: taskId,
      workspace_id: access.workspace.id,
      filename: file.name,
      mime_type: file.type || "application/octet-stream",
      storage_path: rel,
      uploaded_by: access.user.id,
    });
    return NextResponse.json(
      detailPayload(id, access.workspace.id, access.user.id)
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (action === "add-member") {
    if (!isMember) {
      return NextResponse.json(
        { error: "Only collaborators can invite people" },
        { status: 403 }
      );
    }
    const userId = String(body.userId || "").trim();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const result = addAskCollaborator({
      projectId: id,
      userId,
      workspaceId: access.workspace.id,
    });
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } else if (action === "remove-member") {
    const userId = String(body.userId || "").trim();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const result = removeAskCollaborator({
      project,
      actorId: access.user.id,
      targetUserId: userId,
    });
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
  } else if (action === "request-delete" || action === "confirm-delete") {
    const result = confirmAskDelete({
      project,
      userId: access.user.id,
    });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    if (result.deleted) {
      purgeAskFiles(id);
      db.deleteAskProject(id);
      return NextResponse.json({ ok: true, deleted: true });
    }
  } else if (action === "cancel-delete") {
    const result = cancelAskDelete(id, access.user.id);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
  } else if (!isMember) {
    return NextResponse.json(
      { error: "Only collaborators can change this ask" },
      { status: 403 }
    );
  } else if (action === "task") {
    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }
    const assigneeId = (body.assigneeId as string) || null;
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
    const tasks = db.listAskTasks(id);
    db.createAskTask({
      id: uuid(),
      project_id: id,
      workspace_id: access.workspace.id,
      title,
      notes: String(body.notes || ""),
      assignee_id: assigneeId,
      status: (body.status as "todo" | "doing" | "done") || "todo",
      starts_on: (body.startsOn as string) || null,
      ends_on: (body.endsOn as string) || null,
      sort_order: tasks.length,
      created_by: access.user.id,
    });
  } else if (action === "checklist") {
    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }
    const items = db.listAskChecklist(id);
    db.createAskChecklistItem({
      id: uuid(),
      project_id: id,
      task_id: (body.taskId as string) || null,
      title,
      sort_order: items.length,
    });
  } else if (action === "comment") {
    const text = String(body.body || "").trim();
    if (!text) {
      return NextResponse.json({ error: "body required" }, { status: 400 });
    }
    db.createAskComment({
      id: uuid(),
      project_id: id,
      task_id: (body.taskId as string) || null,
      user_id: access.user.id,
      body: text,
    });
  } else if (action === "path") {
    const label = String(body.label || "").trim();
    if (!label) {
      return NextResponse.json({ error: "label required" }, { status: 400 });
    }
    const steps = db.listAskPathSteps(id);
    db.createAskPathStep({
      id: uuid(),
      project_id: id,
      label,
      detail: String(body.detail || ""),
      status: "pending",
      sort_order: steps.length,
    });
  } else if (action === "cost") {
    const label = String(body.label || "").trim();
    if (!label) {
      return NextResponse.json({ error: "label required" }, { status: 400 });
    }
    db.createAskCostLine({
      id: uuid(),
      project_id: id,
      label,
      category: String(body.category || "General"),
      amount: Number(body.amount) || 0,
    });
  } else if (action === "bom") {
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const items = db.listAskBomItems(id);
    db.createAskBomItem({
      id: uuid(),
      project_id: id,
      name,
      part_number: String(body.partNumber || ""),
      qty: Number(body.qty) || 1,
      unit: String(body.unit || "ea"),
      unit_cost: Number(body.unitCost) || 0,
      notes: String(body.notes || ""),
      sort_order: items.length,
    });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json(
    detailPayload(id, access.workspace.id, access.user.id)
  );
}
