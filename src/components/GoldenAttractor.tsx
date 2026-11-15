"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number; z: number };

/**
 * Live Lorenz attractor (Axiom / Awwwards notes):
 * Canvas API · scroll parallax · mouse interaction · rounds on trails.
 */
export function GoldenAttractor({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let progress = 0;
    let targetMx = 0;
    let targetMy = 0;
    let mx = 0;
    let my = 0;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || window.innerWidth;
      const h = parent?.clientHeight || window.innerHeight;
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
      progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onPointer = (e: PointerEvent) => {
      if (!finePointer || reduceMotion) return;
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      targetMx = (e.clientX / w) * 2 - 1;
      targetMy = (e.clientY / h) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const sigma = 10;
    const rho = 28;
    const beta = 8 / 3;
    const dt = 0.005;

    const trails: Point[][] = [];
    const trailCount = 10;
    for (let t = 0; t < trailCount; t++) {
      const pts: Point[] = [];
      let x = 0.1 + t * 0.032;
      let y = 0.018 * t;
      let z = 0;
      for (let i = 0; i < 260 + t * 85; i++) {
        const dx = sigma * (y - x) * dt;
        const dy = (x * (rho - z) - y) * dt;
        const dz = (x * y - beta * z) * dt;
        x += dx;
        y += dy;
        z += dz;
      }
      for (let i = 0; i < 3200; i++) {
        const dx = sigma * (y - x) * dt;
        const dy = (x * (rho - z) - y) * dt;
        const dz = (x * y - beta * z) * dt;
        x += dx;
        y += dy;
        z += dz;
        pts.push({ x, y, z });
      }
      trails.push(pts);
    }

    const heads = trails.map((pts) => ({ ...pts[pts.length - 1] }));

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const ease = (t: number) => 1 - Math.pow(1 - t, 2.2);

    const project = (p: Point, w: number, h: number) => {
      const t = ease(progress);
      // Scroll settles the field; mouse adds light parallax (Awwwards: mouse + parallax)
      const angle = lerp(0.35, -0.52, t) + mx * 0.22;
      const tilt = lerp(0.38, 0.22, t) + my * 0.06;
      const scale = Math.min(w, h) * lerp(0.048, 0.036, t);
      const ox = w * lerp(0.52, 0.4, t) + mx * w * 0.035;
      const oy = h * lerp(0.42, 0.5, t) + my * h * 0.03;

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const xr = p.x * cos - p.z * sin;
      const zr = p.x * sin + p.z * cos;
      const yr = p.y * 0.95 - (zr - 25) * tilt;
      return {
        x: ox + xr * scale,
        y: oy + yr * scale,
      };
    };

    const draw = () => {
      if (!running) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Smooth mouse follow
      mx += (targetMx - mx) * 0.045;
      my += (targetMy - my) * 0.045;

      const t = ease(progress);
      const gx = w * lerp(0.52, 0.4, t) + mx * w * 0.035;
      const gy = h * lerp(0.42, 0.5, t) + my * h * 0.03;
      const glow = ctx.createRadialGradient(
        gx,
        gy,
        10,
        gx,
        gy,
        Math.min(w, h) * 0.58
      );
      glow.addColorStop(0, `rgba(218, 132, 10, ${lerp(0.32, 0.18, t)})`);
      glow.addColorStop(0.45, "rgba(212, 175, 105, 0.1)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      if (!reduceMotion) {
        for (let i = 0; i < trailCount; i++) {
          const head = heads[i];
          for (let s = 0; s < 4; s++) {
            const dx = sigma * (head.y - head.x) * dt;
            const dy = (head.x * (rho - head.z) - head.y) * dt;
            const dz = (head.x * head.y - beta * head.z) * dt;
            head.x += dx;
            head.y += dy;
            head.z += dz;
            trails[i].push({ x: head.x, y: head.y, z: head.z });
            if (trails[i].length > 3600) trails[i].shift();
          }
        }
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = lerp(1, 0.72, t);
      for (let i = 0; i < trailCount; i++) {
        const pts = trails[i];
        ctx.beginPath();
        for (let j = 0; j < pts.length; j++) {
          const p = project(pts[j], w, h);
          if (j === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        const alpha = 0.35 + (i / trailCount) * 0.5;
        ctx.strokeStyle = `rgba(218, 148, 48, ${alpha})`;
        ctx.lineWidth = i > trailCount - 3 ? 1.25 : 0.65;
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      for (let i = 0; i < trailCount; i++) {
        const p = project(heads[i], w, h);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.1, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 220, 150, 0.95)";
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

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
      className={`axiom-golden-canvas ${className}`}
      aria-hidden
      role="presentation"
    />
  );
}
