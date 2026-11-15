"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { Paperclip, ArrowUp, PanelRight } from "lucide-react";
import { AGENTS, AGENT_MENTION_META } from "@/lib/nova/data";
import { parseMentions, runOrchestrator } from "@/lib/nova/orchestrator";
import type { AgentHandle, ChatBlock, ChatMessage } from "@/types/nova";
import { AGENT_GLYPH, useNovaShell } from "@/components/nova/NovaShell";

const PLACEHOLDERS = [
  "Ask Finance why profit changed…",
  "Ask Sales which customers need attention…",
  "Ask NOVA what I should focus on today…",
  "Ask Operations what’s stuck…",
];

function MessageBlocks({
  blocks,
  onAction,
}: {
  blocks: ChatBlock[];
  onAction: (id: string) => void;
}) {
  return (
    <div className="nova-block">
      {blocks.map((b, i) => {
        if (b.type === "findings") {
          return (
            <div key={i} className="nova-findings">
              {b.items.map((item) => (
                <div key={item.label} className="nova-finding">
                  <div>
                    <div className="nova-finding__label">{item.label}</div>
                    {item.detail ? (
                      <div className="nova-finding__detail">{item.detail}</div>
                    ) : null}
                  </div>
                  <div className="nova-finding__value">{item.value}</div>
                </div>
              ))}
            </div>
          );
        }
        if (b.type === "recommendation") {
          return (
            <p key={i} className="n-body">
              {b.text}
            </p>
          );
        }
        if (b.type === "actions") {
          return (
            <div key={i} className="nova-actions">
              {b.actions.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`n-btn ${a.variant === "primary" ? "n-btn--primary" : ""}`}
                  onClick={() => onAction(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          );
        }
        if (b.type === "approval") {
          return (
            <div key={i} className="nova-approval">
              <div className="n-sev is-high" style={{ marginBottom: 10 }}>
                <span className="n-sev__dot" />
                Approval needed
              </div>
              <div className="n-h3">{b.action}</div>
              <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                {b.amount ? (
                  <p className="n-secondary">
                    Amount · <strong style={{ color: "var(--n-ink)" }}>{b.amount}</strong>
                  </p>
                ) : null}
                {b.party ? (
                  <p className="n-secondary">
                    Customer · <strong style={{ color: "var(--n-ink)" }}>{b.party}</strong>
                  </p>
                ) : null}
                <p className="n-secondary">{b.reason}</p>
              </div>
              {b.status === "pending" ? (
                <div className="nova-actions" style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className="n-btn n-btn--primary"
                    onClick={() => onAction(`approve:${b.id}`)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="n-btn"
                    onClick={() => onAction(`edit:${b.id}`)}
                  >
                    Review
                  </button>
                  <button
                    type="button"
                    className="n-btn n-btn--ghost"
                    onClick={() => onAction(`reject:${b.id}`)}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <p className="n-secondary" style={{ marginTop: 14, color: "var(--n-success)" }}>
                  {b.status === "approved" ? "Completed by @finance" : "Rejected"}
                </p>
              )}
            </div>
          );
        }
        if (b.type === "collaboration" || b.type === "activity") {
          return (
            <div key={i} className="nova-activity-card">
              <div className="n-label" style={{ marginBottom: 12 }}>
                {b.type === "collaboration" ? "Team collaboration" : "Working"}
              </div>
              <div className="nova-collab">
                {b.steps.map((s) => (
                  <div key={s.agent + s.label} className="nova-collab__step">
                    <span className="nova-collab__mark">
                      {s.status === "done" ? "✓" : s.status === "working" ? "●" : "○"}
                    </span>
                    <strong>@{s.agent}</strong>
                    <span className="n-secondary" style={{ margin: 0 }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        if (b.type === "plan") {
          return (
            <div key={i} className="nova-plan">
              <h3 className="n-h2">{b.title}</h3>
              <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
                {b.items.map((item) => (
                  <div key={item.agent}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>@{item.agent}</div>
                    <p className="n-secondary" style={{ marginTop: 4 }}>
                      {item.finding}
                    </p>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid var(--n-divider)",
                }}
              >
                <div className="n-label">Combined opportunity</div>
                <div
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    marginTop: 6,
                  }}
                >
                  {b.total}
                </div>
              </div>
              <div className="nova-actions" style={{ marginTop: 16 }}>
                {b.actions.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="n-btn n-btn--primary"
                    onClick={() => onAction(a.id)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          );
        }
        if (b.type === "text") {
          return (
            <p key={i} className="n-body">
              {b.text}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}

function renderUserText(text: string) {
  const parts = text.split(/(@[a-z]+)/gi);
  return parts.map((part, i) => {
    if (/^@[a-z]+$/i.test(part)) {
      const handle = part.slice(1).toLowerCase();
      if (AGENTS.some((a) => a.handle === handle)) {
        return (
          <span key={i} className="n-chip" style={{ margin: "0 2px" }}>
            {part.toLowerCase()}
          </span>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

export function NovaChat() {
  const params = useSearchParams();
  const { contextOpen, setContextOpen, setDrawerOpen } = useNovaShell();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      agent: "nova",
      content: "Your team is ready. Mention an agent with @, or ask anything.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [brain, setBrain] = useState<{
    provider: string;
    model: string;
    label: string;
    connected: boolean;
    capabilities: string[];
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const bootPrompt = params.get("prompt");
  const booted = useRef(false);

  useEffect(() => {
    void fetch("/api/nova/chat")
      .then((r) => r.json())
      .then((d) =>
        setBrain({
          provider: d.provider,
          model: d.model,
          label: d.label || d.provider,
          connected: Boolean(d.connected),
          capabilities: d.capabilities || [],
        })
      )
      .catch(() => null);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 4200);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const mentionOptions = useMemo(() => {
    const q = mentionQuery.toLowerCase();
    return AGENTS.filter(
      (a) =>
        a.handle.includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
    );
  }, [mentionQuery]);

  const updateMentionState = useCallback((value: string, caret: number) => {
    const before = value.slice(0, caret);
    const match = before.match(/@([a-z]*)$/i);
    if (match) {
      setMentionOpen(true);
      setMentionQuery(match[1] || "");
      setMentionIndex(0);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
    }
  }, []);

  const insertMention = useCallback(
    (handle: AgentHandle) => {
      const el = taRef.current;
      if (!el) return;
      const caret = el.selectionStart;
      const before = input.slice(0, caret);
      const after = input.slice(caret);
      const replaced = before.replace(/@([a-z]*)$/i, `@${handle} `);
      const next = replaced + after;
      setInput(next);
      setMentionOpen(false);
      requestAnimationFrame(() => {
        el.focus();
        const pos = replaced.length;
        el.setSelectionRange(pos, pos);
      });
    },
    [input]
  );

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim();
      if (!text || busy) return;
      setInput("");
      setMentionOpen(false);
      setBusy(true);
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      try {
        const history = [...messages, userMsg]
          .filter((m) => m.content && (m.role === "user" || m.role === "assistant"))
          .slice(-16)
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

        const res = await fetch("/api/nova/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: "assistant",
              agent: "nova",
              content: data.error || "NOVA couldn’t complete that request.",
              createdAt: new Date().toISOString(),
            },
          ]);
          return;
        }
        const next = (data.messages || []) as ChatMessage[];
        if (next.length) {
          setMessages((prev) => [...prev, ...next]);
        } else {
          // Local animated demo fallback
          await runOrchestrator(text, (msg) => {
            setMessages((prev) => [...prev, msg]);
          });
        }
        if (data.provider && data.model) {
          setBrain((b) => ({
            provider: data.provider,
            model: data.model,
            label: data.label || b?.label || data.provider,
            connected: data.provider !== "mock",
            capabilities: b?.capabilities || [],
          }));
        }
      } catch {
        await runOrchestrator(text, (msg) => {
          setMessages((prev) => [...prev, msg]);
        });
      } finally {
        setBusy(false);
      }
    },
    [input, busy, messages]
  );

  useEffect(() => {
    if (!bootPrompt || booted.current) return;
    booted.current = true;
    void send(bootPrompt);
  }, [bootPrompt, send]);

  function onAction(id: string) {
    if (id === "investigate-suppliers") {
      void send("@finance Investigate which suppliers caused the material cost increase");
      return;
    }
    if (id === "see-receivables") {
      void send("@finance Show overdue invoices and receivables");
      return;
    }
    if (id === "approve-all" || id.startsWith("approve:")) {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: "assistant",
          agent: "nova",
          content: "Done. @finance completed the action.",
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }
    if (id === "create-plan") {
      void send("@ceo Create an action plan from the 20% profit findings");
      return;
    }
    if (id === "profit") {
      void send(
        "@ceo I want to increase profit by 20% in the next 6 months. Figure out how."
      );
      return;
    }
    if (id === "brief") {
      window.location.href = "/nova";
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionOpen && mentionOptions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => Math.min(i + 1, mentionOptions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(mentionOptions[mentionIndex].handle);
        return;
      }
      if (e.key === "Escape") {
        setMentionOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="nova-page nova-page--chat">
      <header className="nova-chat-top">
        <div>
          <div style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>NOVA</div>
          <div className="n-meta" style={{ marginTop: 2 }}>
            {brain?.connected
              ? `${brain.label} · ${brain.model}${
                  brain.capabilities.length
                    ? ` · ${brain.capabilities.slice(0, 4).join(" · ")}`
                    : ""
                }`
              : "Local demo · add an LLM key in .env for full intelligence"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="n-btn nova-menu-btn"
            onClick={() => setDrawerOpen(true)}
          >
            Menu
          </button>
          <button
            type="button"
            className="n-btn"
            onClick={() => setContextOpen(!contextOpen)}
            aria-label="Toggle context"
            title="Context"
          >
            <PanelRight size={16} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div className="nova-chat-stream">
        <div className="nova-chat-stream__inner">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={isUser ? "nova-msg--user" : "nova-msg--ai"}>
                {!isUser && m.agent ? (
                  <div className="nova-msg__agent">
                    {m.agent === "nova" ? "NOVA" : `○ @${m.agent}`}
                  </div>
                ) : null}
                {m.content ? (
                  <div className={isUser ? undefined : "nova-msg__text"}>
                    {isUser ? renderUserText(m.content) : m.content}
                  </div>
                ) : null}
                {m.blocks ? <MessageBlocks blocks={m.blocks} onAction={onAction} /> : null}
              </div>
            );
          })}
          {busy ? (
            <div className="n-secondary">● Your team is working…</div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="nova-composer-wrap">
        <form className="nova-composer" onSubmit={onSubmit}>
          {mentionOpen && mentionOptions.length ? (
            <div className="nova-mention-menu" role="listbox">
              {mentionOptions.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  role="option"
                  aria-selected={i === mentionIndex}
                  className={`nova-mention-item ${i === mentionIndex ? "is-active" : ""}`}
                  onClick={() => insertMention(a.handle)}
                >
                  <span className="nova-agent-glyph">{AGENT_GLYPH[a.handle]}</span>
                  <span>
                    <div className="nova-mention-item__title">
                      {a.name}{" "}
                      <span style={{ color: "var(--n-tertiary)", fontWeight: 400 }}>
                        @{a.handle}
                      </span>
                    </div>
                    <div className="nova-mention-item__blurb">
                      {AGENT_MENTION_META[a.handle].blurb}
                    </div>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="nova-composer__box">
            <textarea
              ref={taRef}
              value={input}
              rows={1}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              aria-label="Ask your AI team"
              onChange={(e) => {
                setInput(e.target.value);
                updateMentionState(e.target.value, e.target.selectionStart);
              }}
              onClick={(e) =>
                updateMentionState(e.currentTarget.value, e.currentTarget.selectionStart)
              }
              onKeyUp={(e) =>
                updateMentionState(e.currentTarget.value, e.currentTarget.selectionStart)
              }
              onKeyDown={onKeyDown}
            />
            <button type="button" className="n-btn" style={{ padding: 8 }} title="Attach" aria-label="Attach">
              <Paperclip size={16} strokeWidth={1.75} />
            </button>
            <button
              type="submit"
              className="n-btn n-btn--primary"
              style={{ padding: "8px 10px", borderRadius: 999 }}
              disabled={busy || !input.trim()}
              aria-label="Send"
            >
              <ArrowUp size={16} strokeWidth={2} />
            </button>
          </div>
          <div className="nova-composer__meta">
            <span>
              @ Mention ·{" "}
              {parseMentions(input).map((h) => `@${h}`).join(" ") || "CEO by default"}
            </span>
            <span>⌘ Enter</span>
          </div>
        </form>
      </div>
    </div>
  );
}
