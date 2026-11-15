"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BookOpen,
  CheckSquare,
  Home,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  Search,
  Settings,
  Users,
  Activity,
} from "lucide-react";
import { AGENTS, BUSINESS } from "@/lib/nova/data";
import type { AgentHandle, AgentStatus } from "@/types/nova";

type ShellCtx = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  contextOpen: boolean;
  setContextOpen: (v: boolean) => void;
};

const Ctx = createContext<ShellCtx | null>(null);

export function useNovaShell() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNovaShell outside provider");
  return v;
}

const NAV = [
  { href: "/nova", label: "Home", icon: Home },
  { href: "/nova/chat", label: "Chat", icon: MessageSquare },
  { href: "/nova/agents", label: "Agents", icon: Users },
  { href: "/nova/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/nova/knowledge", label: "Knowledge", icon: BookOpen },
];

const MORE_NAV = [
  { href: "/nova/activity", label: "Activity", icon: Activity },
  { href: "/nova/integrations", label: "Integrations", icon: MoreHorizontal },
  { href: "/nova/settings", label: "Settings", icon: Settings },
];

const COMMANDS = [
  { label: "Ask Ledger about profit", href: "/nova/chat?prompt=%40finance%20Why%20did%20profit%20change%3F" },
  { label: "Ask Scout for dormant customers", href: "/nova/chat?prompt=%40sales%20Find%20dormant%20customers" },
  { label: "Ask Ledger for overdue invoices", href: "/nova/chat?prompt=%40finance%20Show%20overdue%20invoices" },
  { label: "Ask Atlas for growth strategy", href: "/nova/chat?prompt=%40ceo%20I%20want%20to%20increase%20profit%20by%2020%25%20in%20the%20next%206%20months.%20Figure%20out%20how." },
  { label: "Create task", href: "/nova/tasks" },
  { label: "Open Scout (Sales)", href: "/nova/agents/sales" },
  { label: "Open Home", href: "/nova" },
  { label: "Search knowledge", href: "/nova/knowledge" },
  { label: "View activity", href: "/nova/activity" },
];

const AGENT_GLYPH: Record<AgentHandle, string> = {
  ceo: "◎",
  finance: "$",
  sales: "↗",
  marketing: "✦",
  operations: "◌",
  research: "⌕",
};

function statusClass(s: AgentStatus) {
  return `nova-status is-${s}`;
}

function readTheme(): "light" | "dark" {
  try {
    const t = localStorage.getItem("nova-theme");
    if (t === "dark" || t === "light") return t;
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

declare global {
  interface Window {
    novaDesktop?: { isDesktop?: boolean; platform?: string; product?: string };
  }
}

function isNovaDesktop() {
  if (typeof window === "undefined") return false;
  return Boolean(window.novaDesktop?.isDesktop);
}

export function NovaShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [cmdIndex, setCmdIndex] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [desktop, setDesktop] = useState(false);

  const isChat = pathname.startsWith("/nova/chat");

  useEffect(() => {
    setTheme(readTheme());
    setDesktop(isNovaDesktop());
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
        setCmdQuery("");
        setCmdIndex(0);
      }
      if (e.key === "Escape") setCmdOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filteredCmds = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => c.label.toLowerCase().includes(q));
  }, [cmdQuery]);

  const runCmd = useCallback(
    (href: string) => {
      setCmdOpen(false);
      router.push(href);
    },
    [router]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("nova-theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      drawerOpen,
      setDrawerOpen,
      contextOpen,
      setContextOpen,
    }),
    [collapsed, drawerOpen, contextOpen]
  );

  const shellClass = [
    "nova-shell",
    collapsed ? "is-collapsed" : "",
    drawerOpen ? "is-drawer-open" : "",
    isChat && contextOpen ? "is-chat-context" : "",
    desktop ? "is-desktop" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Ctx.Provider value={value}>
      <div className={`nova-app${desktop ? " is-desktop" : ""}`} data-theme={theme}>
        <div className={shellClass}>
          <div
            className="nova-overlay"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside className="nova-sidebar" aria-label="Sidebar">
            <div className="nova-desktop-drag" aria-hidden={desktop ? undefined : true} />
            <div className="nova-sidebar__brand-row">
              <Link href="/nova" className="nova-brand">
                <span className="nova-brand__mark" aria-hidden>
                  N
                </span>
                <span className="nova-brand__name">NOVA</span>
              </Link>
              <button
                type="button"
                className="nova-collapse"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <PanelLeft size={16} strokeWidth={1.75} />
              </button>
            </div>

            <nav className="nova-nav" aria-label="Primary">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/nova"
                    ? pathname === "/nova"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nova-nav__link ${active ? "is-active" : ""}`}
                  >
                    <Icon size={17} strokeWidth={1.75} />
                    <span className="nova-nav__label">{item.label}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                className="nova-nav__link"
                onClick={() => setCmdOpen(true)}
              >
                <Search size={17} strokeWidth={1.75} />
                <span className="nova-nav__label">Search</span>
                <span className="nova-cmd-hint" style={{ marginLeft: "auto" }}>
                  ⌘K
                </span>
              </button>
            </nav>

            <div className="nova-side-section">
              <div className="nova-side-section__title">AI Team</div>
              {AGENTS.map((a) => (
                <Link
                  key={a.id}
                  href={`/nova/agents/${a.handle}`}
                  className="nova-agent-link"
                  title={`${a.name} · @${a.handle}`}
                >
                  <span className="nova-agent-glyph" aria-hidden>
                    {AGENT_GLYPH[a.handle]}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <div className="nova-agent-link__name">{a.name}</div>
                    <div className="nova-agent-link__meta">
                      <span className={statusClass(a.status)}>
                        <span className="nova-status__dot" />
                        {a.status.replace("_", " ")}
                      </span>
                    </div>
                  </span>
                </Link>
              ))}
            </div>

            <div className="nova-side-section">
              <nav className="nova-nav" aria-label="Workspace">
                {MORE_NAV.map((w) => {
                  const Icon = w.icon;
                  return (
                    <Link
                      key={w.href}
                      href={w.href}
                      className={`nova-nav__link ${
                        pathname.startsWith(w.href) ? "is-active" : ""
                      }`}
                    >
                      <Icon size={17} strokeWidth={1.75} />
                      <span className="nova-nav__label">{w.label}</span>
                    </Link>
                  );
                })}
                <button type="button" className="nova-nav__link" onClick={toggleTheme}>
                  <span className="nova-agent-glyph" aria-hidden>
                    {theme === "dark" ? "☀" : "☾"}
                  </span>
                  <span className="nova-nav__label">
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </span>
                </button>
              </nav>
            </div>

            <div className="nova-side-foot">
              <div className="nova-user__avatar">{BUSINESS.owner.slice(0, 1)}</div>
              <div className="nova-user__meta" style={{ minWidth: 0 }}>
                <div className="nova-user__name">{BUSINESS.owner}</div>
                <div className="nova-user__biz">{BUSINESS.name}</div>
              </div>
              <span className="nova-side-foot__plan nova-cmd-hint">{BUSINESS.plan}</span>
            </div>
          </aside>

          <main className="nova-main">
            <div className="nova-main__scroll">{children}</div>
            <nav className="nova-mobile-nav" aria-label="Mobile">
              {[
                { href: "/nova", label: "Home", icon: Home },
                { href: "/nova/chat", label: "Chat", icon: MessageSquare },
                { href: "/nova/agents", label: "Agents", icon: Users },
                { href: "/nova/tasks", label: "Tasks", icon: CheckSquare },
              ].map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/nova"
                    ? pathname === "/nova"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? "is-active" : ""}
                  >
                    <Icon size={20} strokeWidth={1.75} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </main>

          {isChat && contextOpen ? (
            <aside className="nova-context" aria-label="Context">
              <div className="nova-context__block">
                <div className="n-label" style={{ marginBottom: 8 }}>
                  Current agents
                </div>
                {AGENTS.filter((a) =>
                  ["ceo", "finance", "sales", "operations"].includes(a.handle)
                ).map((a) => (
                  <div key={a.id} className="nova-context__row">
                    <span>
                      {a.name}{" "}
                      <span style={{ color: "var(--n-tertiary)" }}>@{a.handle}</span>
                    </span>
                    <span className={statusClass(a.status)}>
                      <span className="nova-status__dot" />
                      {a.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="nova-context__block">
                <div className="n-label" style={{ marginBottom: 8 }}>
                  Related
                </div>
                <p className="n-secondary">
                  3 customers
                  <br />
                  2 invoices
                  <br />
                  1 document
                </p>
              </div>
              <div className="nova-context__block">
                <div className="n-label" style={{ marginBottom: 8 }}>
                  Active tasks
                </div>
                <p className="n-body" style={{ fontWeight: 600 }}>
                  2
                </p>
              </div>
            </aside>
          ) : null}
        </div>

        {cmdOpen ? (
          <div
            className="nova-cmd"
            onClick={() => setCmdOpen(false)}
            role="dialog"
            aria-label="Command palette"
          >
            <div className="nova-cmd__panel" onClick={(e) => e.stopPropagation()}>
              <input
                className="nova-cmd__input"
                autoFocus
                placeholder="Search NOVA…"
                value={cmdQuery}
                aria-label="Search NOVA"
                onChange={(e) => {
                  setCmdQuery(e.target.value);
                  setCmdIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setCmdIndex((i) => Math.min(i + 1, filteredCmds.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setCmdIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && filteredCmds[cmdIndex]) {
                    runCmd(filteredCmds[cmdIndex].href);
                  }
                }}
              />
              <div className="nova-cmd__list">
                {filteredCmds.map((c, i) => (
                  <button
                    key={c.label}
                    type="button"
                    className={`nova-cmd__item ${i === cmdIndex ? "is-active" : ""}`}
                    onMouseEnter={() => setCmdIndex(i)}
                    onClick={() => runCmd(c.href)}
                  >
                    <span>{c.label}</span>
                    <span className="nova-cmd__hint">↵</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}

export { AGENT_GLYPH };
