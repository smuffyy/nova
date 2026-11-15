"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
} from "framer-motion";
/** Quiet field level on Agents + geography / contact. */
const HUSHED_FIELD = 0.35;

type FixedFieldProps = {
  /** When this selector’s stage is pinned, hush the field. */
  fullBlurSelector?: string;
};

/**
 * Fixed black stage behind the site content.
 */
export function FixedField({ fullBlurSelector }: FixedFieldProps) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const [hushed, setHushed] = useState(false);

  useEffect(() => {
    if (!fullBlurSelector || reduce) {
      setHushed(false);
      return;
    }

    const el = document.querySelector(fullBlurSelector);
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const pinned = rect.top <= vh * 0.35 && rect.bottom >= vh * 0.65;
      setHushed(pinned);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [fullBlurSelector, reduce]);

  const fieldOpacity = useTransform(
    scrollYProgress,
    [0, 0.7, 0.82, 1],
    reduce ? [1, 1, 1, 1] : [1, 0.95, HUSHED_FIELD, HUSHED_FIELD],
  );

  const hushAmt = useMotionValue(0);
  const hushSpring = useSpring(hushAmt, { stiffness: 160, damping: 28 });

  useEffect(() => {
    hushAmt.set(hushed ? 1 : 0);
  }, [hushed, hushAmt]);

  const composedField = useTransform(
    [fieldOpacity, hushSpring],
    ([base, hush]) => {
      const b = base as number;
      const h = hush as number;
      return b * (1 - h) + HUSHED_FIELD * h;
    },
  );

  return (
    <div
      className={`axiom-fixed-field${hushed ? " is-fully-blurred" : ""}`}
      aria-hidden
    >
      <motion.div
        className="axiom-fixed-field-inner"
        style={{ opacity: composedField }}
      >
        <div className="axiom-stage-field" />
      </motion.div>
    </div>
  );
}
