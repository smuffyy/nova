"use client";

import { useMemo, useState } from "react";
import { KNOWLEDGE } from "@/lib/nova/data";

const CATS = [
  "All",
  "Documents",
  "Products",
  "Customers",
  "Processes",
  "Policies",
  "Financial",
  "Operations",
] as const;

export default function NovaKnowledgePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return KNOWLEDGE.filter((d) => {
      if (cat !== "All" && d.category !== cat) return false;
      if (!q.trim()) return true;
      const hay = `${d.title} ${d.summary || ""} ${d.body || ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [q, cat]);

  const openDoc = openId ? KNOWLEDGE.find((d) => d.id === openId) : null;

  return (
    <div className="nova-page">
      <header style={{ marginBottom: 28 }}>
        <h1 className="n-title">Knowledge</h1>
        <p className="n-secondary" style={{ marginTop: 10 }}>
          Company memory your agents use before they act.
        </p>
      </header>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search knowledge…"
        aria-label="Search knowledge"
        style={{
          width: "100%",
          border: "1px solid var(--n-border)",
          borderRadius: 12,
          padding: "12px 14px",
          font: "inherit",
          marginBottom: 14,
          background: "var(--n-surface)",
          color: "var(--n-ink)",
          outline: "none",
        }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            className={`n-btn ${cat === c ? "n-btn--primary" : ""}`}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {openDoc ? (
        <article className="n-card" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className="n-btn n-btn--ghost"
            style={{ paddingLeft: 0 }}
            onClick={() => setOpenId(null)}
          >
            ← Back
          </button>
          <h2 className="n-h2" style={{ marginTop: 12 }}>
            {openDoc.title}
          </h2>
          <p className="n-meta" style={{ marginTop: 8 }}>
            {openDoc.category} · Updated {openDoc.updatedAt} · {openDoc.size}
          </p>
          {openDoc.summary ? (
            <p className="n-body" style={{ marginTop: 16 }}>
              {openDoc.summary}
            </p>
          ) : null}
          {openDoc.body ? (
            <pre
              className="n-secondary"
              style={{
                marginTop: 20,
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
                lineHeight: 1.6,
              }}
            >
              {openDoc.body}
            </pre>
          ) : null}
        </article>
      ) : null}

      <div className="n-feed">
        {filtered.length === 0 ? (
          <p className="n-secondary">No matching documents.</p>
        ) : (
          filtered.map((d) => (
            <div
              key={d.id}
              className="n-feed__item"
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div>
                <div className="n-h3" style={{ fontSize: "1rem" }}>
                  {d.title}
                </div>
                <p className="n-meta" style={{ marginTop: 6 }}>
                  {d.category} · Updated {d.updatedAt} · {d.size}
                </p>
                {d.summary ? (
                  <p className="n-secondary" style={{ marginTop: 8 }}>
                    {d.summary}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="n-btn n-btn--primary"
                onClick={() => setOpenId(d.id)}
              >
                Open
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
