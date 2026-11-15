"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FixedField } from "@/components/FixedField";
import { GlobeScrollStage } from "@/components/GlobeScrollStage";
import { PortalLogo } from "@/components/PortalLogo";
import { PortalMenuBar } from "@/components/PortalMenuBar";
import { RevealLines } from "@/components/motion/RevealLines";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { BRAND } from "@/brand";

const MANIFESTO = [
  "Chat holds what the company knows",
  "Sidekick holds what you are learning",
  "Agents do the specialist work",
  "Digest shows how the week is landing",
  "Nothing invents what your sources do not say",
];

const SURFACES = [
  {
    id: "surface-chat",
    code: "PT-01",
    title: "Chat",
    body: "Company memory. How you operate, what makes you different, and the standards new hires need — billing, IT deployment, logistics, and the methods only your team knows.",
    viz: "chat",
  },
  {
    id: "sidekick",
    code: "PT-02",
    title: "Sidekick",
    body: "Your personal friend inside the company. Bring every doubt. Learn across domains. Schedule, ask, and — when it helps — let your Sidekick work with someone else’s to shape an idea.",
    viz: "sidekick",
  },
  {
    id: "agents",
    code: "PT-03",
    title: "Agents",
    body: "Specialists with a job. Moony for billing. Path for shipping. Compu for IT. Ledger, Quill, and Relay for books, standards, and handoffs — built for your workflows, not generic prompts.",
    viz: "agents",
  },
  {
    id: "digest",
    code: "PT-04",
    title: "Digest",
    body: "The company, this week. News, email summary, meetings, and how the week is landing — so nobody has to reconstruct the company from a flooded inbox.",
    viz: "digest",
  },
];

const AGENTS = [
  {
    name: "Moony",
    role: "Billing",
    body: "Invoices, collections, and the billing standards your company actually runs on.",
  },
  {
    name: "Path",
    role: "Shipping",
    body: "Logistics, fulfillment, and the routes that keep goods and promises moving.",
  },
  {
    name: "Compu",
    role: "IT",
    body: "Access, deployment, tooling — the systems stack without the tribal knowledge tax.",
  },
  {
    name: "Ledger",
    role: "Books",
    body: "Vendors, payment memory, and finance ops that stay addressable.",
  },
  {
    name: "Quill",
    role: "Standards",
    body: "Draft, refine, and publish operating standards so new hires inherit clarity.",
  },
  {
    name: "Relay",
    role: "Handoffs",
    body: "Cross-team coordination — when Sidekicks combine and work needs a clean pass.",
  },
];

const PRINCIPLES = [
  {
    title: "Grounded answers",
    body: "Every claim points back to a source — or SENTRY refuses. Company facts are never invented.",
  },
  {
    title: "Personal + shared memory",
    body: "Chat is the company. Sidekick is you. They meet when collaboration helps — without collapsing into one blur.",
  },
  {
    title: "Agents inside standards",
    body: "Specialists act within how you operate. They propose; people approve anything that writes back.",
  },
];

/** Frozen snapshot of the live Axiom product site (Chat / Sidekick / Agents / Digest). */
export function TemplateThree() {
  return (
    <main className="axiom-site">
      <FixedField />
      <PortalMenuBar />

      {/* Hero — brand over field */}
      <section className="axiom-hero">
        <div className="axiom-hero-main">
          <RevealLines
            as="h1"
            mode="mount"
            delay={0.15}
            className="axiom-display"
            lines={[BRAND.name]}
          />
          <p className="axiom-hero-tag">
            {BRAND.tagline} — Chat, Sidekick, Agents, and Digest.
          </p>
        </div>
        <p className="axiom-scroll-hint">
          <span className="axiom-scroll-bar" aria-hidden />
          SCROLL DOWN TO DISCOVER MORE
        </p>
      </section>

      {/* About */}
      <section className="axiom-block axiom-block-right axiom-about" id="about">
        <RevealLines
          as="h2"
          className="axiom-h2 axiom-h2-about"
          lines={[
            "We stopped designing",
            "interfaces that explain.",
            "We started creating",
            "environments that can be observed.",
          ]}
        />
      </section>

      {/* Product thesis */}
      <section className="axiom-block axiom-block-split" id="chat">
        <div>
          <RevealLines
            as="h2"
            className="axiom-h2"
            lines={["Four surfaces.", "One company memory."]}
          />
        </div>
        <ScrollReveal delay={0.08}>
          <div className="axiom-prose">
            <p>
              SENTRY is how a company becomes knowable — the watcher over company memory. Chat holds institutional
              truth. Sidekick walks with each person. Agents do the specialist
              work. Digest closes the loop on the week.
            </p>
            <p>
              New hires stop guessing how you operate. Teams stop rebuilding
              standards from chat threads. Everyone still sees the source.
            </p>
            <ul className="axiom-list">
              {MANIFESTO.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: 0.12 + i * 0.06,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {item}
                </motion.li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </section>

      {/* Four surfaces */}
      <section className="axiom-archive" id="surfaces">
        <p className="axiom-kicker axiom-archive-label">PRODUCT SURFACES</p>
        <div className="axiom-archive-track">
          {SURFACES.map((card, i) => (
            <ScrollReveal key={card.code} delay={i * 0.08} y={40}>
              <article className="axiom-card" id={card.id}>
                <div className="axiom-card-visual">
                  <div
                    className={`axiom-usecase-viz axiom-usecase-viz-${card.viz}`}
                    aria-hidden
                  />
                </div>
                <div className="axiom-card-body">
                  <span className="axiom-card-meta">{card.code}</span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Named agents */}
      <section className="axiom-block axiom-agents-section">
        <div className="axiom-agents-head">
          <p className="axiom-kicker">NAMED AGENTS</p>
          <RevealLines
            as="h2"
            className="axiom-h2 axiom-h2-sm"
            lines={["Specialists with a job.", "Not generic prompts."]}
          />
        </div>
        <div className="axiom-agents-grid">
          {AGENTS.map((agent, i) => (
            <ScrollReveal key={agent.name} delay={0.06 + i * 0.05} y={24}>
              <article className="axiom-agent">
                <p className="axiom-agent-role">{agent.role}</p>
                <h3>{agent.name}</h3>
                <p>{agent.body}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="axiom-block axiom-conditions-section" id="conditions">
        <div className="axiom-conditions-head">
          <RevealLines
            as="h2"
            className="axiom-h2 axiom-h2-sm"
            lines={[
              "It holds together",
              "when memory stays honest.",
            ]}
          />
        </div>
        <div className="axiom-conditions">
          {PRINCIPLES.map((c, i) => (
            <ScrollReveal key={c.title} delay={0.08 + i * 0.1} y={28}>
              <article className="axiom-condition">
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Encounter */}
      <section className="axiom-block axiom-block-wide axiom-encounter">
        <RevealLines
          as="h2"
          className="axiom-h2 axiom-h2-sm"
          lines={[
            "Sidekicks meet. Agents combine.",
            "Digest closes the loop.",
          ]}
        />
      </section>

      <GlobeScrollStage />

      <footer className="axiom-footer">
        <div className="axiom-brand axiom-brand-sm">
          <PortalLogo size={22} animated={false} />
          <span>{BRAND.name}</span>
        </div>
        <p>© {new Date().getFullYear()} {BRAND.nameUpper}. All rights reserved.</p>
        <Link href="/templates">← TEMPLATES</Link>
      </footer>
    </main>
  );
}
