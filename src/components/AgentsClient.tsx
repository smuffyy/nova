"use client";

import Link from "next/link";
import { AGENTS } from "@/lib/agents/catalog";
import { AgentIcon } from "@/components/AgentIcon";

export function AgentsClient() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--mineral)] uppercase">
            Named agents
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-wide sm:text-4xl">
            Specialists on call
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Same company memory as Chat — different jobs. In Chat, type{" "}
            <span className="text-[var(--fg)]">@</span> and an agent name to put
            them to work. They propose; you approve write-backs.
          </p>
        </div>
        <Link href="/app" className="btn btn-primary">
          Open Chat
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((agent) => (
          <article key={agent.id} className="agent-card panel p-5">
            <div className="flex items-start gap-4">
              <div className="agent-card__icon">
                <AgentIcon name={agent.name} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11px] tracking-[0.16em] text-[var(--mineral)] uppercase">
                  {agent.role}
                </p>
                <h2 className="mt-1 text-xl font-medium tracking-wide">
                  @{agent.name}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">{agent.body}</p>
              </div>
            </div>

            <ul className="mt-5 space-y-1.5 border-t border-[var(--line)] pt-4">
              {agent.capabilities.map((cap) => (
                <li
                  key={cap}
                  className="text-sm text-[var(--muted)] before:mr-2 before:text-[var(--accent)] before:content-['·']"
                >
                  {cap}
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2">
              {agent.id === "ledger" ? (
                <Link
                  href="/app/workspace/money"
                  className="block rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--fg)] hover:border-[var(--accent)]"
                >
                  Open money dashboard →
                </Link>
              ) : null}
              {agent.starterPrompts.slice(0, 2).map((prompt) => (
                <Link
                  key={prompt}
                  href={`/app?q=${encodeURIComponent(prompt)}`}
                  className="block rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  {prompt}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
