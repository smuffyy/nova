"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type NeuralWatcherProps = {
  className?: string;
  tone?: "dark" | "light";
};

/**
 * AI neural lattice — cool violet/cyan field piece for the conditions left rail.
 * Same observation-lab language as the globe / bubble field.
 */
export function NeuralWatcher({
  className = "",
  tone = "dark",
}: NeuralWatcherProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const light = tone === "light";

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.15, 5.4);

    const root = new THREE.Group();
    scene.add(root);

    const wireColor = light ? 0x5b21b6 : 0xa78bfa;
    const nodeColor = light ? 0x4c1d95 : 0xe9d5ff;
    const signalColor = light ? 0x0891b2 : 0x67e8f9;
    const dustColor = light ? 0xdb2777 : 0xf472b6;
    const coreOpacity = light ? 0.35 : 0.22;
    const edgeOpacity = light ? 0.4 : 0.28;

    // Core icosahedron wire — “model” shell
    const coreGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: wireColor,
      wireframe: true,
      transparent: true,
      opacity: coreOpacity,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    root.add(core);

    // Inner solid glow shell
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.72, 2),
      new THREE.MeshBasicMaterial({
        color: signalColor,
        transparent: true,
        opacity: light ? 0.14 : 0.08,
        wireframe: true,
      }),
    );
    root.add(shell);

    // Neural nodes on a sphere
    const NODE_COUNT = 48;
    const nodes: THREE.Vector3[] = [];
    const nodePositions = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 1.55 + Math.random() * 0.55;
      const p = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      );
      nodes.push(p);
      nodePositions[i * 3] = p.x;
      nodePositions[i * 3 + 1] = p.y;
      nodePositions[i * 3 + 2] = p.z;
    }

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
    const nodeMat = new THREE.PointsMaterial({
      color: nodeColor,
      size: 0.055,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const nodePoints = new THREE.Points(nodeGeo, nodeMat);
    root.add(nodePoints);

    // Edges between nearby nodes
    const edgePositions: number[] = [];
    const MAX_DIST = 1.55;
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (nodes[i].distanceTo(nodes[j]) < MAX_DIST) {
          edgePositions.push(
            nodes[i].x,
            nodes[i].y,
            nodes[i].z,
            nodes[j].x,
            nodes[j].y,
            nodes[j].z,
          );
        }
      }
    }
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(edgePositions, 3),
    );
    const edgeMat = new THREE.LineBasicMaterial({
      color: wireColor,
      transparent: true,
      opacity: edgeOpacity,
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    root.add(edges);

    // Traveling signal particles along random edges
    const SIGNAL_COUNT = 18;
    const signals = new Float32Array(SIGNAL_COUNT * 3);
    const signalMeta = Array.from({ length: SIGNAL_COUNT }, () => {
      let a = 0;
      let b = 1;
      // pick a connected pair
      for (let tries = 0; tries < 40; tries++) {
        a = Math.floor(Math.random() * NODE_COUNT);
        b = Math.floor(Math.random() * NODE_COUNT);
        if (a !== b && nodes[a].distanceTo(nodes[b]) < MAX_DIST) break;
      }
      return {
        a,
        b,
        t: Math.random(),
        speed: 0.18 + Math.random() * 0.35,
      };
    });
    const signalGeo = new THREE.BufferGeometry();
    signalGeo.setAttribute("position", new THREE.BufferAttribute(signals, 3));
    const signalMat = new THREE.PointsMaterial({
      color: signalColor,
      size: 0.08,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    const signalPoints = new THREE.Points(signalGeo, signalMat);
    root.add(signalPoints);

    // Ambient orbit dust
    const DUST = 120;
    const dustPos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      const r = 2.4 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dustPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      dustPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: dustColor,
        size: 0.02,
        transparent: true,
        opacity: light ? 0.55 : 0.45,
        depthWrite: false,
      }),
    );
    root.add(dust);

    const lightPt = new THREE.PointLight(wireColor, light ? 0.8 : 1.2, 20);
    lightPt.position.set(2, 2, 4);
    scene.add(lightPt);
    scene.add(new THREE.AmbientLight(light ? 0x99aabb : 0x6688aa, 0.35));

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const t = clock.getElapsedTime();

      if (!reduce) {
        root.rotation.y = t * 0.18;
        root.rotation.x = Math.sin(t * 0.22) * 0.12;
        core.rotation.y = -t * 0.12;
        shell.rotation.x = t * 0.25;
        shell.rotation.z = t * 0.1;
        dust.rotation.y = t * 0.05;

        // pulse opacities
        coreMat.opacity =
          (light ? 0.3 : 0.18) + Math.sin(t * 1.4) * (light ? 0.08 : 0.06);
        (shell.material as THREE.MeshBasicMaterial).opacity =
          (light ? 0.1 : 0.06) + Math.sin(t * 2.1) * 0.03;

        const pos = signalGeo.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i < SIGNAL_COUNT; i++) {
          const s = signalMeta[i];
          s.t += s.speed * 0.016;
          if (s.t > 1) {
            s.t = 0;
            s.a = Math.floor(Math.random() * NODE_COUNT);
            let b = Math.floor(Math.random() * NODE_COUNT);
            for (let k = 0; k < 20 && (b === s.a || nodes[s.a].distanceTo(nodes[b]) >= MAX_DIST); k++) {
              b = Math.floor(Math.random() * NODE_COUNT);
            }
            s.b = b;
          }
          const from = nodes[s.a];
          const to = nodes[s.b];
          pos.setXYZ(
            i,
            from.x + (to.x - from.x) * s.t,
            from.y + (to.y - from.y) * s.t,
            from.z + (to.z - from.z) * s.t,
          );
        }
        pos.needsUpdate = true;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      coreGeo.dispose();
      coreMat.dispose();
      shell.geometry.dispose();
      (shell.material as THREE.Material).dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      edgeGeo.dispose();
      edgeMat.dispose();
      signalGeo.dispose();
      signalMat.dispose();
      dustGeo.dispose();
      (dust.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === el) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [tone]);

  return (
    <div
      className={`neural-watcher neural-watcher--${tone} ${className}`.trim()}
      aria-hidden
    >
      <div className="neural-watcher-glow" />
      <div ref={mountRef} className="neural-watcher-canvas" />
    </div>
  );
}
