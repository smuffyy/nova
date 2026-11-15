"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AGENTS, type AgentDefinition } from "@/lib/agents/catalog";

type Citation = {
  sourceId: string;
  filename: string;
  chunkId: string;
  snippet: string;
};

type RoomMessage = {
  id: string;
  authorName: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentId: string | null;
  citations: Citation[];
  createdAt: string;
};

type RoomMember = {
  userId: string;
  name: string;
  role: string;
  shareSidekickId?: string | null;
  shareSidekickName?: string | null;
};

type Room = {
  id: string;
  title: string;
  inviteCode: string;
  status: "open" | "closed";
  kind?: "company" | "sidekick";
  folderLabel: string | null;
  artifactMd: string | null;
  isHost: boolean;
  myShareSidekickId?: string | null;
  members: RoomMember[];
  messages: RoomMessage[];
};

type SidekickOption = {
  id: string;
  name: string;
};

function mentionState(value: string, cursor: number) {
  const before = value.slice(0, cursor);
  const match = before.match(/@([A-Za-z]*)$/);
  if (!match) return null;
  return { prefix: match[1] || "", start: cursor - match[0].length };
}

export function MeetupRoomClient({
  roomId,
  onBack,
}: {
  roomId: string;
  onBack?: () => void;
}) {
  const [room, setRoom] = useState<Room | null>(null);
  const [sidekicks, setSidekicks] = useState<SidekickOption[]>([]);
  const [input, setInput] = useState("");
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mention = useMemo(() => mentionState(input, cursor), [input, cursor]);
  const suggestions = useMemo(() => {
    if (!mention) return [];
    const p = mention.prefix.toLowerCase();
    return AGENTS.filter(
      (a) =>
        !p ||
        a.name.toLowerCase().startsWith(p) ||
        a.id.startsWith(p) ||
        a.role.toLowerCase().startsWith(p)
    );
  }, [mention]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/meetups/${roomId}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load Meetup");
      return;
    }
    setRoom(data.room);
    setError("");
  }, [roomId]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(t);
  }, [load]);

  useEffect(() => {
    void fetch("/api/sidekicks")
      .then((r) => r.json())
      .then((d) => setSidekicks(d.sidekicks || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room?.messages, loading]);

  function applyMention(agent: AgentDefinition) {
    if (!mention) return;
    const before = input.slice(0, mention.start);
    const after = input.slice(cursor);
    const next = `${before}@${agent.name} ${after}`.replace(/\s{2,}/g, " ");
    setInput(next);
    const pos = before.length + agent.name.length + 2;
    setCursor(pos);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pos, pos);
    });
  }

  async function send() {
    const message = input.trim();
    if (!message || loading || room?.status !== "open") return;
    setInput("");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/meetups/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setRoom(data.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function summarize() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/meetups/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "summarize" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Summarize failed");
      setRoom(data.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summarize failed");
    } finally {
      setLoading(false);
    }
  }

  async function exportHandoff() {
    const res = await fetch(`/api/meetups/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Export failed");
      return;
    }
    const blob = new Blob([data.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = data.filename || "meetup-handoff.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function closeRoom() {
    if (!room?.isHost) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/meetups/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Close failed");
      setRoom(data.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Close failed");
    } finally {
      setLoading(false);
    }
  }

  async function copyInvite() {
    if (!room) return;
    await navigator.clipboard.writeText(room.inviteCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function setShareSidekick(shareSidekickId: string | null) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/meetups/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "share_sidekick", shareSidekickId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update share");
      setRoom(data.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update share");
    } finally {
      setLoading(false);
    }
  }

  if (!room && !error) {
    return <p className="text-[var(--muted)]">Loading Meetup…</p>;
  }
  if (!room) {
    return (
      <div className="space-y-3">
        <p className="text-[var(--danger)]">{error}</p>
        {onBack ? (
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Back to Meetups
          </button>
        ) : (
          <Link href="/app/meetups" className="btn btn-ghost">
            Back to Meetups
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="meetup-room grid gap-6 lg:grid-cols-[1fr_260px]">
      <section className="panel flex min-h-[70vh] flex-col overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div>
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="font-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase hover:text-[var(--fg)]"
              >
                ← Meetups
              </button>
            ) : (
              <Link
                href="/app/meetups"
                className="font-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase hover:text-[var(--fg)]"
              >
                ← Meetups
              </Link>
            )}
            <h1 className="mt-1 text-2xl font-medium tracking-wide">{room.title}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {room.status === "open" ? "Open" : "Closed"}
              {room.kind === "sidekick" ? " · Sidekick Meet" : " · Company"}
              {room.folderLabel ? ` · focus ${room.folderLabel}` : ""}
              {" · "}
              invite{" "}
              <button
                type="button"
                onClick={() => void copyInvite()}
                className="font-mono text-[var(--accent)] hover:underline"
              >
                {room.inviteCode}
              </button>
              {copied ? " · copied" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-ghost !px-3 !py-1.5 text-sm"
              onClick={() => void summarize()}
              disabled={loading || room.status !== "open"}
            >
              Relay summarize
            </button>
            <button
              type="button"
              className="btn btn-ghost !px-3 !py-1.5 text-sm"
              onClick={() => void exportHandoff()}
            >
              Export handoff
            </button>
            {room.isHost && room.status === "open" ? (
              <button
                type="button"
                className="btn btn-ghost !px-3 !py-1.5 text-sm"
                onClick={() => void closeRoom()}
                disabled={loading}
              >
                Close
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {room.messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[92%] rounded-2xl px-4 py-3 ${
                m.role === "user"
                  ? "ml-auto bg-[var(--fg)] text-[var(--bg)]"
                  : m.role === "system"
                    ? "border border-dashed border-[var(--line)] text-[var(--muted)]"
                    : "border border-[var(--line)] bg-[var(--bg)]"
              }`}
            >
              <div
                className={`mb-1 font-mono text-[11px] tracking-[0.12em] uppercase ${
                  m.role === "user" ? "opacity-70" : "text-[var(--accent)]"
                }`}
              >
                {m.authorName}
                {m.agentId ? " · agent" : ""}
              </div>
              <div className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">
                {m.content}
              </div>
              {m.citations?.length ? (
                <div className="mt-3 space-y-1 border-t border-[var(--line)] pt-2 text-sm">
                  {m.citations.slice(0, 3).map((c, i) => (
                    <div key={`${c.chunkId}-${i}`} className="text-[var(--muted)]">
                      [{i + 1}] {c.filename}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Working…</p>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          className="relative border-t border-[var(--line)] p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          {error ? <p className="mb-2 text-sm text-[var(--danger)]">{error}</p> : null}
          {mention && suggestions.length > 0 ? (
            <div className="agent-mention-menu" role="listbox">
              {suggestions.map((agent, i) => (
                <button
                  key={agent.id}
                  type="button"
                  className={`agent-mention-item ${i === mentionIndex ? "is-active" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyMention(agent);
                  }}
                >
                  <span className="font-medium">@{agent.name}</span>
                  <span className="text-[var(--muted)]">{agent.role}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex gap-3">
            <input
              ref={inputRef}
              className="input"
              placeholder={
                room.status === "open"
                  ? "Message teammates… or @Moony / @Relay"
                  : "Meetup closed"
              }
              value={input}
              disabled={room.status !== "open" || loading}
              onChange={(e) => {
                setInput(e.target.value);
                setCursor(e.target.selectionStart ?? e.target.value.length);
              }}
              onSelect={(e) =>
                setCursor(e.currentTarget.selectionStart ?? input.length)
              }
              onKeyDown={(e) => {
                if (!mention || suggestions.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMentionIndex((i) => (i + 1) % suggestions.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMentionIndex(
                    (i) => (i - 1 + suggestions.length) % suggestions.length
                  );
                } else if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  applyMention(suggestions[mentionIndex] || suggestions[0]);
                }
              }}
            />
            <button
              className="btn btn-primary"
              disabled={loading || !input.trim() || room.status !== "open"}
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Humans chat freely. AI only answers when you @ an agent.
            {room.kind === "sidekick"
              ? " Sidekick Meet uses your shared shelf when you summon an agent."
              : " Company Meetup stays on the company brain."}
          </p>
        </form>
      </section>

      <aside className="space-y-4">
        {room.kind === "sidekick" ? (
          <div className="panel p-4">
            <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
              Share your Sidekick
            </h2>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Agents answering your @mentions may use the shelf you share —
              intentional for this room only.
            </p>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(room.myShareSidekickId)}
                disabled={loading || room.status !== "open"}
                onChange={(e) => {
                  if (!e.target.checked) {
                    void setShareSidekick(null);
                    return;
                  }
                  const first =
                    room.myShareSidekickId || sidekicks[0]?.id || null;
                  void setShareSidekick(first);
                }}
              />
              Share a Sidekick into this room
            </label>
            {room.myShareSidekickId || sidekicks.length > 0 ? (
              <select
                className="input mt-3"
                disabled={
                  loading ||
                  room.status !== "open" ||
                  !room.myShareSidekickId
                }
                value={room.myShareSidekickId || ""}
                onChange={(e) =>
                  void setShareSidekick(e.target.value || null)
                }
              >
                <option value="">Choose Sidekick…</option>
                {sidekicks.map((sk) => (
                  <option key={sk.id} value={sk.id}>
                    {sk.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ) : null}
        <div className="panel p-4">
          <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
            In room
          </h2>
          <ul className="mt-3 space-y-2">
            {room.members.map((m) => (
              <li key={m.userId} className="flex justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">
                  {m.name}
                  {room.kind === "sidekick" && m.shareSidekickName ? (
                    <span className="mt-0.5 block font-mono text-[10px] text-[var(--muted)]">
                      sharing {m.shareSidekickName}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-[var(--muted)] uppercase">
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-4">
          <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
            Summon
          </h2>
          <div className="mt-3 space-y-2">
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                type="button"
                className="block w-full rounded-xl border border-[var(--line)] px-3 py-2 text-left text-sm hover:text-[var(--fg)]"
                onClick={() => {
                  setInput((prev) =>
                    prev.includes(`@${agent.name}`)
                      ? prev
                      : `@${agent.name} ${prev}`.trim() + " "
                  );
                  inputRef.current?.focus();
                }}
              >
                <span className="font-medium">@{agent.name}</span>
                <span className="ml-2 text-[var(--muted)]">{agent.role}</span>
              </button>
            ))}
          </div>
        </div>
        {room.artifactMd ? (
          <div className="panel p-4">
            <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
              Latest handoff
            </h2>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-[var(--muted)]">
              {room.artifactMd.slice(0, 1200)}
              {room.artifactMd.length > 1200 ? "…" : ""}
            </pre>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
