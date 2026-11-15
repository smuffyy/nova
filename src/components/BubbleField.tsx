"use client";

import { useEffect, useRef } from "react";

type Bubble = {
  x: number;
  y: number;
  z: number;
  r: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  sat: number;
  light: number;
  twinkle: number;
};

const PALETTE = [
  { h: 280, s: 70, l: 62 }, // violet
  { h: 310, s: 75, l: 58 }, // magenta
  { h: 195, s: 80, l: 60 }, // cyan
  { h: 165, s: 65, l: 55 }, // seafoam
  { h: 255, s: 70, l: 68 }, // indigo
  { h: 330, s: 70, l: 62 }, // pink
];

/**
 * Active Theory–inspired iridescent bubble / particle field.
 * Replaces the old golden attractor across the site.
 */
export function BubbleField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let targetProgress = 0;
    let progress = 0;
    let targetMx = 0;
    let targetMy = 0;
    let mx = 0;
    let my = 0;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const parent = canvas.parentElement;
      w = parent?.clientWidth || window.innerWidth;
      h = parent?.clientHeight || window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      targetProgress =
        max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onPointer = (e: PointerEvent) => {
      if (!finePointer || reduceMotion) return;
      targetMx = (e.clientX / (w || 1)) * 2 - 1;
      targetMy = (e.clientY / (h || 1)) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const count = reduceMotion ? 140 : Math.min(420, Math.floor((w * h) / 4200));
    const bubbles: Bubble[] = [];

    const spawn = (biasLeft = false): Bubble => {
      const pal = PALETTE[(Math.random() * PALETTE.length) | 0];
      const leftCluster = biasLeft || Math.random() < 0.55;
      return {
        x: leftCluster
          ? w * (0.05 + Math.random() * 0.42)
          : w * (0.35 + Math.random() * 0.6),
        y: h * (0.08 + Math.random() * 0.84),
        z: Math.random(),
        r: 0.6 + Math.random() * (leftCluster ? 2.8 : 1.8),
        vx: (0.15 + Math.random() * 0.55) * (0.7 + Math.random() * 0.6),
        vy: (Math.random() - 0.5) * 0.35,
        life: Math.random() * 1,
        maxLife: 0.55 + Math.random() * 1.4,
        hue: pal.h + (Math.random() - 0.5) * 18,
        sat: pal.s,
        light: pal.l + (Math.random() - 0.5) * 10,
        twinkle: Math.random() * Math.PI * 2,
      };
    };

    for (let i = 0; i < count; i++) bubbles.push(spawn(i < count * 0.55));

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const frame = () => {
      if (!running) return;
      progress = lerp(progress, targetProgress, 0.04);
      mx = lerp(mx, targetMx, 0.05);
      my = lerp(my, targetMy, 0.05);

      // Dark trail fade for motion haze
      ctx.fillStyle = "rgba(8, 8, 12, 0.22)";
      ctx.fillRect(0, 0, w, h);

      const drift = progress * 40;
      const pullX = mx * 28;
      const pullY = my * 18;

      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        if (!reduceMotion) {
          b.x += b.vx * (0.7 + b.z);
          b.y += b.vy + Math.sin(b.twinkle + b.life * 4) * 0.08;
          b.life += 0.0045;
          b.twinkle += 0.02 + b.z * 0.02;

          // Soft curl — denser “tine” flow on the left, shedding right
          const nx = b.x / w - 0.35;
          const ny = b.y / h - 0.5;
          b.vx += -ny * 0.012;
          b.vy += nx * 0.008;
          b.vx *= 0.995;
          b.vy *= 0.995;

          if (b.life > b.maxLife || b.x > w + 20 || b.y < -20 || b.y > h + 20) {
            bubbles[i] = spawn(true);
            bubbles[i].x = -8 - Math.random() * 40;
            continue;
          }
        }

        const px = b.x + pullX * (0.3 + b.z * 0.7) - drift * b.z;
        const py = b.y + pullY * (0.25 + b.z * 0.5);
        const fade = Math.sin((b.life / b.maxLife) * Math.PI);
        const alpha = (0.15 + b.z * 0.55) * fade;
        const radius = b.r * (0.7 + b.z * 1.1);

        const g = ctx.createRadialGradient(px, py, 0, px, py, radius * 3.2);
        g.addColorStop(
          0,
          `hsla(${b.hue}, ${b.sat}%, ${Math.min(88, b.light + 18)}%, ${alpha})`,
        );
        g.addColorStop(
          0.35,
          `hsla(${b.hue}, ${b.sat}%, ${b.light}%, ${alpha * 0.55})`,
        );
        g.addColorStop(1, `hsla(${b.hue}, ${b.sat}%, ${b.light}%, 0)`);

        ctx.beginPath();
        ctx.fillStyle = g;
        ctx.arc(px, py, radius * 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `hsla(${b.hue}, ${Math.min(90, b.sat + 8)}%, ${Math.min(90, b.light + 22)}%, ${alpha * 0.85})`;
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    };

    // seed opaque black once
    ctx.fillStyle = "#08080c";
    ctx.fillRect(0, 0, w, h);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`axiom-bubble-canvas ${className}`}
      aria-hidden
    />
  );
}
