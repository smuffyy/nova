"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed world behind the whole site.
 *
 * Scroll position drives a single `--sky-p` (0 at the hero, 1 at the footer).
 * Every layer reads that value, so the page reads as one continuous place that
 * travels from an emerald dusk horizon out into deep space, rather than a set
 * of separately styled sections.
 */
export function SkyField() {
  const rootRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const span = doc.scrollHeight - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
      root.style.setProperty("--sky-p", p.toFixed(4));
      root.style.setProperty("--sky-drift", `${(-p * 140).toFixed(1)}px`);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const canvas = starsRef.current;
    if (!canvas) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const count = Math.round((w * h) / 5200);
      for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const bright = Math.random();
        const r = bright > 0.94 ? Math.random() * 1.3 + 1 : Math.random() * 0.85 + 0.28;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.22 + Math.random() * 0.7})`;
        ctx.fill();
      }
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);

  return (
    <div className="moac-sky" ref={rootRef} aria-hidden>
      <div className="moac-sky-dusk" />
      <div className="moac-sky-space" />
      <div className="moac-sky-beams" />
      <canvas className="moac-sky-stars" ref={starsRef} />
      <div className="moac-sky-ground" />
      <div className="moac-sky-scrim" />
      <div className="moac-sky-vignette" />
    </div>
  );
}
