"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { BRAND } from "@/brand";
import { DemoButton } from "@/components/DemoButton";
import { GoldenGlobe } from "@/components/GoldenGlobe";
import { RevealLines } from "@/components/motion/RevealLines";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { WaitlistForm } from "@/components/WaitlistForm";

/**
 * Page 1 (geography): copy on the right, globe on the right.
 * Page 2 (contact / last): same globe slides left (same size), all copy on the right.
 */
export function GlobeScrollStage({
  theme = "default",
}: {
  theme?: "default" | "revoltosa";
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end end"],
  });

  // Same size throughout: park on the right for geography, slide left for contact
  const rightPark = "calc(100% - min(680px, 48vw) - 1.5rem)";
  const leftPark = "1.25rem";
  const globeLeft = useTransform(
    scrollYProgress,
    [0, 0.38, 0.68, 1],
    reduce
      ? [rightPark, rightPark, rightPark, rightPark]
      : [rightPark, rightPark, leftPark, leftPark],
  );

  return (
    <div
      ref={stageRef}
      className={`portal-finale${theme === "revoltosa" ? " portal-finale--revoltosa" : ""}`}
    >
      <motion.div
        className="portal-finale-globe"
        style={{ left: globeLeft }}
        aria-hidden
      >
        <GoldenGlobe theme={theme} />
      </motion.div>

      {/* Second-last: geography — text on the right */}
      <section
        id="geography"
        className="portal-globe-section"
        aria-label="Global observation field"
      >
        <div className="portal-globe-head">
          <p className="portal-globe-kicker">FIELD / GEOGRAPHY</p>
          <h2 className="portal-globe-title">
            Grounded across India and America.
          </h2>
          <p className="portal-globe-sub">
            Contours of the company knowledge field — two shores, one record.
          </p>
        </div>
      </section>

      {/* Last: contact — globe left, everything else on the right */}
      <section
        className="axiom-block axiom-contact portal-finale-contact"
        id="contact"
      >
        <ScrollReveal>
          <p className="portal-finale-lede">
            Chat for the company. Sidekick for you.
            <br />
            Agents for the craft. Digest for the week.
          </p>
        </ScrollReveal>
        <RevealLines
          as="h2"
          className="axiom-display axiom-display-sm"
          lines={[BRAND.name]}
        />
        <ScrollReveal delay={0.1}>
          <p className="axiom-prose-inline">
            {BRAND.nameUpper} is not publicly open. Pilots are selective. Bring a books
            export and a few SOPs — get useful answers in the first session.
          </p>
          <p className="axiom-contact-ask">
            If you want access when a seat opens:
          </p>
          <div className="axiom-contact-form">
            <WaitlistForm variant="axiom" />
          </div>
          <div className="axiom-contact-demo">
            <DemoButton
              className="axiom-demo-link"
              label="Open demo workspace →"
            />
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
