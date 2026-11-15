"use client";

import { useEffect } from "react";
import { applyAtmosphere, nextAtmosphere } from "@/lib/atmosphere";
import { resolveInitialTheme } from "@/lib/theme";

declare global {
  interface Window {
    sentryDesktop?: {
      isDesktop?: boolean;
      platform?: string;
      onAtmosphereRotate?: (cb: () => void) => () => void;
    };
  }
}

function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return resolveInitialTheme();
}

let lastRotateAt = 0;

function rotateAtmosphere(force = false) {
  const now = Date.now();
  // Soft-guard React Strict Mode double-mount without blocking Electron re-show.
  if (!force && now - lastRotateAt < 500) return;
  lastRotateAt = now;
  const atm = nextAtmosphere(currentTheme());
  applyAtmosphere(atm);
  flashAtmosphere();
}

function flashAtmosphere() {
  const root = document.documentElement;
  root.classList.remove("atmosphere-shift");
  void root.offsetWidth;
  root.classList.add("atmosphere-shift");
  window.setTimeout(() => root.classList.remove("atmosphere-shift"), 700);
}

/**
 * Picks a fresh warm atmosphere on every open (mount) and whenever
 * Electron re-shows the window after hide/close.
 */
export function AtmosphereRotator() {
  useEffect(() => {
    rotateAtmosphere(false);

    const unsub = window.sentryDesktop?.onAtmosphereRotate?.(() => {
      rotateAtmosphere(true);
    });

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) rotateAtmosphere(true);
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      unsub?.();
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
