"use client";

import { useState } from "react";

type Score = {
  id: string;
  query?: string;
  passed: boolean;
  refused: boolean;
  gateBand?: string;
  faithfulnessProxy: number;
  specificityHits: number;
  specificityNeeded: number;
  notes: string[];
  answerPreview?: string;
};

type Report = {
  total: number;
  passed: number;
  failed: number;
  avgFaithfulness: number;
  scores: Score[];
};

export function EvalClient() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/eval", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eval failed");
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eval failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--mineral)] uppercase">
            Intelligence check
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-wide">
            Pilot eval
          </h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            Runs grounded success questions: exact facts, refusals on nonsense,
            and citation coverage. Use this after training Dojo files.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading}
          onClick={() => void run()}
        >
          {loading ? "Running…" : "Run eval"}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      {report ? (
        <>
          <div className="ledger-kpi-grid">
            <article className="ledger-kpi">
              <p className="ledger-kpi__label">Passed</p>
              <p className="ledger-kpi__value">
                {report.passed}/{report.total}
              </p>
            </article>
            <article className="ledger-kpi">
              <p className="ledger-kpi__label">Failed</p>
              <p className="ledger-kpi__value">{report.failed}</p>
            </article>
            <article className="ledger-kpi">
              <p className="ledger-kpi__label">Citation score</p>
              <p className="ledger-kpi__value">
                {(report.avgFaithfulness * 100).toFixed(0)}%
              </p>
            </article>
          </div>

          <section className="panel overflow-hidden">
            <ul className="divide-y divide-[var(--line)]">
              {report.scores.map((s) => (
                <li key={s.id} className="px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{s.id}</div>
                      <div className="mt-0.5 text-xs text-[var(--muted)]">
                        {s.query}
                      </div>
                    </div>
                    <span
                      className={`ledger-pill ${
                        s.passed ? "ledger-pill--paid" : "ledger-pill--overdue"
                      }`}
                    >
                      {s.passed ? "pass" : "fail"}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-[var(--muted)]">
                    cite {(s.faithfulnessProxy * 100).toFixed(0)}%
                    {s.gateBand ? ` · gate ${s.gateBand}` : ""}
                    {s.refused ? " · refused" : ""}
                    {s.specificityNeeded
                      ? ` · specifics ${s.specificityHits}/${s.specificityNeeded}`
                      : ""}
                    {s.notes.length ? ` · ${s.notes.join(", ")}` : ""}
                  </div>
                  {s.answerPreview ? (
                    <p className="mt-2 text-sm leading-relaxed text-[var(--fg)]/85">
                      {s.answerPreview}
                      {s.answerPreview.length >= 220 ? "…" : ""}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p className="text-[var(--muted)]">
          No run yet — hit Run eval to measure the company brain.
        </p>
      )}
    </div>
  );
}
