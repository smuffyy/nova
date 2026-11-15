import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { db, type AskProject } from "@/lib/db";

export function serializeAskCollaborators(projectId: string) {
  return db.listAskMembers(projectId).map((m) => {
    const user = db.getUserById(m.user_id);
    return {
      userId: m.user_id,
      name: user?.name || "Unknown",
      email: user?.email || "",
      role: m.role,
      joinedAt: m.joined_at,
    };
  });
}

export function serializeAskDeleteState(project: AskProject) {
  const members = db.listAskMembers(project.id);
  const votes = db.listAskDeleteVotes(project.id);
  const voteByUser = new Set(votes.map((v) => v.user_id));
  const pending = Boolean(project.delete_requested_at);
  return {
    pending,
    requestedAt: project.delete_requested_at,
    requestedBy: project.delete_requested_by,
    requestedByName: project.delete_requested_by
      ? db.getUserById(project.delete_requested_by)?.name || "Member"
      : null,
    confirmedUserIds: votes.map((v) => v.user_id),
    confirmedCount: votes.length,
    requiredCount: members.length,
    members: members.map((m) => {
      const user = db.getUserById(m.user_id);
      return {
        userId: m.user_id,
        name: user?.name || "Unknown",
        role: m.role,
        confirmed: voteByUser.has(m.user_id),
      };
    }),
    unanimous: pending && members.length > 0 && members.every((m) => voteByUser.has(m.user_id)),
  };
}

export function serializeAskProjectSummary(project: AskProject) {
  const tasks = db.listAskTasks(project.id);
  const checklist = db.listAskChecklist(project.id);
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const doingTasks = tasks.filter((t) => t.status === "doing");
  const doneChecks = checklist.filter((c) => c.done).length;
  const owner = db.getUserById(project.owner_id);
  const collaborators = serializeAskCollaborators(project.id);
  const openTasks = [...doingTasks, ...todoTasks].slice(0, 8).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status as "todo" | "doing",
    assigneeName: t.assignee_id
      ? db.getUserById(t.assignee_id)?.name || null
      : null,
  }));
  return {
    id: project.id,
    title: project.title || "Untitled Ask",
    aim: project.aim || "",
    objective: project.objective || "",
    status: project.status || "active",
    ownerId: project.owner_id,
    ownerName: owner?.name || "Unknown",
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    taskCount: tasks.length,
    tasksDone: doneTasks,
    tasksTodo: todoTasks.length,
    tasksDoing: doingTasks.length,
    checklistCount: checklist.length,
    checklistDone: doneChecks,
    pathSteps: db.listAskPathSteps(project.id).length,
    openTasks,
    collaboratorCount: collaborators.length,
    deletePending: Boolean(project.delete_requested_at),
  };
}

export function listAskProjectSummaries(workspaceId: string) {
  return db.listAskProjects(workspaceId).map(serializeAskProjectSummary);
}

export function serializeAskProjectDetail(project: AskProject) {
  const owner = db.getUserById(project.owner_id);
  const tasks = db.listAskTasks(project.id).map((t) => {
    const assignee = t.assignee_id ? db.getUserById(t.assignee_id) : null;
    return {
      id: t.id,
      title: t.title,
      notes: t.notes,
      status: t.status,
      assigneeId: t.assignee_id,
      assigneeName: assignee?.name || null,
      startsOn: t.starts_on,
      endsOn: t.ends_on,
      sortOrder: t.sort_order,
      createdBy: t.created_by,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    };
  });
  const path = db.listAskPathSteps(project.id).map((s) => ({
    id: s.id,
    label: s.label,
    detail: s.detail,
    status: s.status,
    sortOrder: s.sort_order,
  }));
  const checklist = db.listAskChecklist(project.id).map((c) => ({
    id: c.id,
    taskId: c.task_id,
    title: c.title,
    done: c.done,
    sortOrder: c.sort_order,
  }));
  const comments = db.listAskComments(project.id).map((c) => {
    const user = db.getUserById(c.user_id);
    return {
      id: c.id,
      taskId: c.task_id,
      userId: c.user_id,
      authorName: user?.name || "Member",
      body: c.body,
      createdAt: c.created_at,
    };
  });
  const files = db.listAskFiles(project.id).map((f) => {
    const uploader = db.getUserById(f.uploaded_by);
    return {
      id: f.id,
      taskId: f.task_id,
      filename: f.filename,
      mimeType: f.mime_type,
      uploadedBy: f.uploaded_by,
      uploaderName: uploader?.name || "Member",
      createdAt: f.created_at,
    };
  });
  const costs = db.listAskCostLines(project.id).map((c) => ({
    id: c.id,
    label: c.label,
    category: c.category,
    amount: c.amount,
    createdAt: c.created_at,
  }));
  const bom = db.listAskBomItems(project.id).map((b) => ({
    id: b.id,
    partNumber: b.part_number,
    name: b.name,
    qty: b.qty,
    unit: b.unit,
    unitCost: b.unit_cost,
    notes: b.notes,
    sortOrder: b.sort_order,
    lineTotal: Math.round(b.qty * b.unit_cost * 100) / 100,
  }));
  const costTotal = costs.reduce((s, c) => s + c.amount, 0);
  const bomTotal = bom.reduce((s, b) => s + b.lineTotal, 0);

  return {
    id: project.id,
    title: project.title,
    aim: project.aim,
    objective: project.objective,
    documentation: project.documentation,
    status: project.status,
    ownerId: project.owner_id,
    ownerName: owner?.name || "Unknown",
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    path,
    tasks,
    checklist,
    comments,
    files,
    costs,
    costTotal,
    bom,
    bomTotal,
    collaborators: serializeAskCollaborators(project.id),
    deleteState: serializeAskDeleteState(project),
  };
}

export function createAskProjectForUser(input: {
  workspaceId: string;
  userId: string;
  title: string;
  aim?: string;
  objective?: string;
}) {
  return db.createAskProjectWithPath(
    {
      id: uuid(),
      workspace_id: input.workspaceId,
      title: input.title,
      aim: input.aim || "",
      objective: input.objective || "",
      documentation: "",
      owner_id: input.userId,
    },
    [
      { label: "Discover", detail: "Clarify the ask and constraints." },
      { label: "Design", detail: "Agree path, owners, and success criteria." },
      { label: "Build", detail: "Execute tasks and checklists." },
      { label: "Ship", detail: "Document outcomes and close the ask." },
    ]
  );
}

export function assertAskInWorkspace(
  projectId: string,
  workspaceId: string
): AskProject | null {
  const project = db.getAskProject(projectId);
  if (!project || project.workspace_id !== workspaceId) return null;
  return project;
}

export function assertAskMember(projectId: string, userId: string) {
  return db.getAskMember(projectId, userId);
}

/** Ensure a workspace user is on the ask as collaborator (idempotent). */
export function ensureAskCollaborator(projectId: string, userId: string) {
  const existing = db.getAskMember(projectId, userId);
  if (existing) return existing;
  return db.addAskMember({
    project_id: projectId,
    user_id: userId,
    role: "collaborator",
    joined_at: new Date().toISOString(),
  });
}

export function addAskCollaborator(input: {
  projectId: string;
  userId: string;
  workspaceId: string;
}) {
  const membership = db.getMembership(input.userId, input.workspaceId);
  if (!membership) return { error: "User is not in this workspace" as const };
  const existing = db.getAskMember(input.projectId, input.userId);
  if (existing) return { member: existing };
  const member = db.addAskMember({
    project_id: input.projectId,
    user_id: input.userId,
    role: "collaborator",
    joined_at: new Date().toISOString(),
  });
  return { member };
}

export function removeAskCollaborator(input: {
  project: AskProject;
  actorId: string;
  targetUserId: string;
}) {
  const actor = db.getAskMember(input.project.id, input.actorId);
  if (!actor) return { error: "Not a collaborator" as const };
  const target = db.getAskMember(input.project.id, input.targetUserId);
  if (!target) return { error: "Person not on this ask" as const };
  if (target.role === "owner") {
    return { error: "Cannot remove the ask owner" as const };
  }
  const isSelf = input.actorId === input.targetUserId;
  if (!isSelf && actor.role !== "owner") {
    return { error: "Only the owner can remove collaborators" as const };
  }
  db.removeAskMember(input.project.id, input.targetUserId);
  return { ok: true as const };
}

/** Start or continue unanimous delete. Returns whether project was deleted. */
export function confirmAskDelete(input: {
  project: AskProject;
  userId: string;
}): { deleted: boolean; error?: string } {
  const member = db.getAskMember(input.project.id, input.userId);
  if (!member) return { deleted: false, error: "Not a collaborator" };

  const stamp = new Date().toISOString();
  if (!input.project.delete_requested_at) {
    db.updateAskProject(input.project.id, {
      delete_requested_at: stamp,
      delete_requested_by: input.userId,
    });
  }

  db.upsertAskDeleteVote({
    project_id: input.project.id,
    user_id: input.userId,
    confirmed_at: stamp,
  });

  const project = db.getAskProject(input.project.id)!;
  const state = serializeAskDeleteState(project);
  if (state.unanimous) {
    return { deleted: true };
  }
  return { deleted: false };
}

export function cancelAskDelete(projectId: string, userId: string) {
  const member = db.getAskMember(projectId, userId);
  if (!member) return { error: "Not a collaborator" as const };
  db.clearAskDeleteVotes(projectId);
  return { ok: true as const };
}

export function purgeAskFiles(projectId: string) {
  const files = db.listAskFiles(projectId);
  for (const file of files) {
    const abs = path.join(process.cwd(), file.storage_path);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  }
}
