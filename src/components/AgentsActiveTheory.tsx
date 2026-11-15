"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { PortalAgent } from "@/templates/portalProductData";
import { AgentIcon } from "@/components/AgentIcon";

type AgentsActiveTheoryProps = {
  agents: readonly PortalAgent[];
};

/** Wide orbit + angular step — neighbors sit far out like Active Theory work. */
const RADIUS = 860;
const ANGLE_STEP = 1.15; // ~66° — air between plates

/**
 * Active Theory work carousel:
 * wide horizontal orbit, spring-smoothed scroll, plates face you one at a time.
 */
export function AgentsActiveTheory({ agents }: AgentsActiveTheoryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const total = agents.length;

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  // Butter the scroll → rotation (this is what makes AT feel smooth)
  const smooth = useSpring(scrollYProgress, {
    stiffness: 48,
    damping: 22,
    mass: 0.55,
    restDelta: 0.0005,
  });

  const activeLabel = useTransform(smooth, (p) => {
    const i = Math.min(
      total - 1,
      Math.max(0, Math.round(p * Math.max(total - 1, 1))),
    );
    return agents[i]?.name ?? "";
  });

  const counter = useTransform(smooth, (p) => {
    const i = Math.round(p * Math.max(total - 1, 1));
    return String(i + 1).padStart(2, "0");
  });

  return (
    <section
      ref={trackRef}
      id="agents"
      className="at-agents"
      aria-label="Named agents"
      style={{ height: `${Math.max(total, 1) * 120}vh` }}
    >
      <div className="at-agents-sticky">
        <div className="at-agents-chrome">
          <p className="axiom-kicker">NAMED AGENTS</p>
          <p className="at-agents-live" aria-live="polite">
            <motion.span>{activeLabel}</motion.span>
          </p>
          <p className="at-agents-counter" aria-hidden>
            <motion.span>{counter}</motion.span>
            <span> / {String(total).padStart(2, "0")}</span>
          </p>
        </div>

        <div className="at-agents-world">
          <div className="at-agents-atmosphere" aria-hidden>
            <span className="at-agents-bokeh at-agents-bokeh-a" />
            <span className="at-agents-bokeh at-agents-bokeh-b" />
            <span className="at-agents-bokeh at-agents-bokeh-c" />
            <span className="at-agents-bokeh at-agents-bokeh-d" />
            <span className="at-agents-bokeh at-agents-bokeh-e" />
            <span className="at-agents-bokeh at-agents-bokeh-f" />
          </div>

          <div className="at-agents-spine" aria-hidden>
            <span className="at-agents-spine-bloom" />
            <span className="at-agents-spine-core" />
          </div>

          <div className="at-agents-deck">
            {agents.map((agent, i) => (
              <GlassCard
                key={agent.name}
                agent={agent}
                index={i}
                total={total}
                progress={reduce ? scrollYProgress : smooth}
                reduce={!!reduce}
              />
            ))}
          </div>
        </div>

        <p className="at-agents-hint">SCROLL TO ADVANCE</p>
      </div>
    </section>
  );
}

function GlassCard({
  agent,
  index,
  total,
  progress,
  reduce,
}: {
  agent: PortalAgent;
  index: number;
  total: number;
  progress: MotionValue<number>;
  reduce: boolean;
}) {
  const angle = useTransform(progress, (p) => {
    if (reduce) return (index - 0) * ANGLE_STEP;
    const active = p * Math.max(total - 1, 1);
    return (index - active) * ANGLE_STEP;
  });

  const x = useTransform(angle, (a) => {
    if (reduce) return (index - 0) * 80;
    // Opposite horizontal orbit from the original
    return Math.sin(a) * -RADIUS;
  });

  const z = useTransform(angle, (a) => {
    if (reduce) return index === 0 ? 200 : -280;
    return Math.cos(a) * RADIUS - RADIUS * 0.55;
  });

  const y = useTransform(angle, (a) => {
    if (reduce) return 0;
    // Top → bottom: enter from above, leave downward (and L/R orbit flipped via -RADIUS)
    return Math.sin(a) * -90;
  });

  const rotateY = useTransform(angle, (a) => {
    if (reduce) return 0;
    return (-a * 180) / Math.PI;
  });

  const rotateX = useTransform(angle, (a) => {
    if (reduce) return 0;
    return Math.sin(a) * 5;
  });

  const scale = useTransform(angle, (a) => {
    if (reduce) return index === 0 ? 1 : 0.86;
    const facing = Math.cos(a);
    return 0.74 + Math.max(0, facing) * 0.32;
  });

  const opacity = useTransform(angle, (a) => {
    if (reduce) return index === 0 ? 1 : 0.3;
    const abs = Math.abs(a);
    // Only the front + immediate wide neighbors stay visible
    if (abs < ANGLE_STEP * 0.55) return 1;
    if (abs < ANGLE_STEP * 1.35) return 0.55;
    if (abs < ANGLE_STEP * 2.1) return 0.15;
    return 0;
  });

  const filter = useTransform(angle, (a) => {
    if (reduce) return "blur(0px)";
    const facing = Math.cos(a);
    const blur = facing > 0.72 ? 0 : Math.min(18, (0.72 - facing) * 16);
    return `blur(${blur}px)`;
  });

  const zIndex = useTransform(angle, (a) => Math.round(200 + Math.cos(a) * 120));

  return (
    <motion.article
      className="at-agents-card"
      style={{
        x,
        y,
        z,
        rotateY,
        rotateX,
        scale,
        opacity,
        filter,
        zIndex,
      }}
    >
      <div className="at-agents-glass">
        <div className="at-agents-glass-shine" aria-hidden />
        <div className="at-agents-glass-viz" aria-hidden>
          <span
            className={`at-agents-viz at-agents-viz-${agent.role.toLowerCase()}`}
          />
          <AgentIcon name={agent.name} className="at-agents-mascot" />
        </div>
        <div className="at-agents-glass-copy">
          <p className="at-agents-card-role">{agent.role}</p>
          <h3>{agent.name}</h3>
          <p className="at-agents-card-body">{agent.body}</p>
        </div>
        <span className="at-agents-card-index" aria-hidden>
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
    </motion.article>
  );
}
