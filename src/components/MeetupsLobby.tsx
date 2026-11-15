"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type RoomSummary = {
  id: string;
  title: string;
  inviteCode: string;
  status: "open" | "closed";
  kind?: "company" | "sidekick";
  folderLabel: string | null;
  memberCount: number;
  updatedAt: string;
  isHost: boolean;
};

export function MeetupsLobby() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [title, setTitle] = useState("");
  const [folderLabel, setFolderLabel] = useState("");
  const [sidekickMeet, setSidekickMeet] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/meetups");
    const data = await res.json();
    setRooms(data.rooms || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title,
          folderLabel: folderLabel || undefined,
          kind: sidekickMeet ? "sidekick" : "company",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create");
      router.push(`/app/meetups/${data.room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create");
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not join");
      router.push(`/app/meetups/${data.room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--mineral)] uppercase">
          Meetup Rooms · v1
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-wide sm:text-4xl">
          Collaborate with grounded memory
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Company Meetup uses the company brain only. Sidekick Meet lets each
          person intentionally share one personal Sidekick shelf for this room —
          temporary context, not a permanent merge. 2–5 teammates · @agents on
          demand · Relay summarizes into a handoff.
        </p>
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={createRoom} className="panel space-y-4 p-5">
          <h2 className="text-lg font-medium tracking-wide">Start a Meetup</h2>
          <input
            className="input"
            placeholder="e.g. Contoso invoice dispute"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Optional folder focus (Books, Standards…)"
            value={folderLabel}
            onChange={(e) => setFolderLabel(e.target.value)}
          />
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={sidekickMeet}
              onChange={(e) => setSidekickMeet(e.target.checked)}
            />
            <span>
              <span className="font-medium">Sidekick Meet</span>
              <span className="mt-0.5 block text-[var(--muted)]">
                Host auto-shares their default Sidekick. Teammates pick which
                shelf to share. Company Meetups stay company-only.
              </span>
            </span>
          </label>
          <button className="btn btn-primary" disabled={busy || !title.trim()}>
            {busy ? "Opening…" : "Open room"}
          </button>
        </form>

        <form onSubmit={joinRoom} className="panel space-y-4 p-5">
          <h2 className="text-lg font-medium tracking-wide">Join with invite code</h2>
          <input
            className="input font-mono uppercase tracking-[0.2em]"
            placeholder="ABC123"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
          />
          <button className="btn btn-ghost" disabled={busy || !inviteCode.trim()}>
            Join room
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
          Your workspace Meetups
        </h2>
        <div className="mt-3 space-y-2">
          {rooms.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No Meetups yet.</p>
          ) : (
            rooms.map((room) => (
              <Link
                key={room.id}
                href={`/app/meetups/${room.id}`}
                className="panel flex items-center justify-between gap-4 px-4 py-3 hover:border-[var(--muted)]"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{room.title}</div>
                  <div className="mt-1 font-mono text-[11px] text-[var(--muted)]">
                    {room.status}
                    {room.kind === "sidekick" ? " · sidekick meet" : " · company"}
                    {" · "}
                    {room.memberCount} people · code {room.inviteCode}
                    {room.folderLabel ? ` · ${room.folderLabel}` : ""}
                  </div>
                </div>
                <span className="text-sm text-[var(--muted)]">Open</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
