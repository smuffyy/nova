"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AGENTS } from "@/lib/agents/catalog";
import { AnswerText } from "@/components/AnswerText";
import { DesktopHome } from "@/components/desktop/DesktopHome";
import { DesktopAsks } from "@/components/desktop/DesktopAsks";
import { DesktopAsksHistory } from "@/components/desktop/DesktopAsksHistory";
import { MeetupRoomClient } from "@/components/MeetupRoomClient";
import { SwipeRow } from "@/components/SwipeRow";
import { AtmosphereRotator } from "@/components/AtmosphereRotator";
import { ThemeToggle } from "@/components/ThemeProvider";
import {
  formatMoney,
  type LedgerMoneySnapshot,
} from "@/lib/ledger/money";

type Pane =
  | "home"
  | "chat"
  | "asks"
  | "dojo"
  | "agents"
  | "meetups"
  | "ledger"
  | "preferences";

type SessionInfo = {
  name: string;
  email: string;
  role: string;
  workspace: string;
  canWorkspace: boolean;
};

type Citation = {
  sourceId: string;
  filename: string;
  chunkId: string;
  snippet: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  agentName?: string | null;
};

type Source = {
  id: string;
  filename: string;
  status: string;
  updated_at: string;
};

type MeetupSummary = {
  id: string;
  title: string;
  inviteCode: string;
  status: string;
  memberCount: number;
  kind?: "company" | "sidekick";
};

type ChatSummary = {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
  preview?: string;
  summary?: string;
  agent?: string | null;
  pinnedAt?: string | null;
};

type KnowledgePillSummary = {
  id: string;
  title: string;
  body: string;
  bullets: string[];
  exportMd?: string | null;
  sourceChatId: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function RailIcon({ name }: { name: Pane | "settings" }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    );
  }
  if (name === "chat") {
    return (
      <svg {...common}>
        <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-4 3.5V16H7.5A2.5 2.5 0 0 1 5 13.5v-7Z" />
      </svg>
    );
  }
  if (name === "asks") {
    return (
      <svg {...common}>
        <path d="M8 5h8a2 2 0 0 1 2 2v12l-3-2-3 2-3-2-3 2V7a2 2 0 0 1 2-2Z" />
        <path d="M10 9h4M10 12h4M10 15h2" />
      </svg>
    );
  }
  if (name === "dojo") {
    return (
      <svg {...common}>
        <path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Z" />
        <path d="M12 11v9M4 7.5 12 11l8-3.5" />
      </svg>
    );
  }
  if (name === "agents") {
    return (
      <svg {...common}>
        <circle cx="9" cy="9" r="3" />
        <circle cx="16" cy="10" r="2.5" />
        <path d="M4 18c1.2-2.4 3-3.5 5-3.5s3.8 1.1 5 3.5M13.5 18c.6-1.4 1.6-2.2 3-2.2s2.2.7 2.8 2.2" />
      </svg>
    );
  }
  if (name === "meetups") {
    return (
      <svg {...common}>
        <circle cx="8" cy="9" r="2.5" />
        <circle cx="16" cy="9" r="2.5" />
        <path d="M4.5 17c.8-2 2.2-3 3.5-3s2.7 1 3.5 3M12.5 17c.7-1.7 1.9-2.6 3.5-2.6s2.7.9 3.5 2.6" />
      </svg>
    );
  }
  if (name === "ledger") {
    return (
      <svg {...common}>
        <path d="M5 19V6.5A1.5 1.5 0 0 1 6.5 5H12v14H6.5A1.5 1.5 0 0 1 5 17.5" />
        <path d="M12 5h5.5A1.5 1.5 0 0 1 19 6.5v11A1.5 1.5 0 0 1 17.5 19H12" />
        <path d="M8 9h2M8 12h2M14 9h2M14 12h2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.7 5.7l1.6 1.6M16.7 16.7l1.6 1.6M18.3 5.7l-1.6 1.6M7.3 16.7l-1.6 1.6" />
    </svg>
  );
}

export function DesktopShell() {
  const [pane, setPane] = useState<Pane>("home");
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [meetups, setMeetups] = useState<MeetupSummary[]>([]);
  const [meetupSelectedId, setMeetupSelectedId] = useState<string | null>(null);
  const [meetupTitle, setMeetupTitle] = useState("");
  const [meetupJoinCode, setMeetupJoinCode] = useState("");
  const [meetupSidekick, setMeetupSidekick] = useState(false);
  const [meetupBusy, setMeetupBusy] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [money, setMoney] = useState<LedgerMoneySnapshot | null>(null);
  const [moneyLocked, setMoneyLocked] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [chatQuery, setChatQuery] = useState("");
  const [chatPendingDelete, setChatPendingDelete] = useState<string | null>(null);
  const [renamingChat, setRenamingChat] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const [attachedPills, setAttachedPills] = useState<KnowledgePillSummary[]>([]);
  const [allPills, setAllPills] = useState<KnowledgePillSummary[]>([]);
  const [pillPanelOpen, setPillPanelOpen] = useState(false);
  const [pillBusy, setPillBusy] = useState(false);
  const [lastPillId, setLastPillId] = useState<string | null>(null);
  const [pillCopied, setPillCopied] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [askSelectedId, setAskSelectedId] = useState<string | null>(null);
  const [askHistoryKey, setAskHistoryKey] = useState(0);
  const askHistoryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const bumpAskHistory = useCallback(() => {
    if (askHistoryTimer.current) clearTimeout(askHistoryTimer.current);
    askHistoryTimer.current = setTimeout(() => {
      setAskHistoryKey((k) => k + 1);
    }, 700);
  }, []);
  const profileRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("desk-mode");
    return () => document.documentElement.classList.remove("desk-mode");
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    function onDoc(e: MouseEvent) {
      if (!profileRef.current?.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  async function refreshChats() {
    const data = await fetch("/api/chats").then((r) => r.json());
    setChats(data.chats || []);
  }

  async function refreshPills() {
    const data = await fetch("/api/pills").then((r) => r.json());
    setAllPills(data.pills || []);
  }

  async function openChat(id: string) {
    const data = await fetch(`/api/chat?chatId=${encodeURIComponent(id)}`).then(
      (r) => r.json()
    );
    setChatId(data.chatId);
    setRenamingChat(false);
    setMessages(data.messages || []);
    setAttachedPills(data.pills || []);
    setPillPanelOpen(false);
  }

  async function signOut() {
    setProfileOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
    setSession(null);
    setMessages([]);
    setChats([]);
    setError("Signed out. Restart desktop or refresh to sign in again.");
  }

  useEffect(() => {
    void (async () => {
      try {
        const demo = await fetch("/api/auth/demo", { method: "POST" });
        if (!demo.ok) throw new Error("auth");
        setAuthed(true);
        const [chat, src, rooms, chatsData, sess, pillsData] = await Promise.all([
          fetch("/api/chat").then((r) => r.json()),
          fetch("/api/sources").then((r) => r.json()),
          fetch("/api/meetups").then((r) => r.json()),
          fetch("/api/chats").then((r) => r.json()),
          fetch("/api/session").then((r) => r.json()),
          fetch("/api/pills").then((r) => r.json()),
        ]);
        setMessages(chat.messages || []);
        setChatId(chat.chatId || null);
        setAttachedPills(chat.pills || []);
        setAllPills(pillsData.pills || []);
        setChats(chatsData.chats || []);
        setSources(src.sources || []);
        setMeetups(rooms.rooms || []);
        if (sess?.user) {
          const caps: string[] = sess.capabilities || [];
          setSession({
            name: sess.user.name || "User",
            email: sess.user.email || "",
            role: sess.role || "member",
            workspace: sess.workspace?.name || "Workspace",
            canWorkspace:
              caps.includes("dojo.company") ||
              caps.includes("roles.manage") ||
              caps.includes("finance.money"),
          });
        }
      } catch {
        setAuthed(false);
        setError("Could not sign into demo workspace.");
      }
    })();
  }, []);

  useEffect(() => {
    if (pane !== "ledger" || !authed) return;
    void (async () => {
      const res = await fetch("/api/ledger/money");
      if (res.status === 403) {
        setMoneyLocked(true);
        setMoney(null);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setMoneyLocked(false);
      setMoney(data.snapshot);
    })();
  }, [pane, authed]);

  useEffect(() => {
    if (pane !== "chat" || !authed) return;
    void refreshChats().catch(() => {
      /* keep existing list */
    });
  }, [pane, authed]);

  function startAgentChat(agentName: string) {
    setPane("chat");
    setInput(`@${agentName} `);
    void refreshChats();
  }

  const sideTitle = useMemo(() => {
    if (pane === "dojo") return "Library";
    if (pane === "asks") return "Ask history";
    if (pane === "agents") return "Agents";
    if (pane === "meetups") return "Meetups";
    if (pane === "ledger") return "Ledger";
    if (pane === "preferences") return "Account";
    if (pane === "home") return "Today";
    return "Chats";
  }, [pane]);

  const visibleChats = useMemo(() => {
    const q = chatQuery.trim().toLowerCase();
    const list = [...chats].sort((a, b) => {
      const ap = a.pinnedAt ? 1 : 0;
      const bp = b.pinnedAt ? 1 : 0;
      if (ap !== bp) return bp - ap;
      if (a.pinnedAt && b.pinnedAt) {
        return b.pinnedAt.localeCompare(a.pinnedAt);
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    if (!q) return list;
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.preview || "").toLowerCase().includes(q)
    );
  }, [chats, chatQuery]);

  const showSide =
    pane !== "preferences" && pane !== "home" && pane !== "agents";
  const showComposer = pane === "chat";
  const isChatLayout = pane === "chat";

  const initials = useMemo(() => {
    const n = session?.name?.trim() || "S";
    const parts = n.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
    }
    return n.slice(0, 1).toUpperCase();
  }, [session?.name]);

  const roleLabel = useMemo(() => {
    const r = (session?.role || "member").toLowerCase();
    if (r === "owner") return "Owner";
    if (r === "admin") return "Admin";
    return r.charAt(0).toUpperCase() + r.slice(1);
  }, [session?.role]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setPane("chat");
    setInput("");
    setLoading(true);
    setError("");
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content: message },
    ]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, chatId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      if (data.chatId) setChatId(data.chatId);
      setMessages((prev) => [...prev, data.message]);
      await refreshChats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  async function newDesktopChat() {
    setError("");
    setMessages([]);
    setChatId(null);
    setAttachedPills([]);
    setPillPanelOpen(false);
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create chat");
      return;
    }
    setPane("chat");
    setChatId(data.chat.id);
    setMessages([]);
    await refreshChats();
  }

  async function saveAttachedPills(ids: string[]) {
    if (!chatId) return;
    setError("");
    const res = await fetch(`/api/chats/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pillIds: ids }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not attach pills");
      return;
    }
    const nextIds: string[] = data.chat?.pillIds || ids;
    setAttachedPills(allPills.filter((p) => nextIds.includes(p.id)));
    setPillPanelOpen(false);
  }

  async function createPillFromChat() {
    if (!chatId || pillBusy) return;
    if (messages.length === 0) {
      setError("Chat needs messages before you can make a pill");
      return;
    }
    setPillBusy(true);
    setError("");
    setPillCopied(false);
    try {
      const res = await fetch("/api/pills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create pill");
      await refreshPills();
      setLastPillId(data.pill.id);
      setPillPanelOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create pill");
    } finally {
      setPillBusy(false);
    }
  }

  async function copyPillMarkdown(pill: KnowledgePillSummary) {
    let text = pill.exportMd?.trim() || "";
    if (!text) {
      text = await fetch(`/api/pills/${pill.id}/export`).then((r) => r.text());
    }
    await navigator.clipboard.writeText(text);
    setLastPillId(pill.id);
    setPillCopied(true);
    window.setTimeout(() => setPillCopied(false), 2000);
  }

  function downloadPill(pillId: string) {
    window.open(`/api/pills/${pillId}/export`, "_blank", "noopener,noreferrer");
  }

  async function deleteDesktopChat(id: string) {
    setError("");
    const wasActive = chatId === id;
    // Clear the canvas immediately when removing the open thread
    if (wasActive) {
      setMessages([]);
      setChatId(null);
      setAttachedPills([]);
      setPillPanelOpen(false);
    }

    const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete chat");
      if (wasActive) await refreshChats();
      return;
    }

    const remaining = (
      (await fetch("/api/chats").then((r) => r.json())).chats || []
    ) as ChatSummary[];
    setChats(remaining);

    const stillOpen =
      chatId && remaining.some((c) => c.id === chatId) && !wasActive;

    if (stillOpen) return;

    if (remaining[0]) {
      await openChat(remaining[0].id);
    } else {
      await newDesktopChat();
    }
  }

  async function togglePinChat(id: string, pinned: boolean) {
    setError("");
    const res = await fetch(`/api/chats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    });
    if (!res.ok) {
      setError("Could not update pin");
      return;
    }
    await refreshChats();
  }

  function startRenameChat() {
    if (!chatId) return;
    const current = chats.find((c) => c.id === chatId)?.title || "Chat";
    setRenameDraft(current);
    setRenamingChat(true);
    requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
  }

  async function saveRenameChat() {
    if (!chatId || renameBusy) return;
    const title = renameDraft.trim();
    const current = chats.find((c) => c.id === chatId)?.title || "";
    if (!title || title === current) {
      setRenamingChat(false);
      return;
    }
    setRenameBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not rename");
      setRenamingChat(false);
      await refreshChats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename");
    } finally {
      setRenameBusy(false);
    }
  }

  async function refreshMeetups() {
    const rooms = await fetch("/api/meetups").then((r) => r.json());
    setMeetups(rooms.rooms || []);
  }

  async function createMeetup() {
    const title = meetupTitle.trim() || "Team huddle";
    setMeetupBusy(true);
    setError("");
    try {
      const res = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title,
          kind: meetupSidekick ? "sidekick" : "company",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create Meetup");
      setMeetupTitle("");
      setMeetupSidekick(false);
      await refreshMeetups();
      setMeetupSelectedId(data.room.id);
      setPane("meetups");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create Meetup");
    } finally {
      setMeetupBusy(false);
    }
  }

  async function joinMeetup() {
    const code = meetupJoinCode.trim();
    if (!code) {
      setError("Enter an invite code");
      return;
    }
    setMeetupBusy(true);
    setError("");
    try {
      const res = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", inviteCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not join Meetup");
      setMeetupJoinCode("");
      await refreshMeetups();
      setMeetupSelectedId(data.room.id);
      setPane("meetups");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join Meetup");
    } finally {
      setMeetupBusy(false);
    }
  }

  return (
    <div
      className={`desk-shell ${isChatLayout ? "desk-shell--chat" : ""} ${
        pane === "home" ? "desk-shell--home" : ""
      } ${showSide ? "" : "desk-shell--noside"}`}
    >
      <AtmosphereRotator />
      <nav className="desk-rail" aria-label="Primary">
        <div className="desk-rail__profile" ref={profileRef}>
          <button
            type="button"
            className={`desk-rail__logo ${profileOpen ? "is-open" : ""}`}
            data-tip="Account"
            aria-label="Account menu"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            onClick={() => setProfileOpen((v) => !v)}
          >
            {initials}
          </button>
          {profileOpen ? (
            <div className="desk-profile" role="menu">
              <div className="desk-profile__head">
                <div className="desk-profile__avatar" aria-hidden>
                  {initials}
                </div>
                <div className="desk-profile__who">
                  <strong>{session?.name || "Signed in"}</strong>
                  <span>{session?.email || "—"}</span>
                  <span className="desk-profile__role">
                    {roleLabel}
                    {session?.workspace ? ` · ${session.workspace}` : ""}
                  </span>
                </div>
              </div>
              <div className="desk-profile__sep" />
              <button
                type="button"
                role="menuitem"
                className="desk-profile__item"
                onClick={() => {
                  setProfileOpen(false);
                  setPane("preferences");
                }}
              >
                Preferences
              </button>
              {session?.canWorkspace ? (
                <a
                  role="menuitem"
                  className="desk-profile__item"
                  href="/app/workspace"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setProfileOpen(false)}
                >
                  Workspace admin
                </a>
              ) : null}
              <a
                role="menuitem"
                className="desk-profile__item"
                href="/app"
                target="_blank"
                rel="noreferrer"
                onClick={() => setProfileOpen(false)}
              >
                Open in browser
              </a>
              <button
                type="button"
                role="menuitem"
                className="desk-profile__item"
                onClick={() => {
                  setProfileOpen(false);
                  window.alert(
                    "Shortcuts\n\nEnter — send message\nShift+Enter — new line\nEsc — close menus"
                  );
                }}
              >
                Keyboard shortcuts
              </button>
              <button
                type="button"
                role="menuitem"
                className="desk-profile__item"
                onClick={() => {
                  setProfileOpen(false);
                  window.alert(
                    "Alt — the company watcher\nGrounded answers · cite or refuse\nAgents propose only."
                  );
                }}
              >
                About Alt
              </button>
              <div className="desk-profile__sep" />
              <button
                type="button"
                role="menuitem"
                className="desk-profile__item desk-profile__item--danger"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
        {(
          [
            ["home", "Home"],
            ["chat", "Chat"],
            ["asks", "Asks"],
            ["dojo", "My files"],
            ["agents", "Agents"],
            ["ledger", "Ledger"],
            ["meetups", "Meetups"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`desk-rail__btn ${pane === id ? "is-active" : ""}`}
            data-tip={label}
            aria-label={label}
            onClick={() => setPane(id)}
          >
            <RailIcon name={id} />
          </button>
        ))}
        <div className="desk-rail__spacer" />
        <button
          type="button"
          className={`desk-rail__btn ${pane === "preferences" ? "is-active" : ""}`}
          data-tip="Preferences"
          aria-label="Preferences"
          onClick={() => setPane("preferences")}
        >
          <RailIcon name="settings" />
        </button>
      </nav>

      {showSide ? (
      <aside className="desk-side">
        <div>
          <h2 className="desk-side__title">{sideTitle}</h2>
          <p className="desk-side__sub">
            {pane === "chat"
              ? "History for this chat surface"
              : pane === "asks"
                ? "Active, pending, and done — with open tasks"
                : "Company brain · desktop"}
          </p>
        </div>
        {pane === "chat" ? (
          <input
            className="desk-search"
            placeholder="Search chats…"
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
          />
        ) : null}
        {pane === "chat" ? (
          <button type="button" className="desk-new" onClick={() => void newDesktopChat()}>
            New chat
          </button>
        ) : null}
        {pane === "chat" && chatId ? (
          chatPendingDelete === chatId ? (
            <div className="desk-delete-confirm">
              <p>Delete this chat?</p>
              <div className="desk-delete-confirm__actions">
                <button
                  type="button"
                  className="desk-ask-hist__ghost"
                  onClick={() => setChatPendingDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="desk-new desk-new--danger"
                  onClick={() => {
                    const id = chatId;
                    setChatPendingDelete(null);
                    void deleteDesktopChat(id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="desk-new"
                disabled={pillBusy || messages.length === 0}
                onClick={() => void createPillFromChat()}
              >
                {pillBusy ? "Making pill…" : "Make pill"}
              </button>
              <button
                type="button"
                className="desk-delete-link"
                onClick={() => setPillPanelOpen((v) => !v)}
              >
                {pillPanelOpen ? "Hide pills" : "Attach pills"}
              </button>
              {renamingChat ? (
                <div className="desk-delete-confirm">
                  <input
                    ref={renameInputRef}
                    className="desk-search"
                    value={renameDraft}
                    disabled={renameBusy}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void saveRenameChat();
                      }
                      if (e.key === "Escape") setRenamingChat(false);
                    }}
                    aria-label="Rename chat"
                  />
                  <div className="desk-delete-confirm__actions">
                    <button
                      type="button"
                      className="desk-ask-hist__ghost"
                      onClick={() => setRenamingChat(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="desk-new"
                      disabled={renameBusy}
                      onClick={() => void saveRenameChat()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="desk-delete-link"
                  onClick={startRenameChat}
                >
                  Rename chat
                </button>
              )}
              <button
                type="button"
                className="desk-delete-link"
                onClick={() => setChatPendingDelete(chatId)}
              >
                Delete chat
              </button>
            </>
          )
        ) : null}
        {pane === "meetups" ? (
          <div className="desk-meetup-forms">
            <form
              className="desk-meetup-form"
              onSubmit={(e) => {
                e.preventDefault();
                void createMeetup();
              }}
            >
              <input
                className="desk-search"
                placeholder="Meetup title"
                value={meetupTitle}
                onChange={(e) => setMeetupTitle(e.target.value)}
              />
              <label className="desk-meetup-form__check">
                <input
                  type="checkbox"
                  checked={meetupSidekick}
                  onChange={(e) => setMeetupSidekick(e.target.checked)}
                />
                Sidekick Meet
              </label>
              <button
                type="submit"
                className="desk-new"
                disabled={meetupBusy}
              >
                {meetupBusy ? "Creating…" : "New Meetup"}
              </button>
            </form>
            <form
              className="desk-meetup-form"
              onSubmit={(e) => {
                e.preventDefault();
                void joinMeetup();
              }}
            >
              <input
                className="desk-search"
                placeholder="Join with invite code"
                value={meetupJoinCode}
                onChange={(e) => setMeetupJoinCode(e.target.value.toUpperCase())}
              />
              <button
                type="submit"
                className="desk-chip"
                disabled={meetupBusy || !meetupJoinCode.trim()}
              >
                Join
              </button>
            </form>
          </div>
        ) : null}

        {pane === "asks" ? (
          <DesktopAsksHistory
            selectedId={askSelectedId}
            onSelect={setAskSelectedId}
            refreshKey={askHistoryKey}
            onCreated={() => setAskHistoryKey((k) => k + 1)}
            onChanged={bumpAskHistory}
          />
        ) : (
        <div className="desk-thread-list">
          {pane === "chat"
            ? visibleChats.map((c) => (
                <SwipeRow
                  key={c.id}
                  active={chatId === c.id}
                  pinned={Boolean(c.pinnedAt)}
                  onSelect={() => {
                    setPane("chat");
                    void openChat(c.id);
                  }}
                  actions={[
                    {
                      id: "pin",
                      label: c.pinnedAt ? "Unpin" : "Pin",
                      tone: "accent",
                      onClick: () =>
                        void togglePinChat(c.id, !c.pinnedAt),
                    },
                    {
                      id: "delete",
                      label: "Delete",
                      tone: "danger",
                      onClick: () => void deleteDesktopChat(c.id),
                    },
                  ]}
                >
                  <div className="desk-thread__card">
                    <div className="desk-thread__name">
                      {c.pinnedAt ? (
                        <span className="swipe-pin" aria-hidden />
                      ) : null}
                      {c.title}
                    </div>
                    {(c.summary || c.preview) ? (
                      <p className="desk-thread__summary">
                        {c.summary || c.preview}
                      </p>
                    ) : null}
                    <div className="desk-thread__meta">
                      {c.agent ? `@${c.agent} · ` : ""}
                      {formatWhen(c.updatedAt)}
                      {c.messageCount
                        ? ` · ${c.messageCount} msg${c.messageCount === 1 ? "" : "s"}`
                        : ""}
                    </div>
                  </div>
                </SwipeRow>
              ))
            : (() => {
                // showSide excludes home/agents/preferences — only dojo/meetups/ledger remain here
                const sideItems: { id: string; name: string; meta: string }[] =
                  pane === "dojo"
                    ? sources.slice(0, 12).map((s) => ({
                        id: s.id,
                        name: s.filename,
                        meta: `${s.status} · ${s.updated_at.slice(0, 10)}`,
                      }))
                    : pane === "meetups"
                      ? meetups.map((m) => ({
                          id: m.id,
                          name: m.title,
                          meta: `${m.status} · ${m.inviteCode}`,
                        }))
                      : pane === "ledger"
                        ? money?.payables.map((p) => ({
                            id: p.vendor,
                            name: p.vendor,
                            meta: `${formatMoney(p.amount)} · ${p.status}`,
                          })) || [
                            {
                              id: "locked",
                              name: "Money locked",
                              meta: "Admin roles only",
                            },
                          ]
                        : [];

                return sideItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`desk-thread ${
                      pane === "meetups" && meetupSelectedId === item.id
                        ? "is-active"
                        : ""
                    }`}
                    onClick={() => {
                      if (pane === "meetups") {
                        setMeetupSelectedId(item.id);
                      }
                    }}
                  >
                    <div className="desk-thread__name">{item.name}</div>
                    <div className="desk-thread__meta">{item.meta}</div>
                  </button>
                ));
              })()}
          {pane === "meetups" && meetups.length === 0 ? (
            <p className="desk-side__sub">No Meetups yet — create one above.</p>
          ) : null}
          {pane === "chat" && visibleChats.length === 0 ? (
            <p className="desk-side__sub">
              {chats.length === 0
                ? "No chats yet — start a new one."
                : "No chats match that search."}
            </p>
          ) : null}
          {pane === "dojo" && sources.length === 0 ? (
            <p className="desk-side__sub">No files yet — open Workspace → Library on web to upload, or ask in chat.</p>
          ) : null}
        </div>
        )}
      </aside>
      ) : null}

      <main className="desk-main">
        <div className="desk-topbar">
          <div className="desk-agent-pill">
            <div className="desk-agent-pill__avatar">A</div>
            <div>
              <div className="desk-agent-pill__label">Alt</div>
              <div className="desk-agent-pill__status">
                {authed === false ? "Offline" : "Grounded · cite or refuse"}
              </div>
            </div>
          </div>
          {pane !== "home" ? (
            <div className="desk-quick" style={{ marginBottom: 0 }}>
              {AGENTS.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="desk-chip"
                  onClick={() => startAgentChat(a.name)}
                >
                  @{a.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="desk-canvas">
          {pane === "home" ? (
            <DesktopHome
              userName={session?.name || "there"}
              workspace={session?.workspace || "Workspace"}
              onAskChat={(prompt) => void send(prompt)}
              onOpenChat={(id) => {
                setPane("chat");
                void openChat(id);
              }}
              onOpenPane={(p) => setPane(p)}
            />
          ) : null}

          {pane === "asks" ? (
            <DesktopAsks
              selectedId={askSelectedId}
              onSelect={setAskSelectedId}
              onChanged={bumpAskHistory}
            />
          ) : null}

          {pane === "chat" ? (
            <div className="desk-msg-list">
              {messages.length === 0 ? (
                <section className="desk-hello-gem">
                  <h1>
                    <span className="desk-hello-gem__grad">Hello</span>
                  </h1>
                  <p>Ask Alt — or summon an agent with @.</p>
                </section>
              ) : null}
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="desk-msg desk-msg--user">
                    <div className="desk-msg__body">{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className="desk-msg desk-msg--assistant">
                    <div className="desk-msg__avatar" aria-hidden>
                      A
                    </div>
                    <div className="desk-msg__who">{m.agentName || "Alt"}</div>
                    <AnswerText content={m.content} className="desk-msg__body" />
                    {m.citations && m.citations.length > 0 ? (
                      <details className="desk-cite">
                        <summary>
                          See references · {m.citations.length}
                        </summary>
                        {m.citations.slice(0, 5).map((c, i) => (
                          <div key={`${c.chunkId}-${i}`} className="desk-cite__item">
                            <strong>
                              [{i + 1}] {c.filename}
                            </strong>{" "}
                            — {c.snippet}
                          </div>
                        ))}
                      </details>
                    ) : null}
                  </div>
                )
              )}
              {loading ? <div className="desk-side__sub">Searching sources…</div> : null}
              <div ref={bottomRef} />
            </div>
          ) : null}

          {pane === "dojo" ? (
            <div className="desk-panel">
              <h2>Training library</h2>
              <p className="desk-side__sub" style={{ marginTop: 8 }}>
                Company files for Chat and Meetups. Train personal Sidekicks under
                My files on the web — each profile has its own shelf. Admins train
                the company brain in Workspace → Library.
              </p>
              <div style={{ marginTop: 12 }}>
                {sources.length === 0 ? (
                  <p className="desk-side__sub">No sources in this workspace yet.</p>
                ) : (
                  sources.map((s) => (
                    <div key={s.id} className="desk-file-row">
                      <span>{s.filename}</span>
                      <span className="desk-badge">{s.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {pane === "ledger" ? (
            <div className="desk-panel">
              <h2>Ledger · money</h2>
              {moneyLocked ? (
                <p className="desk-side__sub" style={{ marginTop: 12 }}>
                  Restricted to admin roles with finance.money. Open Roles on the
                  web Ledger page to grant access.
                </p>
              ) : money ? (
                <>
                  <div className="desk-ledger-kpis">
                    {money.kpis.map((k) => (
                      <div key={k.id} className="desk-ledger-kpi">
                        <div className="desk-card__eyebrow">{k.label}</div>
                        <div className="desk-ledger-kpi__value">
                          {formatMoney(k.value, money.currency)}
                        </div>
                        <div className="desk-side__sub">
                          {k.deltaPct > 0 ? "+" : ""}
                          {k.deltaPct}%
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {money.insights.map((i) => (
                      <div key={i.id} className="desk-file-row" style={{ display: "block" }}>
                        <strong>{i.title}</strong>
                        <div className="desk-side__sub">{i.body}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="desk-side__sub" style={{ marginTop: 12 }}>
                  Loading money snapshot…
                </p>
              )}
            </div>
          ) : null}

          {pane === "agents" ? (
            <div className="desk-panel">
              <h2>Specialists on call</h2>
              <div className="desk-agent-grid">
                {AGENTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="desk-agent-card"
                    onClick={() => {
                      if (a.id === "ledger") {
                        setPane("ledger");
                        return;
                      }
                      setPane("chat");
                      setInput(`@${a.name} `);
                    }}
                  >
                    <div className="desk-card__eyebrow">{a.role}</div>
                    <h3>@{a.name}</h3>
                    <p>{a.body}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {pane === "meetups" ? (
            meetupSelectedId ? (
              <div className="desk-meetup-room">
                <MeetupRoomClient
                  roomId={meetupSelectedId}
                  onBack={() => {
                    setMeetupSelectedId(null);
                    void refreshMeetups();
                  }}
                />
              </div>
            ) : (
              <div className="desk-panel">
                <h2>Meetup rooms</h2>
                <p className="desk-side__sub" style={{ marginTop: 8 }}>
                  Create a room or join with an invite code from the sidebar.
                  Company Meetups use the company brain; Sidekick Meet shares a
                  personal shelf on purpose.
                </p>
                <div style={{ marginTop: 12 }}>
                  {meetups.length === 0 ? (
                    <p className="desk-side__sub">No Meetups yet.</p>
                  ) : (
                    meetups.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="desk-file-row"
                        onClick={() => setMeetupSelectedId(m.id)}
                      >
                        <div>
                          <div>{m.title}</div>
                          <div className="desk-side__sub">
                            Invite {m.inviteCode}
                            {m.kind === "sidekick" ? " · Sidekick Meet" : ""}
                          </div>
                        </div>
                        <span className="desk-badge">{m.status}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )
          ) : null}

          {pane === "preferences" ? (
            <div className="desk-panel desk-prefs">
              <h2>Account</h2>
              <p className="desk-side__sub" style={{ marginTop: 8 }}>
                Profile and appearance for this desktop session.
              </p>
              <div className="desk-prefs__card">
                <div className="desk-prefs__row">
                  <span>Name</span>
                  <strong>{session?.name || "—"}</strong>
                </div>
                <div className="desk-prefs__row">
                  <span>Email</span>
                  <strong>{session?.email || "—"}</strong>
                </div>
                <div className="desk-prefs__row">
                  <span>Role</span>
                  <strong>{roleLabel}</strong>
                </div>
                <div className="desk-prefs__row">
                  <span>Workspace</span>
                  <strong>{session?.workspace || "—"}</strong>
                </div>
                <div className="desk-prefs__row desk-prefs__row--theme">
                  <span>Appearance</span>
                  <ThemeToggle />
                </div>
              </div>
              <div className="desk-prefs__actions">
                {session?.canWorkspace ? (
                  <a className="desk-new" href="/app/workspace" target="_blank" rel="noreferrer">
                    Open Workspace admin
                  </a>
                ) : null}
                <a className="desk-chip" href="/app" target="_blank" rel="noreferrer">
                  Open web app
                </a>
                <button type="button" className="desk-chip" onClick={() => void signOut()}>
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {showComposer ? (
          <div className="desk-composer-wrap">
            {error ? <p className="desk-error">{error}</p> : null}
            {attachedPills.length > 0 ? (
              <div className="desk-pills">
                <span className="desk-pills__label">Pills</span>
                {attachedPills.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="desk-chip desk-chip--pill"
                    title={p.body}
                    onClick={() =>
                      void saveAttachedPills(
                        attachedPills
                          .filter((x) => x.id !== p.id)
                          .map((x) => x.id)
                      )
                    }
                  >
                    {p.title} ×
                  </button>
                ))}
              </div>
            ) : null}
            {pillPanelOpen ? (
              <div className="desk-pill-panel">
                <div className="desk-pill-panel__head">
                  <strong>Knowledge pills</strong>
                  <p>
                    Attach for this chat, or copy/download a portable .pill.md
                    for ChatGPT, Claude, Gemini, etc.
                  </p>
                </div>
                {lastPillId ? (
                  <div className="desk-pill-export">
                    <button
                      type="button"
                      className="desk-chip"
                      onClick={() => {
                        const pill = allPills.find((p) => p.id === lastPillId);
                        if (pill) void copyPillMarkdown(pill);
                      }}
                    >
                      {pillCopied ? "Copied" : "Copy markdown"}
                    </button>
                    <button
                      type="button"
                      className="desk-chip"
                      onClick={() => downloadPill(lastPillId)}
                    >
                      Download .pill.md
                    </button>
                  </div>
                ) : null}
                {allPills.length === 0 ? (
                  <p className="desk-pill-panel__empty">
                    No pills yet. Open a chat with history and tap Make pill.
                  </p>
                ) : (
                  <ul className="desk-pill-panel__list">
                    {allPills.map((p) => {
                      const on = attachedPills.some((a) => a.id === p.id);
                      return (
                        <li key={p.id}>
                          <label className="desk-pill-panel__row">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => {
                                const ids = on
                                  ? attachedPills
                                      .filter((a) => a.id !== p.id)
                                      .map((a) => a.id)
                                  : [...attachedPills.map((a) => a.id), p.id];
                                void saveAttachedPills(ids);
                              }}
                            />
                            <span>
                              <strong>{p.title}</strong>
                              <small>{p.body.slice(0, 120)}</small>
                              <span className="desk-pill-row-actions">
                                <button
                                  type="button"
                                  className="desk-chip"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    void copyPillMarkdown(p);
                                  }}
                                >
                                  Copy
                                </button>
                                <button
                                  type="button"
                                  className="desk-chip"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    downloadPill(p.id);
                                  }}
                                >
                                  Download
                                </button>
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}
            <div className="desk-quick">
              {[
                "@Quill What’s our refund policy?",
                "@Ledger Summarize Q2 expenses by vendor.",
                "@Moony Did we invoice Contoso last month?",
              ].map((q) => (
                <button key={q} type="button" className="desk-chip" onClick={() => void send(q)}>
                  {q.replace(/^@\w+\s/, "").slice(0, 36)}…
                </button>
              ))}
            </div>
            <form
              className="desk-composer"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <textarea
                rows={1}
                placeholder="Ask Alt… or @Moony / @Relay"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <button className="desk-send" disabled={loading || !input.trim()} aria-label="Send">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>
          </div>
        ) : error && pane === "home" ? (
          <p className="desk-error" style={{ padding: "0 1rem 1rem" }}>
            {error}
          </p>
        ) : null}
      </main>
    </div>
  );
}
