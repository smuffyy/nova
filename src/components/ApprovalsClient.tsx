"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Draft = {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  chatId: string | null;
  messageId: string | null;
  createdAt: string;
  decidedAt: string | null;
};

type Tab = "pending" | "approved" | "rejected";

export function ApprovalsClient() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [tab, setTab] = useState<Tab>("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/drafts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load drafts");
      setDrafts(data.drafts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => drafts.filter((d) => d.status === tab),
    [drafts, tab]
  );

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    for (const d of drafts) c[d.status] += 1;
    return c;
  }, [drafts]);

  async function decide(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-[var(--muted)]">Loading approvals…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--mineral)] uppercase">
          Approvals
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-wide">
          Agent drafts
        </h1>
        <p className="mt-2 max-w-xl text-[var(--muted)]">
          Queue agent replies from chat, then approve or reject before acting.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn ${tab === id ? "btn-primary" : "btn-ghost"} !px-3 !py-1.5 text-sm`}
            onClick={() => setTab(id)}
          >
            {label} · {counts[id]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-[var(--muted)]">No {tab} drafts.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((d) => {
            const open = expanded === d.id;
            return (
              <li key={d.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--mineral)]">
                      @{d.agentName}
                    </p>
                    <h2 className="mt-1 text-lg font-medium">{d.title}</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {new Date(d.createdAt).toLocaleString()}
                      {d.decidedAt
                        ? ` · decided ${new Date(d.decidedAt).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost !px-3 !py-1.5 text-sm"
                      onClick={() =>
                        setExpanded((v) => (v === d.id ? null : d.id))
                      }
                    >
                      {open ? "Hide" : "Show"}
                    </button>
                    {d.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary !px-3 !py-1.5 text-sm"
                          disabled={busyId === d.id}
                          onClick={() => void decide(d.id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost !px-3 !py-1.5 text-sm"
                          disabled={busyId === d.id}
                          onClick={() => void decide(d.id, "rejected")}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                {open ? (
                  <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--bg)]/40 p-4 text-sm leading-relaxed">
                    {d.body}
                  </pre>
                ) : (
                  <p className="mt-3 line-clamp-2 text-sm text-[var(--muted)]">
                    {d.body}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
