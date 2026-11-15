"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Citation = {
  sourceId: string;
  filename: string;
  chunkId: string;
  snippet: string;
};

type MeetupSummary = {
  id: string;
  title: string;
  status: string;
  inviteCode?: string;
  memberCount?: number;
};

type AskSummary = {
  id: string;
  title: string;
  status: string;
};

export function DigestClient() {
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [meta, setMeta] = useState("");
  const [meetings, setMeetings] = useState<MeetupSummary[]>([]);
  const [asks, setAsks] = useState<AskSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch("/api/digest").then((r) => r.json()),
      fetch("/api/meetups").then((r) => r.json()),
      fetch("/api/asks").then((r) => r.json()),
    ])
      .then(([digest, meetups, asksData]) => {
        setMeta(
          `${digest.sourceCount || 0} sources · ${digest.chunkCount || 0} chunks · graph ${digest.graph?.nodeCount || 0} nodes`
        );
        const rooms: MeetupSummary[] = meetups.rooms || [];
        setMeetings(rooms.filter((r) => r.status === "open"));
        const projects: AskSummary[] = asksData.projects || [];
        setAsks(projects.filter((p) => (p.status || "active") === "active"));
      })
      .catch(() => undefined);
  }, []);

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Digest failed");
      setAnswer(data.answer || "");
      setCitations(data.citations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Digest failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--mineral)] uppercase">
            Digest
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-wide">
            Week&apos;s pulse
          </h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            Cited summary from meetings, asks, and company memory — not vibe
            notes.
            {meta ? ` ${meta}.` : ""}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading}
          onClick={() => void run()}
        >
          {loading ? "Gathering…" : "Generate digest"}
        </button>
      </div>

      {!answer ? (
        <div className="grid gap-4 md:grid-cols-3">
          <section className="panel p-5">
            <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
              Open meetings
            </h2>
            {meetings.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">None open.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {meetings.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/app/meetups/${m.id}`}
                      className="hover:underline"
                    >
                      {m.title}
                    </Link>
                    {m.memberCount != null ? (
                      <span className="ml-2 text-[var(--muted)]">
                        · {m.memberCount}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel p-5">
            <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
              Active asks
            </h2>
            {asks.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">None active.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {asks.map((a) => (
                  <li key={a.id}>
                    <Link href={`/app/asks/${a.id}`} className="hover:underline">
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel p-5">
            <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
              Library
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {meta || "Loading company memory…"}
            </p>
            <Link
              href="/app/workspace/library"
              className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
            >
              Open Library
            </Link>
          </section>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      {answer ? (
        <article className="panel p-6">
          <div className="whitespace-pre-wrap text-[1.02rem] leading-relaxed">
            {answer}
          </div>
          {citations.length > 0 ? (
            <div className="mt-4">
              <button
                type="button"
                className="chat-refs__toggle"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? "Hide references" : `See references · ${citations.length}`}
              </button>
              {open ? (
                <ul className="chat-refs__list mt-3">
                  {citations.map((c, i) => (
                    <li key={`${c.chunkId}-${i}`}>
                      <a
                        className="chat-refs__file hover:underline"
                        href="/app/workspace/library"
                      >
                        [{i + 1}] {c.filename}
                      </a>
                      <span className="chat-refs__snip">{c.snippet}…</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </article>
      ) : (
        <p className="text-[var(--muted)]">
          Generate a digest to see this week&apos;s grounded pulse from
          meetings, asks, and the library.
        </p>
      )}
    </div>
  );
}
