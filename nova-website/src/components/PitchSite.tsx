"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AGENTS } from "@/lib/agents";

const AGENT_BLURBS: Record<string, string> = {
  ceo: "Keeps the whole company in frame and turns signal into decisions.",
  finance: "Owns cash, margins, invoices, and financial risk.",
  sales: "Watches pipeline health, dormant accounts, and follow-ups.",
  marketing: "Shapes campaigns from real segments and retention signals.",
  operations: "Surfaces inventory, fulfillment, and delivery bottlenecks.",
  research: "Brings market, competitor, and supplier context when needed.",
};

const FEATURES = [
  {
    index: "01",
    title: "One conversation. Whole-company context.",
    body: "Ask once. Strategy, finance, sales, and ops answer from the same shared picture — not six disconnected tools.",
  },
  {
    index: "02",
    title: "Specialists that stay in sync.",
    body: "Atlas, Ledger, Scout, Signal, Relay, and Prism share memory and tools, so recommendations compound instead of colliding.",
  },
  {
    index: "03",
    title: "Clarity before problems compound.",
    body: "NOVA surfaces overdue cash, dormant revenue, and operational risk early — so leaders act while there’s still room to move.",
  },
  {
    index: "04",
    title: "People stay in charge.",
    body: "Agents research, draft, and recommend. Approvals, customer messages, and money moves remain with your team.",
  },
];

const SCALE = [
  {
    id: "small",
    label: "NOVA",
    title: "Small businesses",
    body: "A full operating team without hiring one. Owners get daily clarity on cash, customers, and operations — in plain language.",
    meta: "Best for · lean teams and founder-led companies",
  },
  {
    id: "mid",
    label: "NOVA Pro",
    title: "Growing companies",
    body: "Keep departments aligned as you scale. Finance, sales, marketing, and ops share one context — fewer handoffs, faster decisions.",
    meta: "Best for · multi-team companies finding their rhythm",
    featured: true,
  },
  {
    id: "large",
    label: "NOVA Enterprise",
    title: "Large organizations",
    body: "A cross-functional layer on top of existing systems. Surface exceptions, draft plans, and route work — with humans on approvals.",
    meta: "Best for · multi-site and complex operations",
  },
];

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setOn(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`pitch-reveal${on ? " is-in" : ""} ${className}`.trim()}
      style={{ transitionDelay: on ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

export function PitchSite() {
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [heroReady, setHeroReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHeroReady(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 40);
        const hero = heroRef.current;
        const stage = stageRef.current;
        if (!hero || !stage) return;
        const h = hero.offsetHeight || 1;
        const p = Math.min(1, Math.max(0, y / h));
        stage.style.transform = `translate3d(0, ${p * 12}%, 0) scale(${1 + p * 0.04})`;
        stage.style.opacity = String(1 - p * 0.45);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className={`pitch${heroReady ? " is-ready" : ""}`}>
      <nav
        className={`pitch-nav${scrolled ? " is-scrolled" : ""}`}
        aria-label="Primary"
      >
        <Link href="/" className="pitch-nav__mark">
          NOVA
        </Link>
        <div className="pitch-nav__links">
          <a href="#features" className="pitch-nav__link">
            Product
          </a>
          <a href="#team" className="pitch-nav__link">
            Team
          </a>
          <a href="#scale" className="pitch-nav__link">
            Scale
          </a>
        </div>
      </nav>

      <header className="pitch-hero" ref={heroRef}>
        <div className="pitch-hero__stage" ref={stageRef} aria-hidden>
          <div className="pitch-hero__glow" />
          <div className="pitch-hero__desk" />
          <div className="pitch-hero__ring pitch-hero__ring--outer" />
          <div className="pitch-hero__ring pitch-hero__ring--inner" />
          <div className="pitch-hero__object">
            <span className="pitch-hero__pulse" />
            <span className="pitch-hero__pulse pitch-hero__pulse--delay" />
          </div>
          <div className="pitch-hero__float pitch-hero__float--a" />
          <div className="pitch-hero__float pitch-hero__float--b" />
          <div className="pitch-hero__float pitch-hero__float--c" />
        </div>
        <div className="pitch-hero__content">
          <h1 className="pitch-brand pitch-hero-anim" style={{ ["--d" as string]: "0ms" }}>
            NOVA
          </h1>
          <p
            className="pitch-headline pitch-hero-anim"
            style={{ ["--d" as string]: "120ms" }}
          >
            Made for operators. Built for the whole company.
          </p>
          <p
            className="pitch-lede pitch-hero-anim"
            style={{ ["--d" as string]: "220ms" }}
          >
            An AI business team that lifts the simplest question into a considered
            decision — across every size of company.
          </p>
          <div
            className="pitch-ctas pitch-hero-anim"
            style={{ ["--d" as string]: "320ms" }}
          >
            <a href="#what" className="pitch-btn pitch-btn--primary">
              Explore NOVA
            </a>
            <a href="#scale" className="pitch-btn pitch-btn--ghost">
              See who it’s for
            </a>
          </div>
        </div>
        <a href="#what" className="pitch-scroll" aria-label="Scroll to content">
          <span className="pitch-scroll__bar" />
        </a>
      </header>

      <section className="pitch-section pitch-section--cream" id="what">
        <Reveal className="pitch-statement">
          <p className="pitch-kicker">The idea</p>
          <h2 className="pitch-statement__big">
            NOVA isn’t just a chatbot. It’s an operating <em>team</em>.
          </h2>
          <p className="pitch-statement__body">
            Specialists for strategy, finance, sales, marketing, operations, and
            research — working from one shared picture of your business, from the
            first hire to the enterprise floor.
          </p>
        </Reveal>
      </section>

      <section className="pitch-section pitch-section--warm" id="features">
        <Reveal>
          <p className="pitch-kicker">Why it matters</p>
          <h2 className="pitch-section__title">Clarity that compounds.</h2>
          <p className="pitch-section__lede">
            Designed to investigate, explain, and recommend in all the right ways —
            so the work of running a company feels considered again.
          </p>
        </Reveal>
        <div className="pitch-features">
          {FEATURES.map((f, i) => (
            <Reveal key={f.index} className="pitch-feature" delay={i * 90}>
              <div className="pitch-feature__index">{f.index}</div>
              <div>
                <h3 className="pitch-feature__title">{f.title}</h3>
                <p className="pitch-feature__body">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pitch-section pitch-section--cream" id="team">
        <Reveal>
          <p className="pitch-kicker">The team</p>
          <h2 className="pitch-section__title">Six specialists. One system.</h2>
          <p className="pitch-section__lede">
            Each agent has a job. Together they behave like a company that finally
            shares a brain.
          </p>
        </Reveal>
        <div className="pitch-agents">
          {AGENTS.map((agent, i) => (
            <Reveal
              key={agent.id}
              className="pitch-agent"
              delay={i * 70}
            >
              <p className="pitch-agent__name">{agent.name}</p>
              <p className="pitch-agent__role">{agent.role}</p>
              <p className="pitch-agent__desc">
                {AGENT_BLURBS[agent.handle] || agent.description}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pitch-section pitch-section--ink" id="scale">
        <Reveal>
          <p className="pitch-kicker">Choose your own</p>
          <h2 className="pitch-section__title">Small tables to large floors.</h2>
          <p className="pitch-section__lede">
            Same product idea. Different altitude. NOVA scales with how complex your
            business is — not with how many tools your people can juggle.
          </p>
        </Reveal>
        <div className="pitch-scale">
          {SCALE.map((tier, i) => (
            <Reveal
              key={tier.id}
              className={`pitch-scale__item${tier.featured ? " is-featured" : ""}`}
              delay={i * 110}
            >
              <p className="pitch-scale__label">{tier.label}</p>
              <h3 className="pitch-scale__title">{tier.title}</h3>
              <p className="pitch-scale__body">{tier.body}</p>
              <p className="pitch-scale__meta">{tier.meta}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pitch-section pitch-section--cream">
        <Reveal className="pitch-close">
          <p className="pitch-kicker">In short</p>
          <h2 className="pitch-close__title">
            Rise above the noise of fragmented tools.
          </h2>
          <p className="pitch-close__body">
            NOVA gives every size of company a shared operating intelligence —
            practical, accountable, and built for real work.
          </p>
        </Reveal>
      </section>

      <footer className="pitch-footer">
        <span>NOVA</span>
        <span>AI business team · small to enterprise</span>
      </footer>
    </div>
  );
}
