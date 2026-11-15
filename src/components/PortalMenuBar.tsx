"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AxiomClock } from "@/components/AxiomClock";
import { DemoButton } from "@/components/DemoButton";
import { PortalLogo } from "@/components/PortalLogo";
import { BRAND } from "@/brand";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#chat", label: "Chat" },
  { href: "#sidekick", label: "Sidekick" },
  { href: "#agents", label: "Agents" },
  { href: "#digest", label: "Digest" },
  { href: "#contact", label: "Contact" },
];

/**
 * Top chrome: brand left · floating ask pill center · clock right.
 * Pill expands on hover; hamburger pins the menu open.
 */
export function PortalMenuBar() {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;

  const closePinned = useCallback(() => setPinned(false), []);

  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePinned();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinned, closePinned]);

  useEffect(() => {
    document.body.style.overflow = pinned ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [pinned]);

  return (
    <header className="portal-header">
      <Link href="/" className="portal-header-brand" aria-label={BRAND.homeLabel}>
        <PortalLogo size={40} />
        <span>{BRAND.name}</span>
      </Link>

      <div
        className={`portal-menubar ${open ? "is-open" : ""} ${pinned ? "is-pinned" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="portal-menubar-shell">
          <div className="portal-menubar-bar">
            <p className="portal-menubar-tag">{BRAND.askLine}</p>

            <button
              type="button"
              className="portal-menubar-toggle"
              aria-label={pinned ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setPinned((v) => !v)}
            >
              <span className={pinned ? "is-close" : ""} />
              {!pinned ? (
                <>
                  <span />
                  <span />
                </>
              ) : null}
            </button>
          </div>

          <div className="portal-menubar-panel" aria-hidden={!open}>
            <nav className="portal-menubar-nav" aria-label="Main">
              {LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={closePinned}>
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="portal-menubar-actions">
              <a
                href="#contact"
                className="portal-menubar-btn portal-menubar-btn-ghost"
                onClick={closePinned}
              >
                REQUEST PILOT
              </a>
              <div className="portal-menubar-actions-row">
                <DemoButton
                  className="portal-menubar-btn portal-menubar-btn-solid"
                  label="OPEN DEMO"
                />
                <a
                  href="#contact"
                  className="portal-menubar-btn portal-menubar-btn-solid"
                  onClick={closePinned}
                >
                  JOIN WAITLIST
                </a>
              </div>
            </div>
          </div>
        </div>

        {pinned ? (
          <button
            type="button"
            className="portal-menubar-backdrop"
            aria-label="Close menu"
            onClick={closePinned}
          />
        ) : null}
      </div>

      <div className="portal-header-meta">
        <AxiomClock />
      </div>
    </header>
  );
}
