"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AGENTS, type AgentDefinition } from "@/lib/agents/catalog";
import { AnswerText } from "@/components/AnswerText";
import { SwipeRow } from "@/components/SwipeRow";

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
  agentId?: string | null;
  agentName?: string | null;
  createdAt?: string;
};

type ChatSummary = {
  id: string;
  title: string;
  importedChatIds: string[];
  pinnedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview?: string;
  summary?: string;
  agent?: string | null;
};

type KnowledgePillSummary = {
  id: string;
  title: string;
  body: string;
  bullets: string[];
  exportMd?: string | null;
  detail?: {
    goals?: string[];
    stack?: string[];
    decisions?: string[];
    assumptions?: string[];
    openQuestions?: string[];
    glossary?: string[];
  } | null;
  sourceChatId: string | null;
  createdAt: string;
  updatedAt: string;
};

type SidekickSummary = {
  id: string;
  name: string;
  description: string;
  fileCount: number;
  readyCount: number;
  skillIds?: string[];
  activeSkillIds?: string[];
  skills?: {
    id: string;
    name: string;
    topic: string;
    proficiency: number;
    proficiencyLabel: string;
  }[];
};

function mentionState(value: string, cursor: number) {
  const before = value.slice(0, cursor);
  const match = before.match(/@([A-Za-z]*)$/);
  if (!match) return null;
  return {
    prefix: match[1] || "",
    start: cursor - match[0].length,
  };
}

function firstName(full: string) {
  const part = full.trim().split(/\s+/)[0];
  return part || "there";
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

function AnswerBody({
  content,
  citations,
  agentId,
  agentName,
  messageId,
  chatId,
}: {
  content: string;
  citations?: Citation[];
  agentId?: string | null;
  agentName?: string | null;
  messageId?: string;
  chatId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [queueState, setQueueState] = useState<"idle" | "saving" | "done" | "err">(
    "idle"
  );
  const count = citations?.length || 0;

  async function queueForApproval() {
    if (!agentId || !agentName || queueState === "saving") return;
    setQueueState("saving");
    try {
      const title =
        content.split("\n")[0]?.replace(/\s+/g, " ").trim().slice(0, 72) ||
        "Agent draft";
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          agentName,
          title,
          body: content,
          chatId: chatId || undefined,
          messageId: messageId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      setQueueState("done");
    } catch {
      setQueueState("err");
    }
  }

  return (
    <div className="chat-answer">
      {agentName ? (
        <div className="chat-answer__agent">@{agentName}</div>
      ) : null}
      <AnswerText content={content} />
      {agentId && agentName ? (
        <div className="mt-2">
          <button
            type="button"
            className="chat-refs__toggle"
            disabled={queueState === "saving" || queueState === "done"}
            onClick={() => void queueForApproval()}
          >
            {queueState === "saving"
              ? "Queuing…"
              : queueState === "done"
                ? "Queued for approval"
                : queueState === "err"
                  ? "Retry queue"
                  : "Queue for approval"}
          </button>
        </div>
      ) : null}
      {count > 0 ? (
        <div className="chat-refs">
          <button
            type="button"
            className="chat-refs__toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? "Hide references" : `See references · ${count}`}
          </button>
          {open ? (
            <ul className="chat-refs__list">
              {citations!.map((c, i) => (
                <li key={`${c.chunkId}-${i}`}>
                  <span className="chat-refs__file">
                    [{i + 1}] {c.filename}
                  </span>
                  <span className="chat-refs__snip">{c.snippet}…</span>
                  <a
                    className="mt-1 inline-block text-[0.7rem] text-[var(--accent)] hover:underline"
                    href="/app/workspace/library"
                  >
                    Open in Library
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ChatClient() {
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState("New chat");
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [userName, setUserName] = useState("there");
  const [mode, setMode] = useState<"company" | "sidekick">("company");
  const [sidekicks, setSidekicks] = useState<SidekickSummary[]>([]);
  const [sidekickId, setSidekickId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importPick, setImportPick] = useState<string[]>([]);
  const [attachedPills, setAttachedPills] = useState<KnowledgePillSummary[]>([]);
  const [allPills, setAllPills] = useState<KnowledgePillSummary[]>([]);
  const [pillOpen, setPillOpen] = useState(false);
  const [pillPick, setPillPick] = useState<string[]>([]);
  const [pillBusy, setPillBusy] = useState(false);
  const [lastPillId, setLastPillId] = useState<string | null>(null);
  const [pillCopied, setPillCopied] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const primed = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 900) {
      setRailOpen(true);
    }
  }, []);

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

  const empty = messages.length === 0 && !loading;
  const activeSidekick = useMemo(
    () => sidekicks.find((s) => s.id === sidekickId) || sidekicks[0] || null,
    [sidekicks, sidekickId]
  );
  const orderedChats = useMemo(
    () =>
      [...chats].sort((a, b) => {
        const ap = a.pinnedAt ? 1 : 0;
        const bp = b.pinnedAt ? 1 : 0;
        if (ap !== bp) return bp - ap;
        if (a.pinnedAt && b.pinnedAt) {
          return (b.pinnedAt || "").localeCompare(a.pinnedAt || "");
        }
        return b.updatedAt.localeCompare(a.updatedAt);
      }),
    [chats]
  );
  const importedChats = useMemo(
    () => orderedChats.filter((c) => importedIds.includes(c.id)),
    [orderedChats, importedIds]
  );
  const importCandidates = useMemo(
    () => orderedChats.filter((c) => c.id !== chatId),
    [orderedChats, chatId]
  );

  const refreshChats = useCallback(async () => {
    const res = await fetch("/api/chats");
    const data = await res.json();
    if (res.ok) setChats(data.chats || []);
  }, []);

  const refreshPills = useCallback(async () => {
    const res = await fetch("/api/pills");
    const data = await res.json();
    if (res.ok) setAllPills(data.pills || []);
  }, []);

  const refreshSidekicks = useCallback(async () => {
    const res = await fetch("/api/sidekicks");
    const data = await res.json();
    if (!res.ok) return;
    const list = (data.sidekicks || []) as SidekickSummary[];
    setSidekicks(list);
    setSidekickId((prev) => {
      if (prev && list.some((s) => s.id === prev)) return prev;
      return list[0]?.id || null;
    });
  }, []);

  const loadChat = useCallback(async (id: string) => {
    const res = await fetch(`/api/chat?chatId=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load chat");
    setChatId(data.chatId);
    setChatTitle(data.chat?.title || "Chat");
    setRenaming(false);
    setImportedIds(data.chat?.importedChatIds || []);
    setAttachedPills(data.pills || []);
    setPillOpen(false);
    setMessages(
      (data.messages || []).slice().sort((a: ChatMessage, b: ChatMessage) =>
        (a.createdAt || "").localeCompare(b.createdAt || "")
      )
    );
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [sessionRes, chatsRes] = await Promise.all([
          fetch("/api/session"),
          fetch("/api/chats"),
          refreshSidekicks(),
          refreshPills(),
        ]);
        const session = await sessionRes.json();
        const chatsData = await chatsRes.json();
        if (session?.user?.name) setUserName(firstName(session.user.name));
        const list: ChatSummary[] = chatsData.chats || [];
        setChats(list);

        if (list.length === 0) {
          const created = await fetch("/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }).then((r) => r.json());
          await loadChat(created.chat.id);
          await refreshChats();
        } else {
          await loadChat(list[0].id);
        }
      } catch {
        setError("Could not load chat");
      } finally {
        setBooting(false);
      }
    })();
  }, [loadChat, refreshChats, refreshSidekicks, refreshPills]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (!q || primed.current) return;
    primed.current = true;
    setInput(q);
    setCursor(q.length);
    inputRef.current?.focus();
  }, [searchParams]);

  useEffect(() => {
    if (!empty) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, empty]);

  useEffect(() => {
    setMentionIndex(0);
  }, [mention?.prefix]);

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

  async function selectChat(id: string) {
    if (id === chatId || loading) return;
    setError("");
    setImportOpen(false);
    try {
      await loadChat(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open chat");
    }
  }

  async function newChat() {
    setError("");
    setMessages([]);
    setChatId(null);
    setChatTitle("New chat");
    setRenaming(false);
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
    setChatId(data.chat.id);
    setChatTitle(data.chat.title || "New chat");
    setMessages([]);
    setImportedIds([]);
    setAttachedPills([]);
    setPillOpen(false);
    await refreshChats();
  }

  function startRename() {
    if (!chatId) return;
    setRenameDraft(chatTitle);
    setRenaming(true);
    requestAnimationFrame(() => {
      renameRef.current?.focus();
      renameRef.current?.select();
    });
  }

  async function saveRename() {
    if (!chatId || renameBusy) return;
    const title = renameDraft.trim();
    if (!title || title === chatTitle) {
      setRenaming(false);
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
      setChatTitle(data.chat?.title || title);
      setRenaming(false);
      await refreshChats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename");
    } finally {
      setRenameBusy(false);
    }
  }

  async function deleteChat(id: string) {
    setError("");
    const wasActive = chatId === id;
    if (wasActive) {
      setMessages([]);
      setChatId(null);
      setChatTitle("New chat");
    }

    const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete chat");
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
      await loadChat(remaining[0].id);
    } else {
      await newChat();
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

  async function saveImports(ids: string[]) {
    if (!chatId) return;
    const res = await fetch(`/api/chats/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ importedChatIds: ids }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not update imports");
      return;
    }
    setImportedIds(data.chat.importedChatIds || []);
    setImportOpen(false);
    await refreshChats();
  }

  async function savePills(ids: string[]) {
    if (!chatId) return;
    const res = await fetch(`/api/chats/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pillIds: ids }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not update pills");
      return;
    }
    const nextIds: string[] = data.chat?.pillIds || ids;
    setAttachedPills(allPills.filter((p) => nextIds.includes(p.id)));
    setPillPick(nextIds);
    setPillOpen(false);
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
      setPillPick((prev) =>
        prev.includes(data.pill.id) ? prev : [...prev, data.pill.id]
      );
      setPillOpen(true);
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
    setPillCopied(true);
    setLastPillId(pill.id);
    window.setTimeout(() => setPillCopied(false), 2000);
  }

  function downloadPill(pillId: string) {
    window.open(`/api/pills/${pillId}/export`, "_blank", "noopener,noreferrer");
  }

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading || !chatId) return;
    setInput("");
    setCursor(0);
    setLoading(true);
    setError("");
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          chatId,
          surface: mode === "sidekick" ? "sidekick" : "chat",
          sidekickId:
            mode === "sidekick"
              ? activeSidekick?.id || sidekickId || undefined
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setMessages((prev) => [
        ...prev,
        { ...data.message, createdAt: new Date().toISOString() },
      ]);
      if (data.chat?.title) setChatTitle(data.chat.title);
      await refreshChats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  const composer = (
    <form
      className={`gem-composer ${empty ? "gem-composer--hero" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      {mention && suggestions.length > 0 ? (
        <div className="agent-mention-menu gem-composer__mentions" role="listbox">
          {suggestions.map((agent, i) => (
            <button
              key={agent.id}
              type="button"
              role="option"
              aria-selected={i === mentionIndex}
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

      <div className="gem-composer__row">
        <button
          type="button"
          className="gem-composer__tool"
          title="Mention an agent"
          aria-label="Insert agent"
          onClick={() => {
            const next =
              input.endsWith("@") || input.includes("@") ? input : `${input}@`;
            setInput(next);
            setCursor(next.length);
            inputRef.current?.focus();
          }}
        >
          @
        </button>
        <textarea
          ref={inputRef}
          rows={1}
          className="gem-composer__input"
          placeholder={
            mode === "sidekick"
              ? `Ask ${activeSidekick?.name || "your Sidekick"}`
              : "Ask Alt"
          }
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setCursor(e.target.selectionStart ?? e.target.value.length);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onSelect={(e) =>
            setCursor(e.currentTarget.selectionStart ?? input.length)
          }
          onKeyDown={(e) => {
            if (mention && suggestions.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionIndex((i) => (i + 1) % suggestions.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionIndex(
                  (i) => (i - 1 + suggestions.length) % suggestions.length
                );
                return;
              }
              if (e.key === "Tab") {
                e.preventDefault();
                applyMention(suggestions[mentionIndex] || suggestions[0]);
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (mention && suggestions.length > 0) {
                applyMention(suggestions[mentionIndex] || suggestions[0]);
                return;
              }
              void send();
            }
          }}
        />
        <button
          type="submit"
          className="gem-composer__send"
          disabled={loading || !input.trim()}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 19V5M12 5l-6 6M12 5l6 6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );

  const modeToggle = (
    <div className="gem-mode-wrap">
      <div className="gem-mode" role="tablist" aria-label="Chat mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "company"}
          className={mode === "company" ? "is-active" : ""}
          onClick={() => setMode("company")}
        >
          Company
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "sidekick"}
          className={mode === "sidekick" ? "is-active" : ""}
          onClick={() => setMode("sidekick")}
        >
          Sidekick
        </button>
      </div>
      {mode === "sidekick" && sidekicks.length > 0 ? (
        <label className="gem-sidekick-pick">
          <span className="sr-only">Which Sidekick</span>
          <select
            value={activeSidekick?.id || ""}
            onChange={(e) => setSidekickId(e.target.value)}
            aria-label="Sidekick profile"
          >
            {sidekicks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.readyCount ? ` · ${s.readyCount} ready` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {mode === "sidekick" && (activeSidekick?.skills?.length || 0) > 0 ? (
        <div className="gem-skill-chips" aria-label="Equipped skills">
          {activeSidekick!.skills!.map((s) => {
            const active = (activeSidekick!.activeSkillIds || []).includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                className={`gem-skill-chip ${active ? "is-active" : ""}`}
                title={`${s.proficiencyLabel} · click to focus`}
                onClick={() => {
                  void (async () => {
                    const equipped = activeSidekick!.skillIds || [];
                    const current = activeSidekick!.activeSkillIds || [];
                    const next = current.includes(s.id)
                      ? current.filter((id) => id !== s.id)
                      : [...current, s.id];
                    const res = await fetch("/api/sidekicks", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: activeSidekick!.id,
                        skillIds: equipped,
                        activeSkillIds: next,
                      }),
                    });
                    if (res.ok) await refreshSidekicks();
                  })();
                }}
              >
                {s.name}
                {active ? " · now" : ""}
              </button>
            );
          })}
          <a className="gem-skill-chip gem-skill-chip--link" href="/app/files">
            Manage skills
          </a>
        </div>
      ) : mode === "sidekick" ? (
        <a className="gem-skill-chip gem-skill-chip--link" href="/app/files">
          Add skill tokens
        </a>
      ) : null}
    </div>
  );

  if (booting) {
    return (
      <div className="gem-chat gem-chat--boot">
        <p className="text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className={`gem-chat ${railOpen ? "gem-chat--rail-open" : ""}`}>
      <aside className={`gem-rail ${railOpen ? "is-open" : ""}`} aria-label="Chat history">
        <div className="gem-rail__top">
          <button
            type="button"
            className="gem-rail__new"
            onClick={() => void newChat()}
          >
            <span aria-hidden>+</span> New chat
          </button>
        </div>
        <p className="gem-rail__label">
          {orderedChats.some((c) => c.pinnedAt) ? "Pinned & recent" : "Recent"}
        </p>
        <ul className="gem-rail__list">
          {orderedChats.map((c) => (
            <li key={c.id}>
              <SwipeRow
                active={c.id === chatId}
                pinned={Boolean(c.pinnedAt)}
                onSelect={() => {
                  void selectChat(c.id);
                  if (typeof window !== "undefined" && window.innerWidth < 900) {
                    setRailOpen(false);
                  }
                }}
                actions={[
                  {
                    id: "pin",
                    label: c.pinnedAt ? "Unpin" : "Pin",
                    tone: "accent",
                    onClick: () => void togglePinChat(c.id, !c.pinnedAt),
                  },
                  {
                    id: "delete",
                    label: "Delete",
                    tone: "danger",
                    onClick: () => void deleteChat(c.id),
                  },
                ]}
              >
                <div className="gem-rail__card">
                  <span className="gem-rail__title">
                    {c.pinnedAt ? (
                      <span className="swipe-pin" aria-hidden />
                    ) : null}
                    {c.title}
                  </span>
                  {(c.summary || c.preview) ? (
                    <span className="gem-rail__summary">
                      {c.summary || c.preview}
                    </span>
                  ) : null}
                  <span className="gem-rail__meta">
                    {c.agent ? `@${c.agent} · ` : ""}
                    {formatWhen(c.updatedAt)}
                    {c.messageCount
                      ? ` · ${c.messageCount} msg${c.messageCount === 1 ? "" : "s"}`
                      : ""}
                  </span>
                </div>
              </SwipeRow>
            </li>
          ))}
        </ul>
        <div className="gem-rail__foot">
          <button
            type="button"
            className="gem-rail__link"
            disabled={!chatId || pillBusy || messages.length === 0}
            onClick={() => void createPillFromChat()}
          >
            {pillBusy ? "Making pill…" : "Make pill"}
          </button>
          <button
            type="button"
            className="gem-rail__link"
            onClick={() => {
              setPillPick(attachedPills.map((p) => p.id));
              setImportOpen(false);
              setPillOpen(true);
            }}
          >
            Attach pills
          </button>
          <button
            type="button"
            className="gem-rail__link"
            onClick={() => {
              setImportPick(importedIds);
              setPillOpen(false);
              setImportOpen(true);
            }}
          >
            Import history
          </button>
          {chatId ? (
            pendingDelete ? (
              <div className="gem-rail__delete">
                <span>Delete this chat?</span>
                <button
                  type="button"
                  className="gem-rail__link"
                  onClick={() => setPendingDelete(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="gem-rail__link gem-rail__link--danger"
                  onClick={() => {
                    setPendingDelete(false);
                    void deleteChat(chatId);
                  }}
                >
                  Delete
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="gem-rail__link"
                onClick={() => setPendingDelete(true)}
              >
                Delete chat
              </button>
            )
          ) : null}
        </div>
      </aside>

      {railOpen ? (
        <button
          type="button"
          className="gem-rail__scrim"
          aria-label="Close history"
          onClick={() => setRailOpen(false)}
        />
      ) : null}

      <div className={`gem-stage ${empty ? "gem-stage--intro" : ""}`}>
        <div className="gem-stage__bar">
          <button
            type="button"
            className="gem-icon-btn"
            aria-label={railOpen ? "Hide chats" : "Show chats"}
            aria-expanded={railOpen}
            onClick={() => setRailOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 7h16M4 12h16M4 17h10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {!empty ? (
            <div className="gem-stage__meta">
              {renaming ? (
                <input
                  ref={renameRef}
                  className="gem-stage__title input !py-1 !px-2 !text-sm"
                  value={renameDraft}
                  disabled={renameBusy}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={() => void saveRename()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveRename();
                    }
                    if (e.key === "Escape") {
                      setRenaming(false);
                    }
                  }}
                  aria-label="Chat title"
                />
              ) : (
                <>
                  <button
                    type="button"
                    className="gem-stage__title"
                    onClick={startRename}
                    title="Click to rename"
                  >
                    {chatTitle}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost !px-2 !py-0.5 text-xs"
                    onClick={startRename}
                  >
                    Rename
                  </button>
                </>
              )}
              {modeToggle}
            </div>
          ) : (
            <div className="gem-stage__meta gem-stage__meta--intro">{modeToggle}</div>
          )}
          <button
            type="button"
            className="gem-icon-btn"
            aria-label="New chat"
            onClick={() => void newChat()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {importedChats.length > 0 ? (
          <div className="gem-imports">
            <span>Using history from</span>
            {importedChats.map((c) => (
              <button
                key={c.id}
                type="button"
                className="gem-imports__chip"
                onClick={() =>
                  void saveImports(importedIds.filter((id) => id !== c.id))
                }
              >
                {c.title} ×
              </button>
            ))}
          </div>
        ) : null}

        {attachedPills.length > 0 ? (
          <div className="gem-imports">
            <span>Pills</span>
            {attachedPills.map((p) => (
              <button
                key={p.id}
                type="button"
                className="gem-imports__chip gem-imports__chip--pill"
                title={p.body}
                onClick={() =>
                  void savePills(
                    attachedPills.filter((x) => x.id !== p.id).map((x) => x.id)
                  )
                }
              >
                {p.title} ×
              </button>
            ))}
          </div>
        ) : null}

        {pillOpen ? (
          <div className="gem-import-panel">
            <div className="gem-import-panel__head">
              <div>
                <strong>Knowledge pills</strong>
                <p>
                  Detailed prior context (N) for this chat — and a portable
                  <code className="mx-1">.pill.md</code>
                  you can paste into ChatGPT, Claude, Gemini, or any AI.
                </p>
              </div>
              <button
                type="button"
                className="gem-text-btn"
                onClick={() => setPillOpen(false)}
              >
                Close
              </button>
            </div>
            {lastPillId ? (
              <div className="gem-pill-export">
                <span>Latest pill ready to share</span>
                <button
                  type="button"
                  className="gem-rail__link"
                  onClick={() => {
                    const pill = allPills.find((p) => p.id === lastPillId);
                    if (pill) void copyPillMarkdown(pill);
                  }}
                >
                  {pillCopied && lastPillId ? "Copied" : "Copy markdown"}
                </button>
                <button
                  type="button"
                  className="gem-rail__link"
                  onClick={() => downloadPill(lastPillId)}
                >
                  Download .pill.md
                </button>
              </div>
            ) : null}
            {allPills.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No pills yet. Open a chat with history and tap Make pill.
              </p>
            ) : (
              <ul className="gem-import-panel__list">
                {allPills.map((p) => {
                  const checked = pillPick.includes(p.id);
                  return (
                    <li key={p.id}>
                      <label className="gem-import-panel__row">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setPillPick((prev) =>
                              checked
                                ? prev.filter((id) => id !== p.id)
                                : [...prev, p.id]
                            )
                          }
                        />
                        <span>
                          <strong>{p.title}</strong>
                          <small>{p.body.slice(0, 160)}</small>
                          <span className="gem-pill-row-actions">
                            <button
                              type="button"
                              className="gem-rail__link"
                              onClick={(e) => {
                                e.preventDefault();
                                void copyPillMarkdown(p);
                              }}
                            >
                              Copy
                            </button>
                            <button
                              type="button"
                              className="gem-rail__link"
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
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void savePills(pillPick)}
            >
              Apply pills
            </button>
          </div>
        ) : null}

        {importOpen ? (
          <div className="gem-import-panel">
            <div className="gem-import-panel__head">
              <div>
                <strong>Import chat history</strong>
                <p>
                  Selected chats feed this conversation for continuity — facts
                  still need Library citations.
                </p>
              </div>
              <button
                type="button"
                className="gem-text-btn"
                onClick={() => setImportOpen(false)}
              >
                Close
              </button>
            </div>
            {importCandidates.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No other chats yet. Start another chat, then import it here.
              </p>
            ) : (
              <ul className="gem-import-panel__list">
                {importCandidates.map((c) => {
                  const checked = importPick.includes(c.id);
                  return (
                    <li key={c.id}>
                      <label className="gem-import-panel__row">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setImportPick((prev) =>
                              checked
                                ? prev.filter((id) => id !== c.id)
                                : [...prev, c.id]
                            )
                          }
                        />
                        <span>
                          <strong>{c.title}</strong>
                          <small>
                            {formatWhen(c.updatedAt)} · {c.messageCount} messages
                          </small>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void saveImports(importPick)}
            >
              Apply imports
            </button>
          </div>
        ) : null}

        {empty ? (
          <div className="gem-hello">
            <h1 className="gem-hello__title">
              <span className="gem-hello__grad">Hello, {userName}</span>
            </h1>
            <p className="gem-hello__sub">
              {mode === "sidekick"
                ? `Ask ${activeSidekick?.name || "your Sidekick"} — trained on your private shelf for this profile.`
                : "Ask Alt — grounded answers from company knowledge."}
            </p>
            {composer}
            <div className="gem-cards">
              {AGENTS.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="gem-card"
                  onClick={() => {
                    setInput(`@${a.name} `);
                    inputRef.current?.focus();
                  }}
                >
                  <span className="gem-card__title">@{a.name}</span>
                  <span className="gem-card__body">{a.role}</span>
                </button>
              ))}
            </div>
            <p className="gem-hello__agents-link">
              <a href="/app/agents">Browse all agents</a>
            </p>
          </div>
        ) : (
          <>
            <div className="gem-thread">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="gem-turn gem-turn--user">
                    <div className="gem-bubble">{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className="gem-turn gem-turn--assistant">
                    <div className="gem-avatar" aria-hidden>
                      S
                    </div>
                    <div className="gem-response">
                      <AnswerBody
                        content={m.content}
                        citations={m.citations}
                        agentId={m.agentId}
                        agentName={m.agentName}
                        messageId={m.id}
                        chatId={chatId}
                      />
                    </div>
                  </div>
                )
              )}
              {loading ? (
                <div className="gem-turn gem-turn--assistant">
                  <div className="gem-avatar" aria-hidden>
                    S
                  </div>
                  <div className="gem-thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : null}
              {error ? <p className="gem-error">{error}</p> : null}
              <div ref={bottomRef} />
            </div>
            <div className="gem-dock">
              {composer}
              <p className="gem-dock__note">
                Grounded answers · cite or refuse · Alt may be wrong
              </p>
            </div>
          </>
        )}

        {empty && error ? <p className="gem-error gem-error--center">{error}</p> : null}
      </div>
    </div>
  );
}
