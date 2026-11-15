"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";

export function HeroScroll({
  field,
  copy,
}: {
  field: ReactNode;
  copy: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const fieldScale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, reduce ? 1 : 0.72]
  );
  const fieldY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);
  const fieldOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.2]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  return (
    <section ref={ref} className="axiom-hero">
      <motion.div
        className="axiom-hero-field"
        style={{ scale: fieldScale, y: fieldY, opacity: fieldOpacity }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {field}
        </motion.div>
      </motion.div>

      <motion.div className="axiom-hero-copy" style={{ y: copyY, opacity: copyOpacity }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          {copy}
        </motion.div>
      </motion.div>

      <motion.p
        className="axiom-scroll-hint"
        style={{ opacity: hintOpacity }}
        aria-hidden
      >
        SCROLL TO OBSERVE
      </motion.p>
    </section>
  );
}
