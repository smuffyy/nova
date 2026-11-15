"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ConnectorKind = "books" | "calendar" | "email";

type Source = {
  id: string;
  filename: string;
  status: string;
  error_message: string | null;
  updated_at: string;
};

const CARDS: {
  type: ConnectorKind;
  title: string;
  hint: string;
  accept: string;
}[] = [
  {
    type: "books",
    title: "Books",
    hint: "Expenses, invoices, and P&L CSV/PDF exports from QuickBooks, Xero, or your accountant.",
    accept: ".csv,.pdf,.xlsx,.xls,.txt",
  },
  {
    type: "calendar",
    title: "Calendar notes",
    hint: "Meeting notes or calendar export dumps — titles and decisions, not live sync yet.",
    accept: ".csv,.pdf,.txt,.md",
  },
  {
    type: "email",
    title: "Email summary",
    hint: "Mail digests or thread exports so Digest can cite what landed this week.",
    accept: ".csv,.pdf,.txt,.md",
  },
];

export function ConnectorsClient() {
  const [sources, setSources] = useState<Source[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [uploading, setUploading] = useState<ConnectorKind | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    const [sessionRes, sourcesRes] = await Promise.all([
      fetch("/api/session"),
      fetch("/api/sources"),
    ]);
    const session = await sessionRes.json().catch(() => ({}));
    const caps: string[] = session.capabilities || [];
    setAllowed(
      caps.includes("dojo.company") || caps.includes("finance.money")
    );
    const data = await sourcesRes.json().catch(() => ({}));
    const all: Source[] = data.sources || [];
    setSources(
      all.filter((s) => /^\[(books|calendar|email)\]\s/i.test(s.filename))
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(type: ConnectorKind, file: File | null) {
    if (!file) return;
    setUploading(type);
    setError("");
    setOk("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      const res = await fetch("/api/connectors/import", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Upload failed");
      setOk(`Ingested ${data.source?.filename || file.name}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--mineral)] uppercase">
          Connectors
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-wide">
          Export bridges
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Live QuickBooks, Xero, calendar, and mail sync comes later. Today,
          upload CSV or PDF exports into the company library so Chat, Digest,
          and Meetup can cite them.
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Files land in{" "}
          <Link
            href="/app/workspace/library"
            className="text-[var(--fg)] underline-offset-2 hover:underline"
          >
            Library
          </Link>{" "}
          with a type prefix like{" "}
          <span className="font-mono text-[var(--fg)]">[books]</span>.
        </p>
      </div>

      {!allowed ? (
        <p className="text-sm text-[var(--muted)]">
          Connectors need Library or Money access for your role.
        </p>
      ) : null}

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {ok ? <p className="text-sm text-[var(--accent)]">{ok}</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map((card) => (
          <article key={card.type} className="panel flex flex-col gap-4 p-5">
            <div>
              <h2 className="text-lg font-medium tracking-wide">{card.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{card.hint}</p>
            </div>
            {allowed ? (
              <label className="btn btn-primary mt-auto cursor-pointer self-start">
                {uploading === card.type ? "Uploading…" : "Upload export"}
                <input
                  type="file"
                  className="hidden"
                  accept={card.accept}
                  disabled={uploading !== null}
                  onChange={(e) =>
                    void onUpload(card.type, e.target.files?.[0] || null)
                  }
                />
              </label>
            ) : (
              <p className="text-sm text-[var(--muted)]">Read-only</p>
            )}
          </article>
        ))}
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
          Recent connector uploads
        </h2>
        <div className="panel mt-3 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-[var(--muted)]">
                    No connector exports yet.
                  </td>
                </tr>
              ) : (
                sources.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-4 py-3">{s.filename}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          s.status === "ready"
                            ? "text-[var(--accent)]"
                            : s.status === "error"
                              ? "text-[var(--danger)]"
                              : "text-[var(--mineral)]"
                        }
                      >
                        {s.status}
                      </span>
                      {s.error_message ? (
                        <div className="mt-1 text-xs text-[var(--danger)]">
                          {s.error_message}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {s.updated_at}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
