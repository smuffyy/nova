"use client";

import { BRAND } from "@/brand";

type PortalLogoProps = {
  size?: number;
  className?: string;
  /** Kept for API compat. */
  animated?: boolean;
};

/**
 * Sentry mark — brand asset provided by the team.
 */
export function PortalLogo({
  size = 220,
  className = "",
}: PortalLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/portal-mark-transparent.png"
      width={size}
      height={size}
      alt={BRAND.nameUpper}
      className={className}
      draggable={false}
      style={{ display: "block", objectFit: "contain", flexShrink: 0 }}
    />
  );
}
