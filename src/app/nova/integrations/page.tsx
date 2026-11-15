"use client";

import { useState } from "react";
import { INTEGRATIONS } from "@/lib/nova/data";

export default function NovaIntegrationsPage() {
  const [items, setItems] = useState(INTEGRATIONS);

  return (
    <div className="nova-page">
      <header style={{ marginBottom: 36 }}>
        <h1 className="n-title">Integrations</h1>
        <p className="n-secondary" style={{ marginTop: 10 }}>
          Tools your agents can use. Mock connections for the prototype.
        </p>
      </header>
      <div className="n-feed">
        {items.map((item) => (
          <div
            key={item.id}
            className="n-feed__item"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div>
              <div className="n-h3">{item.name}</div>
              <p className="n-secondary" style={{ marginTop: 6 }}>
                {item.description}
              </p>
              <p className="n-meta" style={{ marginTop: 8 }}>
                {item.connected
                  ? `Connected · Synced ${item.lastSynced}`
                  : "Not connected"}
              </p>
            </div>
            <button
              type="button"
              className={`n-btn ${item.connected ? "" : "n-btn--primary"}`}
              onClick={() =>
                setItems((prev) =>
                  prev.map((p) =>
                    p.id === item.id
                      ? {
                          ...p,
                          connected: !p.connected,
                          lastSynced: !p.connected ? "just now" : undefined,
                        }
                      : p
                  )
                )
              }
            >
              {item.connected ? "Manage" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
