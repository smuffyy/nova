"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type HomePayload = {
  day: string;
  workspace: string;
  userName: string;
  focus: string;
  needsYou: {
    id: string;
    kind: "chat" | "meeting";
    title: string;
    detail: string;
    at: string;
    chatId?: string;
  }[];
  meetings: {
    id: string;
    title: string;
    inviteCode: string;
    updatedAt: string;
    memberCount: number;
    hostIsYou: boolean;
    imIn: boolean;
  }[];
  updates: {
    id: string;
    kind: "policy" | "team";
    title: string;
    detail: string;
    at: string;
  }[];
  recentChats: {
    id: string;
    title: string;
    preview: string;
    updatedAt: string;
  }[];
  counts: {
    meetings: number;
    waitingChats: number;
    updates: number;
  };
};

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || "there";
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function greetingLine() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function kindLabel(kind: string) {
  if (kind === "chat") return "Chat";
  if (kind === "meeting") return "Meetup";
  if (kind === "policy") return "Library";
  return "Update";
}

export function DesktopHome({
  userName,
  workspace,
  onOpenChat,
  onOpenPane,
}: {
  userName: string;
  workspace: string;
  onAskChat: (prompt: string) => void;
  onOpenChat: (chatId: string) => void;
  onOpenPane: (
    pane: "chat" | "asks" | "dojo" | "meetups" | "ledger" | "agents"
  ) => void;
  onOpenAsk?: (askId: string) => void;
}) {
  const [data, setData] = useState<HomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/desktop/home");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load home");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load home");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const name = firstName(data?.userName || userName);
  const ws = data?.workspace || workspace;
  const greeting = useMemo(() => greetingLine(), []);

  function handleNeed(item: HomePayload["needsYou"][number]) {
    if (item.chatId) onOpenChat(item.chatId);
    else if (item.kind === "meeting") onOpenPane("meetups");
  }

  if (loading) {
    return (
      <div className="desk-home">
        <p className="desk-home__loading">Getting your day ready…</p>
      </div>
    );
  }

  const needsYou = data?.needsYou || [];
  const meetings = data?.meetings || [];
  const updates = data?.updates || [];
  const recent = data?.recentChats || [];
  const counts = data?.counts;

  return (
    <div className="desk-home">
      <div className="desk-home__glow" aria-hidden />

      <header className="desk-home__hero">
        <p className="desk-home__day">{data?.day || ""}</p>
        <h1 className="desk-home__hello">
          <span className="desk-home__hello-soft">{greeting}</span>
          <span className="desk-home__hello-name">{name}</span>
        </h1>
        <p className="desk-home__lede">{data?.focus}</p>
        {counts ? (
          <p className="desk-home__countline">
            {[
              counts.waitingChats
                ? `${counts.waitingChats} waiting`
                : null,
              counts.meetings
                ? `${counts.meetings} meetup${counts.meetings === 1 ? "" : "s"}`
                : null,
              counts.updates
                ? `${counts.updates} update${counts.updates === 1 ? "" : "s"}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || ws}
          </p>
        ) : null}
        <div className="desk-home__cta">
          <button
            type="button"
            className="desk-home__btn desk-home__btn--primary"
            onClick={() => onOpenPane("chat")}
          >
            Open Chat
          </button>
          <button
            type="button"
            className="desk-home__btn"
            onClick={() => onOpenPane("meetups")}
          >
            Meetups
          </button>
          <a href="/app/digest" className="desk-home__btn">
            Open Digest
          </a>
        </div>
      </header>

      {error ? <p className="desk-error">{error}</p> : null}

      <section
        className="desk-home__section desk-home__section--happen"
        aria-label="Needs you"
      >
        <div className="desk-home__section-head">
          <h2>Needs you</h2>
          <p>Chats and meetings waiting on you.</p>
        </div>
        {needsYou.length === 0 ? (
          <p className="desk-home__empty">
            You’re clear. Nothing is blocking on you right now.
          </p>
        ) : (
          <ul className="desk-home__queue">
            {needsYou.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => handleNeed(item)}>
                  <span className={`desk-home__tag is-${item.kind}`}>
                    {kindLabel(item.kind)}
                  </span>
                  <span className="desk-home__queue-title">{item.title}</span>
                  <span className="desk-home__queue-detail">{item.detail}</span>
                  <span className="desk-home__queue-when">
                    {formatWhen(item.at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="desk-home__columns">
        <section className="desk-home__section" aria-label="Worth knowing">
          <div className="desk-home__section-head">
            <h2>Worth knowing</h2>
            <p>Company updates worth a glance.</p>
          </div>
          {updates.length === 0 ? (
            <p className="desk-home__empty">
              No new company updates this week.
            </p>
          ) : (
            <ul className="desk-home__news">
              {updates.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => onOpenPane("dojo")}
                  >
                    <span className={`desk-home__news-kind is-${u.kind}`}>
                      {kindLabel(u.kind)}
                    </span>
                    <span className="desk-home__news-title">{u.title}</span>
                    <span className="desk-home__news-detail">{u.detail}</span>
                    <span className="desk-home__news-when">
                      {formatWhen(u.at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="desk-home__section" aria-label="Meetings">
          <div className="desk-home__section-head">
            <h2>Your meetings</h2>
            <p>Meetups you’re in or hosting.</p>
          </div>
          {meetings.length === 0 ? (
            <div className="desk-home__empty-block">
              <p className="desk-home__empty">No open meetings for you.</p>
              <button
                type="button"
                className="desk-home__btn"
                onClick={() => onOpenPane("meetups")}
              >
                Browse Meetups
              </button>
            </div>
          ) : (
            <ul className="desk-home__meetings">
              {meetings.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => onOpenPane("meetups")}>
                    <span className="desk-home__meet-title">{m.title}</span>
                    <span className="desk-home__meet-meta">
                      {m.hostIsYou
                        ? "You’re hosting"
                        : m.imIn
                          ? "You’re in"
                          : "Open room"}
                      {" · "}
                      {m.memberCount}{" "}
                      {m.memberCount === 1 ? "person" : "people"}
                    </span>
                    <span className="desk-home__meet-when">
                      {formatWhen(m.updatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {recent.length > 0 ? (
        <section className="desk-home__section" aria-label="Continue">
          <div className="desk-home__section-head">
            <h2>Continue</h2>
            <p>Recent chats if you want to pick back up.</p>
          </div>
          <ul className="desk-home__chats">
            {recent.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => onOpenChat(c.id)}>
                  <span className="desk-home__chat-title">{c.title}</span>
                  {c.preview ? (
                    <span className="desk-home__chat-preview">{c.preview}</span>
                  ) : null}
                  <span className="desk-home__chat-when">
                    {formatWhen(c.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
