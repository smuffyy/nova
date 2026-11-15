"use client";

import { motion, useReducedMotion } from "framer-motion";

type AgentIconProps = {
  name: string;
  className?: string;
};

/**
 * Technical line icons for each named agent — matches Sentry’s cool, sparse chrome.
 */
export function AgentIcon({ name, className = "" }: AgentIconProps) {
  const reduce = useReducedMotion();
  const key = name.toLowerCase();

  return (
    <motion.div
      className={`agent-icon ${className}`}
      aria-hidden
      animate={
        reduce
          ? undefined
          : {
              y: [0, -4, 0],
            }
      }
      transition={
        reduce
          ? undefined
          : {
              duration: 3.8 + (key.length % 3) * 0.25,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
    >
      <svg
        viewBox="0 0 96 96"
        className="agent-icon-svg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {key === "moony" && <BillingIcon />}
        {key === "path" && <ShippingIcon />}
        {key === "compu" && <ItIcon />}
        {key === "ledger" && <BooksIcon />}
        {key === "quill" && <StandardsIcon />}
        {key === "relay" && <HandoffsIcon />}
      </svg>
    </motion.div>
  );
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function BillingIcon() {
  return (
    <g {...stroke}>
      <rect x="28" y="18" width="40" height="60" rx="4" />
      <path d="M38 32h20M38 42h20M38 52h12" />
      <circle cx="58" cy="64" r="5" />
      <path d="M58 61.5v5M56 64h4" />
    </g>
  );
}

function ShippingIcon() {
  return (
    <g {...stroke}>
      <path d="M18 58h28l10-18H28z" />
      <path d="M46 58l12-18 16 6-10 18z" />
      <path d="M22 40l6-12h20l6 12" />
      <circle cx="30" cy="68" r="5" />
      <circle cx="62" cy="68" r="5" />
      <path d="M72 28c8 4 12 14 8 24" />
      <path d="M74 24l6 6-6 2" />
    </g>
  );
}

function ItIcon() {
  return (
    <g {...stroke}>
      <rect x="22" y="26" width="52" height="36" rx="4" />
      <path d="M38 72h20M48 62v10" />
      <path d="M34 40h8M44 40h8M54 40h8" />
      <path d="M34 48h28" />
      <circle cx="70" cy="22" r="4" />
      <path d="M70 18v-6M74 22h6M70 26v6M66 22h-6" />
    </g>
  );
}

function BooksIcon() {
  return (
    <g {...stroke}>
      <path d="M24 22h20v54H28a4 4 0 0 1-4-4V22z" />
      <path d="M44 22h28v50a4 4 0 0 1-4 4H44V22z" />
      <path d="M44 22v54" />
      <path d="M52 34h14M52 44h14M52 54h10" />
    </g>
  );
}

function StandardsIcon() {
  return (
    <g {...stroke}>
      <path d="M30 20h28l12 12v46a4 4 0 0 1-4 4H30a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4z" />
      <path d="M58 20v12h12" />
      <path d="M36 44l6 6 12-14" />
      <path d="M36 62h24M36 72h16" />
    </g>
  );
}

function HandoffsIcon() {
  return (
    <g {...stroke}>
      <circle cx="28" cy="36" r="10" />
      <circle cx="68" cy="60" r="10" />
      <path d="M36 42l24 12" />
      <path d="M42 30h22c6 0 10 4 10 10v4" />
      <path d="M68 40l6 4-6 4" />
      <path d="M54 66H32c-6 0-10-4-10-10v-4" />
      <path d="M28 56l-6-4 6-4" />
    </g>
  );
}
