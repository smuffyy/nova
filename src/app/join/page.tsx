"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PortalLogo } from "@/components/PortalLogo";
import { BRAND } from "@/brand";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not join");
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label className="mb-2 block text-sm text-[var(--muted)]">
          Invite code
        </label>
        <input
          className="input font-mono uppercase tracking-wider"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          autoComplete="off"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm text-[var(--muted)]">Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
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
        <label className="mb-2 block text-sm text-[var(--muted)]">
          Password
        </label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <p className="mt-1 text-xs text-[var(--muted)]">
          Existing accounts: use your current password to join this workspace.
        </p>
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Joining…" : "Join workspace"}
      </button>
    </form>
  );
}

export default function JoinPage() {
  return (
    <main className="portal-grid flex min-h-screen items-center justify-center px-6 py-16">
      <div className="panel w-full max-w-md p-8">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <PortalLogo size={40} animated />
          <span className="tracking-[0.28em] font-medium">{BRAND.nameUpper}</span>
        </Link>
        <h1 className="text-3xl font-medium tracking-wide">Join workspace</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Enter an invite code to create an account or add this workspace to
          yours.
        </p>
        <Suspense fallback={<p className="mt-8 text-[var(--muted)]">Loading…</p>}>
          <JoinForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already a member?{" "}
          <Link href="/login" className="text-[var(--fg)] underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
