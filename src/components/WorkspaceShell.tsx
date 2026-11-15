"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Pane = {
  href: string;
  id: string;
  label: string;
  hint: string;
  need?: string;
  needAny?: string[];
};

const PANES: Pane[] = [
  {
    href: "/app/workspace/library",
    id: "library",
    label: "Library",
    hint: "Company knowledge",
    need: "dojo.company",
  },
  {
    href: "/app/workspace/people",
    id: "people",
    label: "People",
    hint: "Roles & access",
    need: "roles.manage",
  },
  {
    href: "/app/workspace/money",
    id: "money",
    label: "Money",
    hint: "Books & cash",
    need: "finance.money",
  },
  {
    href: "/app/workspace/connectors",
    id: "connectors",
    label: "Connectors",
    hint: "CSV & export bridges",
    needAny: ["dojo.company", "finance.money"],
  },
];

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [caps, setCaps] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void fetch("/api/session")
      .then((r) => r.json())
      .then((d) => {
        setCaps(d.capabilities || []);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const panes = PANES.filter((p) => {
    if (p.needAny?.length) return p.needAny.some((c) => caps.includes(c));
    return Boolean(p.need && caps.includes(p.need));
  });

  const wideMain =
    pathname.startsWith("/app/workspace/money") ||
    pathname.startsWith("/app/workspace/connectors");

  return (
    <div className="workspace-settings">
      <aside className="workspace-settings__nav" aria-label="Workspace">
        <div className="workspace-settings__brand">
          <p className="workspace-settings__eyebrow">Workspace</p>
          <h1>Settings</h1>
          <p className="workspace-settings__sub">
            Company tools stay here — everyday work stays calm.
          </p>
        </div>
        <nav className="workspace-settings__list">
          {!ready ? (
            <p className="workspace-settings__empty">Loading…</p>
          ) : panes.length === 0 ? (
            <p className="workspace-settings__empty">
              No admin panes for your role.
            </p>
          ) : (
            panes.map((pane) => {
              const active =
                pathname === pane.href ||
                pathname.startsWith(`${pane.href}/`);
              return (
                <Link
                  key={pane.id}
                  href={pane.href}
                  className={`workspace-settings__item ${active ? "is-active" : ""}`}
                >
                  <span>{pane.label}</span>
                  <small>{pane.hint}</small>
                </Link>
              );
            })
          )}
        </nav>
      </aside>
      <div
        className={`workspace-settings__main ${
          wideMain ? "workspace-settings__main--wide" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
