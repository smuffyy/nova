"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const DUST_COUNT_DESKTOP = 1200;
const DUST_COUNT_MOBILE = 700;

/**
 * Soft field of floating dots only — no crystal mesh, links, or smoke.
 */
export function CrystalField({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const mobile = () => (wrap.clientWidth || window.innerWidth) < 700;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const w0 = () => wrap.clientWidth || window.innerWidth;
    const h0 = () => wrap.clientHeight || window.innerHeight;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w0(), h0());
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.display = "block";
    renderer.domElement.className = "axiom-crystal-canvas";
    wrap.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w0() / h0(), 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const disc = document.createElement("canvas");
    disc.width = disc.height = 64;
    {
      const ctx = disc.getContext("2d")!;
      const rg = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, "rgba(255,255,255,1)");
      rg.addColorStop(0.45, "rgba(255,255,255,0.95)");
      rg.addColorStop(0.75, "rgba(255,255,255,0.35)");
      rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, 64, 64);
    }
    const discMap = new THREE.CanvasTexture(disc);

    const dustN = mobile() ? DUST_COUNT_MOBILE : DUST_COUNT_DESKTOP;
    const dustPos = new Float32Array(dustN * 3);
    const dustHome = new Float32Array(dustN * 3);
    const dustCol = new Float32Array(dustN * 3);
    const dustPhase = new Float32Array(dustN);
    const ember = new THREE.Color("#f0a46a");
    const mint = new THREE.Color("#5fd4c4");
    const white = new THREE.Color("#ffffff");

    for (let i = 0; i < dustN; i++) {
      const z = 5.4 - Math.pow(Math.random(), 1.25) * 22;
      const spread = 3.2 + (5.4 - z) * 0.55;
      const x = (Math.random() - 0.5) * 2 * spread;
      const y = (Math.random() - 0.5) * 2 * spread;
      dustHome[i * 3] = x;
      dustHome[i * 3 + 1] = y;
      dustHome[i * 3 + 2] = z;
      dustPos[i * 3] = x;
      dustPos[i * 3 + 1] = y;
      dustPos[i * 3 + 2] = z;
      dustPhase[i] = Math.random() * Math.PI * 2;
      const c =
        Math.random() < 0.28 ? ember : Math.random() < 0.55 ? mint : white;
      dustCol[i * 3] = c.r;
      dustCol[i * 3 + 1] = c.g;
      dustCol[i * 3 + 2] = c.b;
    }

    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute("color", new THREE.BufferAttribute(dustCol, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: mobile() ? 0.055 : 0.048,
        map: discMap,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(dust);

    const pointer = { x: 0, y: 0 };
    let pointerEnergy = 0;
    const onPointer = (e: PointerEvent) => {
      if (!finePointer) return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      const dx = nx - pointer.x;
      const dy = ny - pointer.y;
      pointer.x = nx;
      pointer.y = ny;
      pointerEnergy = Math.min(0.8, pointerEnergy + Math.hypot(dx, dy) * 3.2);
    };
    if (finePointer) {
      window.addEventListener("pointermove", onPointer, { passive: true });
    }

    const smoothstep = (a: number, b: number, x: number) => {
      const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    const onResize = () => {
      const w = w0();
      const h = h0();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;
    let camX = 0;
    let camY = 0;

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      pointerEnergy *= 0.96;

      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));

      const wantCamX = Math.sin(progress * Math.PI * 1.2) * 0.55 + pointer.x * 0.35;
      const wantCamY =
        Math.sin(progress * Math.PI) * 0.28 - pointer.y * 0.28;
      const wantCamZ = 6.2 - smoothstep(0, 0.35, progress) * 1.6;
      camX += (wantCamX - camX) * 0.06;
      camY += (wantCamY - camY) * 0.06;
      camera.position.x = camX;
      camera.position.y = camY;
      camera.position.z += (wantCamZ - camera.position.z) * 0.06;
      camera.lookAt(0, 0, 0);

      const energy = pointerEnergy;
      for (let i = 0; i < dustN; i++) {
        const ph = dustPhase[i];
        const amp = 0.08 + energy * 0.12;
        dustPos[i * 3] =
          dustHome[i * 3] +
          Math.sin(t * 0.35 + ph) * amp +
          pointer.x * (0.15 + (dustHome[i * 3 + 2] + 8) * 0.01);
        dustPos[i * 3 + 1] =
          dustHome[i * 3 + 1] +
          Math.cos(t * 0.28 + ph * 1.3) * amp -
          pointer.y * (0.12 + (dustHome[i * 3 + 2] + 8) * 0.008);
        dustPos[i * 3 + 2] =
          dustHome[i * 3 + 2] + Math.sin(t * 0.22 + ph * 0.7) * amp * 0.6;
      }
      dustGeo.attributes.position.needsUpdate = true;

      dust.rotation.y = t * 0.03 + progress * 0.4;
      dust.rotation.x = Math.sin(t * 0.12) * 0.04;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      dustGeo.dispose();
      (dust.material as THREE.Material).dispose();
      discMap.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`axiom-crystal-field ${className}`}
      aria-hidden
    >
      <div className="axiom-crystal-grad" />
      <div className="axiom-crystal-grain" />
    </div>
  );
}
