import Link from "next/link";
import { notFound } from "next/navigation";
import { AGENTS } from "@/lib/nova/data";
import { toolsFor } from "@/lib/nova/tools";

const GLYPH: Record<string, string> = {
  ceo: "◎",
  finance: "$",
  sales: "↗",
  marketing: "✦",
  operations: "◌",
  research: "⌕",
};

type Props = { params: Promise<{ handle: string }> };

export default async function NovaAgentDetailPage({ params }: Props) {
  const { handle } = await params;
  const agent = AGENTS.find((a) => a.handle === handle);
  if (!agent) notFound();
  const tools = toolsFor(agent.handle);

  return (
    <div className="nova-page">
      <Link href="/nova/agents" className="n-btn n-btn--ghost" style={{ paddingLeft: 0 }}>
        ← All agents
      </Link>
      <header style={{ marginTop: 20, marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="nova-agent-glyph" style={{ width: 44, height: 44, fontSize: "1rem" }}>
            {GLYPH[agent.handle]}
          </span>
          <div>
            <h1 className="n-title" style={{ fontSize: "1.85rem" }}>
              {agent.name}
            </h1>
            <p className="n-secondary" style={{ marginTop: 4 }}>
              @{agent.handle} · {agent.role}
            </p>
          </div>
        </div>
        <div className={`nova-status is-${agent.status}`} style={{ marginTop: 14 }}>
          <span className="nova-status__dot" />
          {agent.status.replace("_", " ")}
          {agent.currentTask ? ` · ${agent.currentTask}` : ""}
        </div>
      </header>

      <section className="n-card" style={{ marginBottom: 12 }}>
        <h2 className="n-h3">About</h2>
        <p className="n-secondary" style={{ marginTop: 10 }}>
          {agent.description}
        </p>
      </section>

      <section className="n-card" style={{ marginBottom: 12 }}>
        <h2 className="n-h3">Capabilities</h2>
        <ul className="n-body" style={{ margin: "12px 0 0", paddingLeft: "1.1rem", lineHeight: 1.7 }}>
          {agent.capabilities.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="n-card" style={{ marginBottom: 12 }}>
        <h2 className="n-h3">Memory</h2>
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {agent.memory.map((m) => (
            <div key={m.label}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{m.label}</div>
              <div className="n-secondary" style={{ marginTop: 2 }}>
                {m.detail}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="n-card" style={{ marginBottom: 12 }}>
        <h2 className="n-h3">Tools</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {tools.map((t) => (
            <span
              key={t}
              style={{
                fontSize: "0.78rem",
                padding: "5px 10px",
                borderRadius: 999,
                background: "var(--n-fill)",
                color: "var(--n-muted)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="n-card" style={{ marginBottom: 24 }}>
        <h2 className="n-h3">Permissions</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {agent.permissions.map((p) => (
            <span
              key={p}
              style={{
                fontSize: "0.78rem",
                padding: "5px 10px",
                borderRadius: 999,
                background: "var(--n-accent-soft)",
                color: "var(--n-accent)",
              }}
            >
              {p.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </section>

      <Link
        href={`/nova/chat?prompt=%40${agent.handle}%20What%20should%20I%20focus%20on%3F`}
        className="n-btn n-btn--primary"
      >
        Chat with @{agent.handle}
      </Link>
    </div>
  );
}
