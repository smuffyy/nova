"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ProjectSummary = {
  id: string;
  title: string;
  aim: string;
  objective: string;
  status: "active" | "paused" | "done";
  ownerName: string;
  updatedAt: string;
  taskCount: number;
  tasksDone: number;
  checklistCount: number;
  checklistDone: number;
  collaboratorCount?: number;
  deletePending?: boolean;
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function AsksListClient() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [aim, setAim] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/asks");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load Asks");
    setProjects(data.projects || []);
  }, []);

  useEffect(() => {
    void load()
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load Asks")
      )
      .finally(() => setLoading(false));
  }, [load]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/asks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), aim: aim.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create");
      setTitle("");
      setAim("");
      await load();
      window.location.href = `/app/asks/${data.project.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="asks-shell">
      <header className="asks-hero">
        <p className="asks-eyebrow">Workspace</p>
        <h1>Asks</h1>
        <p className="asks-lede">
          Collaborative project tracking — invite people, share work, and delete
          only when everyone confirms.
        </p>
      </header>

      {error ? <p className="asks-error">{error}</p> : null}

      <form className="asks-new" onSubmit={(e) => void createProject(e)}>
        <input
          className="asks-new__title"
          placeholder="New ask title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="asks-new__aim"
          placeholder="Aim (optional)"
          value={aim}
          onChange={(e) => setAim(e.target.value)}
        />
        <button type="submit" className="asks-btn asks-btn--primary" disabled={creating}>
          {creating ? "Creating…" : "Create"}
        </button>
      </form>

      {loading ? (
        <p className="asks-muted">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="asks-empty">No asks yet. Start with a clear title and aim.</p>
      ) : (
        <ul className="asks-list">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/app/asks/${p.id}`} className="asks-row">
                <div className="asks-row__main">
                  <span className={`asks-status asks-status--${p.status}`}>
                    {p.status}
                  </span>
                  <h2>{p.title}</h2>
                  {p.aim ? <p>{p.aim}</p> : null}
                </div>
                <div className="asks-row__meta">
                  <span>
                    {p.tasksDone}/{p.taskCount} tasks
                  </span>
                  {p.collaboratorCount ? (
                    <span>
                      {p.collaboratorCount}{" "}
                      {p.collaboratorCount === 1 ? "person" : "people"}
                    </span>
                  ) : null}
                  {p.deletePending ? <span>Delete pending</span> : null}
                  <span>{formatWhen(p.updatedAt)}</span>
                  <span>{p.ownerName}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
