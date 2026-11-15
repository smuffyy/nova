"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type RevealLinesProps = {
  lines: ReactNode[];
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  lineClassName?: string;
  delay?: number;
  /** Use mount animation instead of scroll (hero above the fold) */
  mode?: "scroll" | "mount";
};

/** Axiom-style line reveals: each line rises from below a clip mask */
export function RevealLines({
  lines,
  as = "h2",
  className,
  lineClassName,
  delay = 0,
  mode = "scroll",
}: RevealLinesProps) {
  const Tag = as;

  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i} className="axiom-reveal-line">
          <motion.span
            className={lineClassName ?? "axiom-reveal-line-inner"}
            initial={{ y: "110%", opacity: 0 }}
            {...(mode === "mount"
              ? { animate: { y: "0%", opacity: 1 } }
              : {
                  whileInView: { y: "0%", opacity: 1 },
                  viewport: { once: true, amount: 0.35 },
                })}
            transition={{
              duration: 0.95,
              delay: delay + i * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
