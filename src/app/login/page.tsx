"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AtmosphereRotator } from "@/components/AtmosphereRotator";
import { DemoButton } from "@/components/DemoButton";
import { PortalLogo } from "@/components/PortalLogo";
import { BRAND } from "@/brand";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@portal.local");
  const [password, setPassword] = useState("portal-demo");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <main className="auth-atmosphere flex min-h-screen items-center justify-center px-6 py-16">
      <AtmosphereRotator />
      <div className="panel auth-atmosphere__card w-full max-w-md p-8">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <PortalLogo size={40} animated />
          <span className="tracking-[0.28em] font-medium">{BRAND.nameUpper}</span>
        </Link>
        <h1 className="text-3xl font-medium tracking-wide">Sign in</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Demo credentials are prefilled after seeding.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-[var(--muted)]">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-[var(--muted)]">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="mt-6 border-t border-[var(--line)] pt-6">
          <DemoButton className="btn btn-ghost w-full" label="Enter demo workspace" />
        </div>
      </div>
    </main>
  );
}
