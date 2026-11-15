"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AskBomView,
  AskCostView,
  AskGanttView,
} from "@/components/asks/AskTrackerViews";

type Member = { userId: string; name: string; email: string };

type Collaborator = {
  userId: string;
  name: string;
  email: string;
  role: "owner" | "collaborator";
  joinedAt: string;
};

type DeleteState = {
  pending: boolean;
  requestedAt: string | null;
  requestedBy: string | null;
  requestedByName: string | null;
  confirmedUserIds: string[];
  confirmedCount: number;
  requiredCount: number;
  unanimous: boolean;
  members: {
    userId: string;
    name: string;
    role: string;
    confirmed: boolean;
  }[];
};

type AskView = "board" | "gantt" | "cost" | "bom";

type Project = {
  id: string;
  title: string;
  aim: string;
  objective: string;
  documentation: string;
  status: "active" | "paused" | "done";
  ownerName: string;
  ownerId: string;
  collaborators: Collaborator[];
  deleteState: DeleteState;
  path: {
    id: string;
    label: string;
    detail: string;
    status: "pending" | "current" | "done";
  }[];
  tasks: {
    id: string;
    title: string;
    notes: string;
    status: "todo" | "doing" | "done";
    assigneeId: string | null;
    assigneeName: string | null;
    startsOn: string | null;
    endsOn: string | null;
  }[];
  checklist: {
    id: string;
    taskId: string | null;
    title: string;
    done: boolean;
  }[];
  comments: {
    id: string;
    body: string;
    authorName: string;
    createdAt: string;
  }[];
  files: {
    id: string;
    filename: string;
    uploaderName: string;
    createdAt: string;
  }[];
  costs: {
    id: string;
    label: string;
    category: string;
    amount: number;
  }[];
  costTotal: number;
  bom: {
    id: string;
    partNumber: string;
    name: string;
    qty: number;
    unit: string;
    unitCost: number;
    lineTotal: number;
  }[];
  bomTotal: number;
};

type You = {
  userId: string;
  isCollaborator: boolean;
  role: "owner" | "collaborator" | null;
};

function emptyDeleteState(): DeleteState {
  return {
    pending: false,
    requestedAt: null,
    requestedBy: null,
    requestedByName: null,
    confirmedUserIds: [],
    confirmedCount: 0,
    requiredCount: 0,
    unanimous: false,
    members: [],
  };
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AsksDetailClient({
  projectId,
  onBack,
  onMutate,
  onDeleted,
}: {
  projectId: string;
  onBack?: () => void;
  onMutate?: () => void;
  onDeleted?: () => void;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [you, setYou] = useState<You | null>(null);
  const [inviteUserId, setInviteUserId] = useState("");
  const [error, setError] = useState("");
  const [booting, setBooting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [checkTitle, setCheckTitle] = useState("");
  const [comment, setComment] = useState("");
  const [pathLabel, setPathLabel] = useState("");
  const [view, setView] = useState<AskView>("board");
  const fileRef = useRef<HTMLInputElement>(null);

  const apply = useCallback(
    (data: { project: Project; members?: Member[]; you?: You }) => {
      const p = data.project;
      setProject({
        ...p,
        costs: p.costs || [],
        costTotal: p.costTotal || 0,
        bom: p.bom || [],
        bomTotal: p.bomTotal || 0,
        collaborators: p.collaborators || [],
        deleteState: p.deleteState || emptyDeleteState(),
        tasks: (p.tasks || []).map((t) => ({
          ...t,
          startsOn: t.startsOn ?? null,
          endsOn: t.endsOn ?? null,
        })),
      });
      if (data.members) setMembers(data.members);
      if (data.you) setYou(data.you);
    },
    []
  );

  const applyAndNotify = useCallback(
    (data: { project: Project; members?: Member[]; you?: You }) => {
      apply(data);
      onMutate?.();
    },
    [apply, onMutate]
  );

  const load = useCallback(async () => {
    const res = await fetch(`/api/asks/${projectId}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load ask");
    if (!data.project) throw new Error("Ask not found");
    apply(data);
  }, [projectId, apply]);

  useEffect(() => {
    setBooting(true);
    setError("");
    setProject(null);
    void load()
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load")
      )
      .finally(() => setBooting(false));
  }, [load]);

  async function patchProject(patch: Partial<Project>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/asks/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      applyAndNotify(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function postAction(action: string, body: Record<string, unknown> = {}) {
    setError("");
    const res = await fetch(`/api/asks/${projectId}?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    if (data.deleted) {
      onDeleted?.();
      onMutate?.();
      return data;
    }
    applyAndNotify(data);
    return data;
  }

  async function patchItem(
    itemId: string,
    kind: string,
    body: Record<string, unknown>
  ) {
    const res = await fetch(
      `/api/asks/${projectId}/items/${itemId}?kind=${kind}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    applyAndNotify(data);
  }

  async function deleteItem(itemId: string, kind: string) {
    const res = await fetch(
      `/api/asks/${projectId}/items/${itemId}?kind=${kind}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    applyAndNotify(data);
  }

  async function uploadFile(files: FileList | null) {
    if (!files?.length) return;
    const form = new FormData();
    form.append("file", files[0]);
    const res = await fetch(`/api/asks/${projectId}?action=file`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    applyAndNotify(data);
  }

  if (booting) {
    return <p className="asks-muted">Loading ask…</p>;
  }
  if (!project) {
    return (
      <div className="asks-shell">
        <p className="asks-error">{error || "Ask not found"}</p>
        {onBack ? (
          <button type="button" className="asks-back" onClick={onBack}>
            ← Asks
          </button>
        ) : (
          <Link href="/app/asks" className="asks-back">
            ← Asks
          </Link>
        )}
      </div>
    );
  }

  const canEdit = Boolean(you?.isCollaborator);
  const projectChecks = project.checklist.filter((c) => !c.taskId);
  const deleteState = project.deleteState || emptyDeleteState();
  const youConfirmed = Boolean(
    you?.userId && deleteState.confirmedUserIds.includes(you.userId)
  );
  const inviteOptions = members.filter(
    (m) => !project.collaborators.some((c) => c.userId === m.userId)
  );
  const views: { id: AskView; label: string }[] = [
    { id: "board", label: "Board" },
    { id: "gantt", label: "Gantt" },
    { id: "cost", label: "Project cost" },
    { id: "bom", label: "BOM" },
  ];

  return (
    <div className={`asks-detail ${view !== "board" ? "asks-detail--wide" : ""}`}>
      <div className="asks-detail__main">
        {onBack ? (
          <button type="button" className="asks-back" onClick={onBack}>
            ← Asks
          </button>
        ) : (
          <Link href="/app/asks" className="asks-back">
            ← Asks
          </Link>
        )}

        {error ? <p className="asks-error">{error}</p> : null}

        <div className="asks-detail__title-row">
          <input
            className="asks-title-input"
            value={project.title}
            disabled={!canEdit}
            onChange={(e) =>
              setProject({ ...project, title: e.target.value })
            }
            onBlur={() => {
              if (canEdit) void patchProject({ title: project.title });
            }}
          />
          <select
            className="asks-select"
            value={project.status}
            disabled={!canEdit}
            onChange={(e) =>
              void patchProject({
                status: e.target.value as Project["status"],
              })
            }
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="done">Done</option>
          </select>
          {canEdit && !deleteState.pending ? (
            <button
              type="button"
              className="asks-btn asks-btn--danger asks-btn--compact"
              onClick={() =>
                void postAction("request-delete").catch((err) =>
                  setError(err instanceof Error ? err.message : "Failed")
                )
              }
            >
              Delete
            </button>
          ) : null}
        </div>
        <p className="asks-muted">
          Owned by {project.ownerName}
          {project.collaborators.length > 1
            ? ` · ${project.collaborators.length} people`
            : ""}
          {saving ? " · Saving…" : ""}
          {!canEdit ? " · View only — ask an owner to add you" : ""}
        </p>

        {deleteState.pending ? (
          <div className="asks-delete-banner">
            <p>
              Delete requested
              {deleteState.requestedByName
                ? ` by ${deleteState.requestedByName}`
                : ""}
              . Needs confirmation from everyone on this ask (
              {deleteState.confirmedCount}/{deleteState.requiredCount}).
            </p>
            <ul className="asks-delete-votes">
              {deleteState.members.map((m) => (
                <li key={m.userId} className={m.confirmed ? "is-yes" : ""}>
                  {m.name}
                  <span>{m.confirmed ? "Confirmed" : "Waiting"}</span>
                </li>
              ))}
            </ul>
            <div className="asks-delete-actions">
              {canEdit && !youConfirmed ? (
                <button
                  type="button"
                  className="asks-btn asks-btn--danger"
                  onClick={() =>
                    void postAction("confirm-delete").catch((err) =>
                      setError(err instanceof Error ? err.message : "Failed")
                    )
                  }
                >
                  Confirm delete
                </button>
              ) : null}
              {canEdit ? (
                <button
                  type="button"
                  className="asks-btn"
                  onClick={() =>
                    void postAction("cancel-delete").catch((err) =>
                      setError(err instanceof Error ? err.message : "Failed")
                    )
                  }
                >
                  Cancel delete
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="asks-view-chips" role="tablist" aria-label="Tracker views">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              className={`asks-chip ${view === v.id ? "is-active" : ""}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === "gantt" ? (
          <AskGanttView
            tasks={project.tasks}
            onUpdateDates={(id, startsOn, endsOn) => {
              if (!canEdit) return;
              void patchItem(id, "task", { startsOn, endsOn }).catch((err) =>
                setError(err instanceof Error ? err.message : "Failed")
              );
            }}
          />
        ) : null}

        {view === "cost" ? (
          <AskCostView
            costs={project.costs || []}
            total={project.costTotal || 0}
            onAdd={(input) => {
              if (!canEdit) return;
              void postAction("cost", input).catch((err) =>
                setError(err instanceof Error ? err.message : "Failed")
              );
            }}
            onRemove={(id) => {
              if (!canEdit) return;
              void deleteItem(id, "cost").catch((err) =>
                setError(err instanceof Error ? err.message : "Failed")
              );
            }}
          />
        ) : null}

        {view === "bom" ? (
          <AskBomView
            bom={project.bom || []}
            total={project.bomTotal || 0}
            onAdd={(input) => {
              if (!canEdit) return;
              void postAction("bom", input).catch((err) =>
                setError(err instanceof Error ? err.message : "Failed")
              );
            }}
            onRemove={(id) => {
              if (!canEdit) return;
              void deleteItem(id, "bom").catch((err) =>
                setError(err instanceof Error ? err.message : "Failed")
              );
            }}
          />
        ) : null}

        {view === "board" ? (
          <>
        <section className="asks-block">
          <h2>People</h2>
          <p className="asks-muted">
            Collaborators can edit tasks, docs, and costs. Deleting the ask
            needs everyone here to confirm.
          </p>
          <ul className="asks-people">
            {project.collaborators.map((c) => (
              <li key={c.userId}>
                <div>
                  <strong>{c.name}</strong>
                  <span>{c.role === "owner" ? "Owner" : "Collaborator"}</span>
                </div>
                {canEdit &&
                c.role !== "owner" &&
                (you?.role === "owner" || you?.userId === c.userId) ? (
                  <button
                    type="button"
                    className="asks-icon-btn"
                    aria-label={`Remove ${c.name}`}
                    onClick={() =>
                      void postAction("remove-member", {
                        userId: c.userId,
                      }).catch((err) =>
                        setError(err instanceof Error ? err.message : "Failed")
                      )
                    }
                  >
                    ×
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {canEdit && inviteOptions.length > 0 ? (
            <form
              className="asks-inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!inviteUserId) return;
                void postAction("add-member", { userId: inviteUserId })
                  .then(() => setInviteUserId(""))
                  .catch((err) =>
                    setError(err instanceof Error ? err.message : "Failed")
                  );
              }}
            >
              <select
                className="asks-select"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
              >
                <option value="">Add collaborator…</option>
                {inviteOptions.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="asks-btn"
                disabled={!inviteUserId}
              >
                Invite
              </button>
            </form>
          ) : null}
        </section>

        <section className="asks-block">
          <h2>Aim</h2>
          <textarea
            className="asks-area"
            rows={2}
            placeholder="What this ask is trying to achieve"
            value={project.aim}
            disabled={!canEdit}
            onChange={(e) => setProject({ ...project, aim: e.target.value })}
            onBlur={() => {
              if (canEdit) void patchProject({ aim: project.aim });
            }}
          />
        </section>

        <section className="asks-block">
          <h2>Objective</h2>
          <textarea
            className="asks-area"
            rows={3}
            placeholder="Measurable outcomes and success criteria"
            value={project.objective}
            disabled={!canEdit}
            onChange={(e) =>
              setProject({ ...project, objective: e.target.value })
            }
            onBlur={() => {
              if (canEdit) void patchProject({ objective: project.objective });
            }}
          />
        </section>

        <section className="asks-block">
          <h2>Documentation</h2>
          <textarea
            className="asks-area asks-area--doc"
            rows={8}
            placeholder="Context, decisions, links, notes…"
            value={project.documentation}
            disabled={!canEdit}
            onChange={(e) =>
              setProject({ ...project, documentation: e.target.value })
            }
            onBlur={() => {
              if (canEdit)
                void patchProject({ documentation: project.documentation });
            }}
          />
        </section>

        <section className="asks-block">
          <div className="asks-block__head">
            <h2>Tasks</h2>
          </div>
          <ul className="asks-tasks">
            {project.tasks.map((t) => (
              <li key={t.id} className="asks-task">
                <select
                  className="asks-select asks-select--sm"
                  value={t.status}
                  disabled={!canEdit}
                  onChange={(e) =>
                    void patchItem(t.id, "task", {
                      status: e.target.value,
                    }).catch((err) =>
                      setError(err instanceof Error ? err.message : "Failed")
                    )
                  }
                >
                  <option value="todo">To do</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                </select>
                <input
                  className="asks-inline-input"
                  value={t.title}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      tasks: project.tasks.map((x) =>
                        x.id === t.id ? { ...x, title: e.target.value } : x
                      ),
                    })
                  }
                  onBlur={() => {
                    if (canEdit) void patchItem(t.id, "task", { title: t.title });
                  }}
                />
                <select
                  className="asks-select asks-select--sm"
                  value={t.assigneeId || ""}
                  disabled={!canEdit}
                  onChange={(e) =>
                    void patchItem(t.id, "task", {
                      assigneeId: e.target.value || null,
                    }).catch((err) =>
                      setError(err instanceof Error ? err.message : "Failed")
                    )
                  }
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {canEdit ? (
                  <button
                    type="button"
                    className="asks-icon-btn"
                    aria-label="Remove task"
                    onClick={() =>
                      void deleteItem(t.id, "task").catch((err) =>
                        setError(err instanceof Error ? err.message : "Failed")
                      )
                    }
                  >
                    ×
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {canEdit ? (
            <form
              className="asks-inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!taskTitle.trim()) return;
                void postAction("task", { title: taskTitle.trim() })
                  .then(() => setTaskTitle(""))
                  .catch((err) =>
                    setError(err instanceof Error ? err.message : "Failed")
                  );
              }}
            >
              <input
                placeholder="Add a task"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
              <button type="submit" className="asks-btn">
                Add
              </button>
            </form>
          ) : null}
        </section>

        <section className="asks-block">
          <h2>To-do list</h2>
          <ul className="asks-checks">
            {projectChecks.map((c) => (
              <li key={c.id}>
                <label className="asks-check">
                  <input
                    type="checkbox"
                    checked={c.done}
                    disabled={!canEdit}
                    onChange={(e) =>
                      void patchItem(c.id, "checklist", {
                        done: e.target.checked,
                      }).catch((err) =>
                        setError(err instanceof Error ? err.message : "Failed")
                      )
                    }
                  />
                  <span className={c.done ? "is-done" : ""}>{c.title}</span>
                </label>
                {canEdit ? (
                  <button
                    type="button"
                    className="asks-icon-btn"
                    onClick={() =>
                      void deleteItem(c.id, "checklist").catch((err) =>
                        setError(err instanceof Error ? err.message : "Failed")
                      )
                    }
                  >
                    ×
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {canEdit ? (
            <form
              className="asks-inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!checkTitle.trim()) return;
                void postAction("checklist", { title: checkTitle.trim() })
                  .then(() => setCheckTitle(""))
                  .catch((err) =>
                    setError(err instanceof Error ? err.message : "Failed")
                  );
              }}
            >
              <input
                placeholder="Add a checklist item"
                value={checkTitle}
                onChange={(e) => setCheckTitle(e.target.value)}
              />
              <button type="submit" className="asks-btn">
                Add
              </button>
            </form>
          ) : null}
        </section>

        <section className="asks-block">
          <div className="asks-block__head">
            <h2>Files</h2>
            {canEdit ? (
              <button
                type="button"
                className="asks-btn"
                onClick={() => fileRef.current?.click()}
              >
                Upload
              </button>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                void uploadFile(e.target.files).catch((err) =>
                  setError(err instanceof Error ? err.message : "Upload failed")
                );
                e.target.value = "";
              }}
            />
          </div>
          {project.files.length === 0 ? (
            <p className="asks-muted">No files yet.</p>
          ) : (
            <ul className="asks-files">
              {project.files.map((f) => (
                <li key={f.id}>
                  <a
                    href={`/api/asks/${projectId}/files/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {f.filename}
                  </a>
                  <span>
                    {f.uploaderName} · {formatWhen(f.createdAt)}
                  </span>
                  {canEdit ? (
                    <button
                      type="button"
                      className="asks-icon-btn"
                      onClick={() =>
                        void deleteItem(f.id, "file").catch((err) =>
                          setError(err instanceof Error ? err.message : "Failed")
                        )
                      }
                    >
                      ×
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="asks-block">
          <h2>Comments</h2>
          <ul className="asks-comments">
            {project.comments.map((c) => (
              <li key={c.id}>
                <div>
                  <strong>{c.authorName}</strong>
                  <span>{formatWhen(c.createdAt)}</span>
                </div>
                <p>{c.body}</p>
              </li>
            ))}
          </ul>
          {canEdit ? (
            <form
              className="asks-inline-form asks-inline-form--stack"
              onSubmit={(e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                void postAction("comment", { body: comment.trim() })
                  .then(() => setComment(""))
                  .catch((err) =>
                    setError(err instanceof Error ? err.message : "Failed")
                  );
              }}
            >
              <textarea
                rows={3}
                placeholder="Leave a comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button type="submit" className="asks-btn asks-btn--primary">
                Comment
              </button>
            </form>
          ) : null}
        </section>

        {canEdit && !deleteState.pending ? (
          <section className="asks-block asks-block--danger">
            <h2>Delete ask</h2>
            <p className="asks-muted">
              Everyone on this ask must confirm before it is permanently
              removed.
            </p>
            <button
              type="button"
              className="asks-btn asks-btn--danger"
              onClick={() =>
                void postAction("request-delete").catch((err) =>
                  setError(err instanceof Error ? err.message : "Failed")
                )
              }
            >
              Request delete
            </button>
          </section>
        ) : null}
          </>
        ) : null}
      </div>

      {view === "board" ? (
      <aside className="asks-rail" aria-label="Project path">
        <h2>Project path</h2>
        <p className="asks-rail__sub">
          Flow from discovery to ship. Mark steps as you move.
        </p>

        <ol className="asks-flow">
          {project.path.map((step, i) => (
            <li key={step.id} className={`asks-flow__step is-${step.status}`}>
              {i > 0 ? <span className="asks-flow__line" aria-hidden /> : null}
              <button
                type="button"
                className="asks-flow__node"
                title="Cycle status"
                disabled={!canEdit}
                onClick={() => {
                  if (!canEdit) return;
                  const order = ["pending", "current", "done"] as const;
                  const next =
                    order[(order.indexOf(step.status) + 1) % order.length];
                  void patchItem(step.id, "path", { status: next }).catch(
                    (err) =>
                      setError(err instanceof Error ? err.message : "Failed")
                  );
                }}
              >
                <span className="asks-flow__dot" />
                <span className="asks-flow__label">{step.label}</span>
              </button>
              {step.detail ? (
                <p className="asks-flow__detail">{step.detail}</p>
              ) : null}
            </li>
          ))}
        </ol>

        {canEdit ? (
          <form
            className="asks-inline-form asks-inline-form--stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (!pathLabel.trim()) return;
              void postAction("path", { label: pathLabel.trim() })
                .then(() => setPathLabel(""))
                .catch((err) =>
                  setError(err instanceof Error ? err.message : "Failed")
                );
            }}
          >
            <input
              placeholder="Add path step"
              value={pathLabel}
              onChange={(e) => setPathLabel(e.target.value)}
            />
            <button type="submit" className="asks-btn">
              Add step
            </button>
          </form>
        ) : null}

        <div className="asks-rail__summary">
          <h3>At a glance</h3>
          <dl>
            <div>
              <dt>Aim</dt>
              <dd>{project.aim || "—"}</dd>
            </div>
            <div>
              <dt>Objective</dt>
              <dd>{project.objective || "—"}</dd>
            </div>
            <div>
              <dt>People</dt>
              <dd>{project.collaborators.length}</dd>
            </div>
            <div>
              <dt>Tasks</dt>
              <dd>
                {project.tasks.filter((t) => t.status === "done").length}/
                {project.tasks.length} done
              </dd>
            </div>
            <div>
              <dt>Checklist</dt>
              <dd>
                {projectChecks.filter((c) => c.done).length}/
                {projectChecks.length} done
              </dd>
            </div>
          </dl>
        </div>
      </aside>
      ) : null}
    </div>
  );
}
