"use client";

import { useState } from "react";
import { BRAND } from "@/brand";

export function WaitlistForm({
  variant = "default",
}: {
  variant?: "default" | "axiom";
}) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          company: variant === "axiom" ? "" : company,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      setStatus("done");
      setEmail("");
      setCompany("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "done") {
    return (
      <p className={variant === "axiom" ? "axiom-form-done" : "text-[var(--accent)]"}>
        You’re on the list. We’ll reach out about a pilot.
      </p>
    );
  }

  if (variant === "axiom") {
    return (
      <form onSubmit={onSubmit} className="axiom-email-form">
        <label className="sr-only" htmlFor="axiom-email">
          Email address
        </label>
        <input
          id="axiom-email"
          className="axiom-email-input"
          type="email"
          required
          placeholder="ENTER YOUR EMAIL"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="axiom-email-btn"
          type="submit"
          disabled={status === "loading"}
          aria-label={`Request access to ${BRAND.name} updates`}
        >
          {status === "loading" ? "…" : "→"}
        </button>
        {error ? <p className="axiom-form-error">{error}</p> : null}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <input
        className="input sm:flex-1"
        type="email"
        required
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="input sm:flex-1"
        type="text"
        placeholder="Company (optional)"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />
      <button className="btn btn-primary whitespace-nowrap" disabled={status === "loading"}>
        {status === "loading" ? "Joining…" : "Join waitlist"}
      </button>
      {error ? <p className="w-full text-sm text-[var(--danger)]">{error}</p> : null}
    </form>
  );
}
