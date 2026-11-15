"use client";

import { useEffect, useState } from "react";

/** Live clock in Axiom header style (local tz label). */
export function AxiomClock() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const parts = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      }).formatToParts(d);
      const hour = parts.find((p) => p.type === "hour")?.value ?? "";
      const minute = parts.find((p) => p.type === "minute")?.value ?? "";
      const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value ?? "";
      const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
      setLabel(`${tz} ${hour}:${minute} ${dayPeriod}`.toUpperCase());
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return <span className="axiom-clock">{label || "—"}</span>;
}
