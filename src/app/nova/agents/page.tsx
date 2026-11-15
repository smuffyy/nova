import Link from "next/link";
import { AGENTS } from "@/lib/nova/data";

const GLYPH: Record<string, string> = {
  ceo: "◎",
  finance: "$",
  sales: "↗",
  marketing: "✦",
  operations: "◌",
  research: "⌕",
};

export default function NovaAgentsPage() {
  return (
    <div className="nova-page nova-page--wide">
      <header style={{ marginBottom: 36 }}>
        <h1 className="n-title">Your AI team</h1>
        <p className="n-secondary" style={{ marginTop: 10 }}>
          Persistent specialists that share one business context.
        </p>
      </header>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {AGENTS.map((a) => (
          <Link
            key={a.id}
            href={`/nova/agents/${a.handle}`}
            className="n-card"
            style={{ textDecoration: "none", color: "inherit", display: "grid", gap: 12 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="nova-agent-glyph" style={{ width: 32, height: 32, fontSize: "0.85rem" }}>
                {GLYPH[a.handle]}
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>{a.name}</div>
                <div className="n-meta" style={{ marginTop: 2 }}>
                  @{a.handle} · {a.role}
                </div>
              </div>
            </div>
            <div className={`nova-status is-${a.status}`}>
              <span className="nova-status__dot" />
              {a.status.replace("_", " ")}
            </div>
            <p className="n-secondary" style={{ minHeight: "1.3em" }}>
              {a.currentTask || "Available"}
            </p>
            <span className="n-btn" style={{ justifySelf: "start" }}>
              Open
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
