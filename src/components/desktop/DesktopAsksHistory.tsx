"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { SwipeRow } from "@/components/SwipeRow";

export type AskHistoryItem = {
  id: string;
  title: string;
  aim: string;
  status: "active" | "paused" | "done" | string;
  ownerName: string;
  updatedAt: string;
  taskCount: number;
  tasksDone: number;
  tasksTodo: number;
  tasksDoing: number;
  deletePending?: boolean;
  openTasks: {
    id: string;
    title: string;
    status: "todo" | "doing";
    assigneeName: string | null;
  }[];
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function DesktopAsksHistory({
  selectedId,
  onSelect,
  refreshKey = 0,
  onCreated,
  onChanged,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  refreshKey?: number;
  onCreated?: (id: string) => void;
  onChanged?: () => void;
}) {
  const [projects, setProjects] = useState<AskHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const booted = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/asks");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load");
    setProjects(data.projects || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const first = !booted.current;
    if (first) setLoading(true);
    void load()
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) {
          booted.current = true;
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [load, refreshKey]);

  useEffect(() => {
    if (composerOpen) titleRef.current?.focus();
  }, [composerOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = projects;
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.aim || "").toLowerCase().includes(q) ||
          p.openTasks.some((t) => t.title.toLowerCase().includes(q))
      );
    }
    return list;
  }, [projects, query]);

  const active = filtered.filter((p) => p.status === "active");
  const pending = filtered.filter((p) => p.status === "paused");
  const done = filtered.filter((p) => p.status === "done");

  async function createAsk(e?: FormEvent) {
    e?.preventDefault();
    const title = newTitle.trim();
    if (!title || creating) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/asks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setNewTitle("");
      setComposerOpen(false);
      await load();
      onSelect(data.project.id);
      onCreated?.(data.project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function requestDeleteAsk(id: string) {
    setError("");
    const res = await fetch(`/api/asks/${id}?action=request-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not delete ask");
      return;
    }
    if (data.deleted) {
      if (selectedId === id) onSelect(null);
      await load();
      onChanged?.();
      return;
    }
    await load();
    onChanged?.();
    onSelect(id);
  }

  function renderGroup(label: string, items: AskHistoryItem[]) {
    if (!items.length) return null;
    return (
      <div className="desk-ask-hist__group">
        <p className="desk-ask-hist__label">{label}</p>
        <ul className="desk-ask-hist__list">
          {items.map((p) => {
            const openCount = (p.tasksTodo || 0) + (p.tasksDoing || 0);
            return (
              <li key={p.id}>
                <SwipeRow
                  active={selectedId === p.id}
                  onSelect={() => onSelect(p.id)}
                  actions={[
                    {
                      id: "delete",
                      label: p.deletePending ? "Confirm" : "Delete",
                      tone: "danger",
                      onClick: () => void requestDeleteAsk(p.id),
                    },
                  ]}
                >
                  <div className="desk-ask-hist__ask-body">
                    <span className="desk-ask-hist__title">{p.title}</span>
                    <span className="desk-ask-hist__meta">
                      {openCount > 0
                        ? `${openCount} open · ${p.tasksDone}/${p.taskCount}`
                        : `${p.tasksDone}/${p.taskCount} done`}
                      {" · "}
                      {formatWhen(p.updatedAt)}
                      {p.deletePending ? " · delete pending" : ""}
                    </span>
                  </div>
                </SwipeRow>
                {p.openTasks?.length ? (
                  <ul className="desk-ask-hist__tasks">
                    {p.openTasks.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          className={`desk-ask-hist__task is-${t.status}`}
                          onClick={() => onSelect(p.id)}
                        >
                          <em>{t.status === "doing" ? "Doing" : "To do"}</em>
                          <span>{t.title}</span>
                          {t.assigneeName ? (
                            <small>{t.assigneeName}</small>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="desk-ask-hist">
      <input
        className="desk-search"
        placeholder="Search asks & tasks…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {composerOpen ? (
        <form className="desk-ask-hist__composer" onSubmit={(e) => void createAsk(e)}>
          <input
            ref={titleRef}
            className="desk-ask-hist__composer-input"
            placeholder="Ask title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={creating}
          />
          <div className="desk-ask-hist__composer-actions">
            <button
              type="button"
              className="desk-ask-hist__ghost"
              disabled={creating}
              onClick={() => {
                setComposerOpen(false);
                setNewTitle("");
                setError("");
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="desk-new"
              disabled={creating || !newTitle.trim()}
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="desk-new"
          onClick={() => setComposerOpen(true)}
        >
          New ask
        </button>
      )}

      {error ? <p className="desk-error">{error}</p> : null}

      {loading ? (
        <p className="desk-side__sub">Loading history…</p>
      ) : filtered.length === 0 ? (
        <p className="desk-side__sub">No asks yet — create one to start.</p>
      ) : (
        <>
          {renderGroup("Active", active)}
          {renderGroup("Pending", pending)}
          {renderGroup("Done", done)}
        </>
      )}
    </div>
  );
}
