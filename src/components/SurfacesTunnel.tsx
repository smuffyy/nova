"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type WallId = "chat" | "sidekick" | "agents" | "digest";
type Face = "top" | "bottom" | "left" | "right";

type WallDef = {
  id: WallId;
  label: string;
  face: Face;
  intro: string;
  items: { name: string; blurb: string }[];
};

const WALLS: WallDef[] = [
  {
    id: "chat",
    label: "CHAT",
    face: "top",
    intro:
      "INSTITUTIONAL TRUTH, HELD IN ONE PLACE. HOW YOU OPERATE, WHAT MAKES YOU DIFFERENT, AND THE STANDARDS EVERY ANSWER IS MEASURED AGAINST.",
    items: [
      {
        name: "OPERATING STANDARDS",
        blurb:
          "The SOPs, playbooks and methods that only your team knows, written down once and answerable forever.",
      },
      {
        name: "SOURCE GROUNDING",
        blurb:
          "Every claim points back to a document. When there is no source, MOAC says so instead of inventing one.",
      },
      {
        name: "ONBOARDING TRUTH",
        blurb:
          "New hires inherit clarity on day one rather than reconstructing the company from tribal knowledge.",
      },
      {
        name: "CROSS-DOMAIN ASK",
        blurb:
          "Billing, IT, logistics and legal answered from a single memory, with one door into all of it.",
      },
    ],
  },
  {
    id: "sidekick",
    label: "SIDEKICK",
    face: "left",
    intro:
      "A PERSONAL FRIEND INSIDE THE COMPANY. BRING EVERY DOUBT, LEARN ACROSS DOMAINS, AND KEEP A THREAD THAT IS YOURS ALONE.",
    items: [
      {
        name: "PERSONAL MEMORY",
        blurb:
          "What you are learning and working through, kept separate from the shared company record.",
      },
      {
        name: "SCHEDULE & ASK",
        blurb:
          "Day-to-day help that holds context, so the third question does not restart the first one.",
      },
      {
        name: "SIDEKICK MEETS",
        blurb:
          "Two Sidekicks combine context when collaboration is what actually unlocks the work.",
      },
      {
        name: "DOUBT-FRIENDLY",
        blurb:
          "A safe place for the questions that never make it into the wiki or the standup.",
      },
    ],
  },
  {
    id: "agents",
    label: "AGENTS",
    face: "right",
    intro:
      "NAMED SPECIALISTS WITH A JOB, NOT GENERIC PROMPTS. THEY ACT INSIDE YOUR STANDARDS AND PROPOSE — PEOPLE APPROVE ANYTHING THAT WRITES BACK.",
    items: [
      {
        name: "MOONY / BILLING",
        blurb:
          "Invoices, collections and billing standards handled against the rules you already run on.",
      },
      {
        name: "PATH / SHIPPING",
        blurb:
          "Logistics, fulfilment and routing that move goods instead of moving spreadsheets.",
      },
      {
        name: "COMPU / IT",
        blurb:
          "Access, deployment and tooling without the tribal tax of knowing who to ask.",
      },
      {
        name: "LEDGER · QUILL · RELAY",
        blurb:
          "Books kept, standards written, and clean handoffs between teams that rarely speak.",
      },
    ],
  },
  {
    id: "digest",
    label: "DIGEST",
    face: "bottom",
    intro:
      "THE COMPANY, THIS WEEK. NEWS, EMAIL, MEETINGS AND HOW THE WEEK ACTUALLY LANDED — SO NOBODY REBUILDS IT FROM A FLOODED INBOX.",
    items: [
      {
        name: "WEEKLY PULSE",
        blurb:
          "What mattered, ranked by consequence rather than by whoever emailed the loudest.",
      },
      {
        name: "EMAIL & MEETINGS",
        blurb:
          "Summaries that stay linked to the source thread, so you can always drop back into detail.",
      },
      {
        name: "LANDING CHECK",
        blurb:
          "How the week landed for the team, measured instead of assumed.",
      },
      {
        name: "CLOSED LOOP",
        blurb:
          "Chat feeds Sidekick, Sidekick feeds Agents, Agents feed Digest, and the loop starts again.",
      },
    ],
  },
];

/* Tunnel geometry — tuned so the mouth exactly fills a 16:9 frame and the far
   opening reads at ~a third of it, matching the reference proportions. */
const FOV = 48;
const HALF_H = 1;
const ASPECT = 16 / 9;
const HALF_W = HALF_H * ASPECT;
const CAM_Z = HALF_H / Math.tan((FOV / 2) * (Math.PI / 180));
const DEPTH = 4.6;
/* Push the mouth slightly past the camera plane so the walls overfill the frame
   edges instead of leaving hairline gaps. */
const NEAR_OVERSHOOT = 0.25;
const MID_Z = NEAR_OVERSHOOT - DEPTH / 2;

const ROWS_LONG = 4; // top / bottom — rows stack into the depth
const ROWS_SIDE = 6; // left / right — rows stack up the wall

const WALL_WHITE = new THREE.Color("#ffffff");
const WALL_HOT = new THREE.Color("#22c55e");

/** One wall of poster type: rows of `word`, each stretched edge to edge. */
function makeWallTexture(word: string, rows: number, aspect: number) {
  const w = 2048;
  const h = Math.max(256, Math.round(w / aspect));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  const rowH = h / rows;
  const fontPx = Math.round(rowH * 0.94);
  ctx.font = `900 ${fontPx}px "Arial Black", "Helvetica Neue", Impact, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";

  const m = ctx.measureText(word);
  const scaleX = w / (m.width || 1);
  const ascent = m.actualBoundingBoxAscent || fontPx * 0.72;
  const descent = m.actualBoundingBoxDescent || 0;
  const mid = (ascent - descent) / 2;

  for (let r = 0; r < rows; r++) {
    ctx.save();
    ctx.translate(0, r * rowH + rowH / 2 + mid);
    ctx.scale(scaleX, 1);
    ctx.fillText(word, 0, 0);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Surfaces tunnel — a four-walled room of type you look straight into.
 * Walls: CHAT / SIDEKICK / AGENTS / DIGEST. Click one to open it.
 */
export function SurfacesTunnel() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<WallId | null>(null);
  const [hovered, setHovered] = useState<WallId | null>(null);
  const [failed, setFailed] = useState(false);

  const hoveredRef = useRef<WallId | null>(null);
  hoveredRef.current = hovered;

  const activeWall = useMemo(() => WALLS.find((w) => w.id === active) ?? null, [active]);

  const openWall = useCallback((id: WallId) => setActive(id), []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        // The scene is near-static and only redraws while a wall is in view,
        // so the buffer has to survive between frames.
        preserveDrawingBuffer: true,
      });
    } catch {
      setFailed(true);
      return;
    }

    const width = () => stage.clientWidth || 1;
    const height = () => stage.clientHeight || 1;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width(), height());
    renderer.setClearColor(0x000000, 1);
    renderer.domElement.className = "moac-tunnel-canvas";
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, width() / height(), 0.1, 40);
    camera.position.set(0, 0, CAM_Z);

    type WallRig = {
      id: WallId;
      mesh: THREE.Mesh;
      mat: THREE.MeshBasicMaterial;
      tex: THREE.CanvasTexture;
      geo: THREE.PlaneGeometry;
    };

    const rigs: WallRig[] = WALLS.map((wall) => {
      const long = wall.face === "top" || wall.face === "bottom";
      const planeW = long ? HALF_W * 2 : DEPTH;
      const planeH = long ? DEPTH : HALF_H * 2;
      const rows = long ? ROWS_LONG : ROWS_SIDE;

      const tex = makeWallTexture(wall.label, rows, planeW / planeH);
      const geo = new THREE.PlaneGeometry(planeW, planeH);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.FrontSide,
        toneMapped: false,
        color: WALL_WHITE.clone(),
      });
      const mesh = new THREE.Mesh(geo, mat);

      // Each plane is turned so its front face looks into the tunnel; showing a
      // back face would mirror the type.
      if (wall.face === "top") {
        mesh.position.set(0, HALF_H, MID_Z);
        mesh.rotation.x = Math.PI / 2;
      } else if (wall.face === "bottom") {
        mesh.position.set(0, -HALF_H, MID_Z);
        mesh.rotation.x = -Math.PI / 2;
      } else if (wall.face === "left") {
        mesh.position.set(-HALF_W, 0, MID_Z);
        mesh.rotation.y = Math.PI / 2;
      } else {
        mesh.position.set(HALF_W, 0, MID_Z);
        mesh.rotation.y = -Math.PI / 2;
      }

      mesh.userData.wallId = wall.id;
      scene.add(mesh);

      return { id: wall.id, mesh, mat, tex, geo };
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const meshes = rigs.map((r) => r.mesh);

    const pick = (clientX: number, clientY: number): WallId | null => {
      const rect = stage.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      return (hit?.object.userData.wallId as WallId) ?? null;
    };

    const onMove = (e: PointerEvent) => setHovered(pick(e.clientX, e.clientY));
    const onLeave = () => setHovered(null);
    const onDown = (e: PointerEvent) => {
      const id = pick(e.clientX, e.clientY);
      if (id) setActive(id);
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("pointerdown", onDown);

    const onResize = () => {
      camera.aspect = width() / height();
      camera.updateProjectionMatrix();
      renderer.setSize(width(), height());
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let raf = 0;
    let alive = true;
    let onScreen = true;

    const tick = () => {
      if (!alive) return;
      raf = requestAnimationFrame(tick);
      if (!onScreen) return;
      const dt = Math.min(clock.getDelta(), 0.05);

      for (const rig of rigs) {
        const target = hoveredRef.current === rig.id ? WALL_HOT : WALL_WHITE;
        rig.mat.color.lerp(target, reduce ? 1 : 1 - Math.pow(0.001, dt));
      }

      renderer.render(scene, camera);
    };
    tick();

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        clock.getDelta();
      },
      { rootMargin: "20%" },
    );
    observer.observe(stage);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("pointerdown", onDown);
      for (const rig of rigs) {
        scene.remove(rig.mesh);
        rig.geo.dispose();
        rig.mat.dispose();
        rig.tex.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === stage) {
        stage.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section className="moac-tunnel" id="surfaces-tunnel" aria-label="MOAC surfaces">
      <aside className="moac-tunnel-rail">
        <p className="moac-tunnel-rail-label">[ SURFACES ]</p>
        <p className="moac-tunnel-rail-copy">
          The engine of our memory, judgment and execution.
        </p>
        <nav className="moac-tunnel-rail-nav" aria-label="Surfaces">
          {WALLS.map((wall) => (
            <button
              key={wall.id}
              type="button"
              className={active === wall.id ? "is-active" : undefined}
              onClick={() => openWall(wall.id)}
              onPointerEnter={() => setHovered(wall.id)}
              onPointerLeave={() => setHovered(null)}
            >
              {wall.label}
            </button>
          ))}
        </nav>
      </aside>

      <p className="moac-tunnel-edge" aria-hidden>
        CAPABILITIES
      </p>

      <div
        className={`moac-tunnel-stage${hovered ? " is-hot" : ""}`}
        ref={stageRef}
        role="presentation"
      >
        {failed && (
          <ul className="moac-tunnel-fallback">
            {WALLS.map((wall) => (
              <li key={wall.id}>
                <button type="button" onClick={() => openWall(wall.id)}>
                  {wall.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="moac-tunnel-scroll" aria-hidden>
        <span>TAP ON THE WALL AND EXPLORE</span>
        <span className="moac-tunnel-spinner" />
      </p>

      {activeWall && (
          <div className="moac-tunnel-sheet" key={activeWall.id}>
            <div className="moac-tunnel-sheet-head">
              <p className="moac-tunnel-sheet-name">{activeWall.label}</p>
              <button
                type="button"
                className="moac-tunnel-sheet-close"
                onClick={() => setActive(null)}
              >
                CLOSE [ X ]
              </button>
            </div>

            <h3 className="moac-tunnel-sheet-intro">{activeWall.intro}</h3>

            <ul className="moac-tunnel-sheet-grid">
              {activeWall.items.map((item, i) => (
                <li key={item.name} style={{ transitionDelay: `${0.06 * i + 0.08}s` }}>
                  <span className="moac-tunnel-sheet-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h4>{item.name}</h4>
                  <p>{item.blurb}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
    </section>
  );
}
