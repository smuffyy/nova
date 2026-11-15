"use client";

import Link from "next/link";
import {
  BUSINESS,
  BRIEFING,
  agentDisplayName,
  formatToday,
  greetingForNow,
} from "@/lib/nova/data";

const severityCopy: Record<string, string> = {
  critical: "Critical",
  high: "Priority",
  medium: "Opportunity",
  low: "Note",
};

export default function NovaHomePage() {
  const greeting = greetingForNow();
  const day = formatToday();
  const critical = BRIEFING.filter((b) => b.severity === "critical").length;
  const opportunities = BRIEFING.filter(
    (b) => b.severity === "high" || b.severity === "medium"
  ).length;

  return (
    <div className="nova-page">
      <header style={{ marginBottom: 40 }}>
        <p className="n-meta">{day}</p>
        <h1 className="n-hero" style={{ marginTop: 12 }}>
          {greeting}, {BUSINESS.owner}.
        </h1>
        <p className="n-secondary" style={{ marginTop: 12, fontSize: "1rem" }}>
          Your AI team found {BRIEFING.length} things worth your attention.
        </p>
        <div className="n-stats">
          <div className="n-stat">
            <strong>{BRIEFING.length}</strong> priorities
          </div>
          <div className="n-stat">
            <strong>{opportunities}</strong> opportunities
          </div>
          <div className="n-stat">
            <strong>{critical}</strong> needing action
          </div>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <h2 className="n-label">Today</h2>
        <Link href="/nova/chat" className="n-btn n-btn--primary">
          Ask NOVA
        </Link>
      </div>

      <div className="n-feed">
        {BRIEFING.map((item) => (
          <article key={item.id} className="n-feed__item">
            <div className={`n-sev is-${item.severity}`} style={{ marginBottom: 10 }}>
              <span className="n-sev__dot" />
              {severityCopy[item.severity]} · {agentDisplayName(item.agent)} (@
              {item.agent})
            </div>
            <h3 className="n-h3">{item.title}</h3>
            <p className="n-body" style={{ marginTop: 8 }}>
              {item.summary}
            </p>
            {item.impact ? (
              <p className="n-secondary" style={{ marginTop: 10 }}>
                Impact · <strong style={{ color: "var(--n-ink)" }}>{item.impact}</strong>
              </p>
            ) : null}
            <p className="n-secondary" style={{ marginTop: 12 }}>
              {agentDisplayName(item.agent)} recommends{" "}
              {item.recommendation.charAt(0).toLowerCase()}
              {item.recommendation.slice(1)}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              <Link
                href={item.primaryAction.href || "/nova/chat"}
                className="n-btn n-btn--primary"
              >
                {item.primaryAction.label}
              </Link>
              {item.secondaryAction ? (
                <Link
                  href={item.secondaryAction.href || "/nova/chat"}
                  className="n-btn"
                >
                  {item.secondaryAction.label}
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
