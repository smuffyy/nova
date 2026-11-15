"use client";

import { useEffect, useRef } from "react";
import type { GlobeInstance } from "globe.gl";
import type { MeshPhongMaterial } from "three";

const HIGHLIGHT = new Set(["India", "United States of America"]);

const ARCS = [
  {
    startLat: 28.6139,
    startLng: 77.209,
    endLat: 40.7128,
    endLng: -74.006,
  },
  {
    startLat: 19.076,
    startLng: 72.8777,
    endLat: 37.7749,
    endLng: -122.4194,
  },
  {
    startLat: 12.9716,
    startLng: 77.5946,
    endLat: 41.8781,
    endLng: -87.6298,
  },
];

const POINTS = [
  { lat: 28.6139, lng: 77.209, name: "Delhi" },
  { lat: 19.076, lng: 72.8777, name: "Mumbai" },
  { lat: 12.9716, lng: 77.5946, name: "Bengaluru" },
  { lat: 40.7128, lng: -74.006, name: "New York" },
  { lat: 37.7749, lng: -122.4194, name: "San Francisco" },
  { lat: 41.8781, lng: -87.6298, name: "Chicago" },
];

type CountryFeature = {
  properties?: { name?: string };
};

type GoldenGlobeProps = {
  /** "revoltosa" = cream/white on red site; default = dark field. */
  theme?: "default" | "revoltosa";
  /** Mount WebGL only when near viewport (avoids dual-canvas jank). */
  lazy?: boolean;
};

/**
 * Interactive contour globe — India + America highlighted.
 */
export function GoldenGlobe({
  theme = "default",
  lazy = false,
}: GoldenGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const revoltosa = theme === "revoltosa";

  useEffect(() => {
    const el = mountRef.current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return;

    let disposed = false;
    let globe: GlobeInstance | null = null;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let booted = false;

    const boot = async () => {
      if (booted || disposed) return;
      booted = true;

      const [{ default: Globe }, countries] = await Promise.all([
        import("globe.gl"),
        fetch("/data/countries.geojson").then((r) => r.json()),
      ]);
      if (disposed || !mountRef.current) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const hiCap = revoltosa
        ? "rgba(244, 242, 234, 0.95)"
        : "rgba(167, 139, 250, 0.88)";
      const loCap = revoltosa
        ? "rgba(244, 242, 234, 0.12)"
        : "rgba(125, 160, 255, 0.08)";
      const hiSide = revoltosa
        ? "rgba(244, 242, 234, 0.25)"
        : "rgba(244, 114, 182, 0.4)";
      const hiStroke = revoltosa
        ? "rgba(244, 242, 234, 1)"
        : "rgba(224, 231, 255, 1)";
      const loStroke = revoltosa
        ? "rgba(244, 242, 234, 0.35)"
        : "rgba(148, 163, 255, 0.5)";
      const arcColors = revoltosa
        ? (["#f4f2ea", "#a3a3a3"] as [string, string])
        : (["#e9d5ff", "#67e8f9"] as [string, string]);
      const pointCol = revoltosa ? "#f4f2ea" : "#f0abfc";

      const g = new Globe(mountRef.current)
        .backgroundColor("rgba(0,0,0,0)")
        .showGlobe(true)
        .showAtmosphere(false)
        .globeImageUrl("")
        .polygonsData(countries.features)
        .polygonCapColor((d: object) => {
          const name = (d as CountryFeature).properties?.name ?? "";
          return HIGHLIGHT.has(name) ? hiCap : loCap;
        })
        .polygonSideColor((d: object) => {
          const name = (d as CountryFeature).properties?.name ?? "";
          return HIGHLIGHT.has(name) ? hiSide : "rgba(0,0,0,0)";
        })
        .polygonStrokeColor((d: object) => {
          const name = (d as CountryFeature).properties?.name ?? "";
          return HIGHLIGHT.has(name) ? hiStroke : loStroke;
        })
        .polygonAltitude((d: object) => {
          const name = (d as CountryFeature).properties?.name ?? "";
          return HIGHLIGHT.has(name) ? 0.028 : 0.004;
        })
        .polygonsTransitionDuration(0)
        .arcsData(ARCS)
        .arcColor(() => arcColors)
        .arcAltitude(0.34)
        .arcStroke(1.05)
        .arcDashLength(0.4)
        .arcDashGap(0.15)
        .arcDashAnimateTime(reduceMotion ? 0 : 2200)
        .pointsData(POINTS)
        .pointColor(() => pointCol)
        .pointAltitude(0.012)
        .pointRadius(0.55)
        .pointsMerge(false)
        .ringsData(
          reduceMotion
            ? []
            : [
                { lat: 22.5, lng: 79 },
                { lat: 39.8, lng: -98.5 },
              ],
        )
        .ringColor(() =>
          revoltosa
            ? (t: number) => `rgba(244,242,234,${0.75 * (1 - t)})`
            : (t: number) => `rgba(167,139,250,${0.8 * (1 - t)})`,
        )
        .ringMaxRadius(5)
        .ringPropagationSpeed(1.6)
        .ringRepeatPeriod(1400)
        .pointOfView({ lat: 28, lng: 5, altitude: 1.55 }, 0);

      const mat = g.globeMaterial() as MeshPhongMaterial;
      if (mat) {
        if (revoltosa) {
          mat.color.set("#111111");
          mat.emissive.set("#1a1a1a");
          mat.emissiveIntensity = 0.22;
        } else {
          mat.color.set("#0e1018");
          mat.emissive.set("#1a1430");
          mat.emissiveIntensity = 0.32;
        }
        mat.opacity = 0.94;
        mat.transparent = true;
        mat.shininess = 8;
      }

      const controls = g.controls();
      controls.autoRotate = !reduceMotion;
      controls.autoRotateSpeed = 0.45;
      controls.enableZoom = false;

      const size = () => {
        const w = mountRef.current?.clientWidth ?? 640;
        const h = mountRef.current?.clientHeight ?? 640;
        g.width(w);
        g.height(h);
      };
      size();
      ro = new ResizeObserver(size);
      ro.observe(mountRef.current);

      // Pause spin when off-screen
      const vis = new IntersectionObserver(
        ([entry]) => {
          controls.autoRotate = !reduceMotion && !!entry?.isIntersecting;
        },
        { threshold: 0.05 },
      );
      vis.observe(wrap);
      io = vis;

      globe = g;
    };

    if (!lazy) {
      void boot();
    } else {
      const starter = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            starter.disconnect();
            void boot();
          }
        },
        { rootMargin: "200px 0px", threshold: 0.01 },
      );
      starter.observe(wrap);
      io = starter;
    }

    return () => {
      disposed = true;
      ro?.disconnect();
      io?.disconnect();
      try {
        globe?._destructor();
      } catch {
        /* ignore */
      }
      if (el) el.innerHTML = "";
    };
  }, [revoltosa, lazy]);

  return (
    <div
      ref={wrapRef}
      className={`portal-globe${revoltosa ? " portal-globe--revoltosa" : ""}`}
      aria-hidden
    >
      <div ref={mountRef} className="portal-globe-canvas" />
    </div>
  );
}
