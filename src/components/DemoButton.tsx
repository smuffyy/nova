"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DemoButton({
  className = "btn btn-primary",
  label = "Try demo workspace",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enterDemo() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Demo unavailable");
      }
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo unavailable");
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <button className={className} onClick={enterDemo} disabled={loading}>
        {loading ? "Opening…" : label}
      </button>
      {error ? <span className="text-sm text-[var(--danger)]">{error}</span> : null}
    </div>
  );
}
