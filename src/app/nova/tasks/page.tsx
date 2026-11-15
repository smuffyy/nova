"use client";

import Link from "next/link";
import { useState } from "react";
import { TASKS, agentDisplayName } from "@/lib/nova/data";
import type { NovaTask, NovaTaskStatus } from "@/types/nova";

const SECTIONS: { key: NovaTaskStatus; title: string }[] = [
  { key: "do_today", title: "Do today" },
  { key: "waiting", title: "Waiting" },
  { key: "in_progress", title: "In progress" },
  { key: "completed", title: "Completed" },
];

export default function NovaTasksPage() {
  const [items, setItems] = useState<NovaTask[]>(TASKS);

  function complete(id: string) {
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "completed" } : t))
    );
  }

  return (
    <div className="nova-page">
      <header style={{ marginBottom: 36 }}>
        <h1 className="n-title">Tasks</h1>
        <p className="n-secondary" style={{ marginTop: 10 }}>
          Work created by your AI team.
        </p>
      </header>
      <div style={{ display: "grid", gap: 32 }}>
        {SECTIONS.map((section) => {
          const sectionItems = items.filter((t) => t.status === section.key);
          return (
            <section key={section.key}>
              <h2 className="n-label" style={{ marginBottom: 12 }}>
                {section.title}
                <span className="n-meta" style={{ marginLeft: 8 }}>
                  {sectionItems.length}
                </span>
              </h2>
              <div className="n-feed">
                {sectionItems.length === 0 ? (
                  <p className="n-secondary">Nothing here.</p>
                ) : (
                  sectionItems.map((t) => (
                    <article key={t.id} className="n-feed__item">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 16,
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <h3 className="n-h3">{t.title}</h3>
                          <p className="n-meta" style={{ marginTop: 6 }}>
                            {agentDisplayName(t.createdBy)} · @{t.createdBy}
                          </p>
                          <p className="n-body" style={{ marginTop: 10 }}>
                            {t.reason}
                          </p>
                          <p className="n-secondary" style={{ marginTop: 6 }}>
                            Impact · {t.impact}
                          </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <Link
                            href={`/nova/chat?prompt=%40${t.createdBy}%20Help%20with%3A%20${encodeURIComponent(t.title)}`}
                            className="n-btn n-btn--primary"
                          >
                            {section.key === "completed" ? "Review" : "Handle"}
                          </Link>
                          {section.key !== "completed" ? (
                            <button
                              type="button"
                              className="n-btn"
                              onClick={() => complete(t.id)}
                            >
                              Mark done
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
