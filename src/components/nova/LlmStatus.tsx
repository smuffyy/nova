"use client";

import { useEffect, useState } from "react";

type Status = {
  provider: string;
  model: string;
  label: string;
  connected: boolean;
  capabilities: string[];
  howToConnect?: Record<string, string>;
};

export function LlmStatus() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    void fetch("/api/nova/chat")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  if (!status) {
    return <p className="n-secondary">Checking connection…</p>;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 600 }}>
            {status.connected ? status.label : "Not connected"}
          </div>
          <div className="n-meta" style={{ marginTop: 4 }}>
            {status.connected
              ? `${status.provider} · ${status.model}`
              : "Demo mode — business data only"}
          </div>
        </div>
        <span
          className={`nova-status ${status.connected ? "is-available" : "is-waiting"}`}
        >
          <span className="nova-status__dot" />
          {status.connected ? "Live" : "Local"}
        </span>
      </div>

      {status.capabilities?.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {status.capabilities.map((c) => (
            <span
              key={c}
              style={{
                fontSize: "0.72rem",
                padding: "4px 8px",
                borderRadius: 999,
                background: "var(--n-fill)",
                color: "var(--n-muted)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}

      <div className="n-secondary" style={{ fontSize: "0.84rem", lineHeight: 1.55 }}>
        <strong style={{ color: "var(--n-ink)" }}>Add to <code>.env</code> then restart:</strong>
        <br />
        <code>OPENROUTER_API_KEY=…</code> — easiest (Claude, GPT, Grok, Gemini)
        <br />
        <code>XAI_API_KEY=…</code> — Grok with web / X / code
        <br />
        <code>ANTHROPIC_API_KEY=…</code> — Claude
        <br />
        <code>OPENAI_API_KEY=…</code> — OpenAI
        <br />
        Or any OpenAI-compatible API via <code>NOVA_LLM_API_KEY</code> +{" "}
        <code>NOVA_LLM_BASE_URL</code>
      </div>
    </div>
  );
}
