"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  formatMoney,
  type LedgerMoneySnapshot,
} from "@/lib/ledger/money";

function IncomeChart({ months }: { months: LedgerMoneySnapshot["months"] }) {
  const max = Math.max(...months.map((m) => Math.max(m.income, m.expenses)), 1);
  return (
    <div className="ledger-chart" aria-label="Income vs expenses">
      {months.map((m) => (
        <div key={m.month} className="ledger-chart__col">
          <div className="ledger-chart__bars">
            <span
              className="ledger-chart__bar ledger-chart__bar--income"
              style={{ height: `${(m.income / max) * 100}%` }}
              title={`Income ${formatMoney(m.income)}`}
            />
            <span
              className="ledger-chart__bar ledger-chart__bar--expense"
              style={{ height: `${(m.expenses / max) * 100}%` }}
              title={`Expenses ${formatMoney(m.expenses)}`}
            />
          </div>
          <span className="ledger-chart__label">{m.month}</span>
        </div>
      ))}
    </div>
  );
}

export function LedgerClient() {
  const [snapshot, setSnapshot] = useState<LedgerMoneySnapshot | null>(null);
  const [forbidden, setForbidden] = useState<{
    message: string;
    yourRole: string;
    allowedRoles: { id: string; label: string }[];
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const moneyRes = await fetch("/api/ledger/money");
      if (moneyRes.status === 403) {
        const data = await moneyRes.json();
        setForbidden({
          message: data.message || "Access denied",
          yourRole: data.yourRole || "member",
          allowedRoles: data.allowedRoles || [],
        });
        setSnapshot(null);
      } else if (!moneyRes.ok) {
        throw new Error("Could not load Ledger money");
      } else {
        const data = await moneyRes.json();
        setForbidden(null);
        setSnapshot(data.snapshot);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-[var(--muted)]">Loading money…</p>;
  }

  return (
    <div className="ledger-page space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
            Money
          </p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight">Books</h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            See the money. Charts and tables stay behind Details. Ask @Ledger in
            Chat for cited answers.
          </p>
        </div>
        <Link href="/app?q=%40Ledger%20" className="btn btn-ghost self-start">
          Ask @Ledger
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      {forbidden ? (
        <section className="ledger-locked panel p-8">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
            Restricted
          </p>
          <h2 className="mt-3 text-2xl font-medium">Money is admin-only</h2>
          <p className="mt-2 max-w-xl text-[var(--muted)]">{forbidden.message}</p>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Your role: <span className="text-[var(--fg)]">{forbidden.yourRole}</span>
            {forbidden.allowedRoles.length ? (
              <>
                {" "}
                · Allowed:{" "}
                {forbidden.allowedRoles.map((r) => r.label).join(", ")}
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      {snapshot ? (
        <>
          <section className="ledger-kpi-grid">
            {snapshot.kpis.map((kpi) => (
              <article key={kpi.id} className="ledger-kpi">
                <p className="ledger-kpi__label">{kpi.label}</p>
                <p className="ledger-kpi__value">
                  {formatMoney(kpi.value, snapshot.currency)}
                </p>
                <p
                  className={`ledger-kpi__delta ledger-kpi__delta--${kpi.tone}`}
                >
                  {kpi.deltaPct > 0 ? "+" : ""}
                  {kpi.deltaPct}% vs prior month
                </p>
              </article>
            ))}
          </section>

          <details className="ledger-details">
            <summary>Details</summary>
            <div className="ledger-details__body">
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <section className="ledger-panel">
                  <div className="ledger-panel__head">
                    <div>
                      <h2>Income performance</h2>
                      <p>Monthly income vs expenses · as of {snapshot.asOf}</p>
                    </div>
                    <div className="ledger-legend">
                      <span>
                        <i className="ledger-dot ledger-dot--income" /> Income
                      </span>
                      <span>
                        <i className="ledger-dot ledger-dot--expense" /> Expenses
                      </span>
                    </div>
                  </div>
                  <IncomeChart months={snapshot.months} />
                </section>

                <section className="ledger-panel">
                  <div className="ledger-panel__head">
                    <div>
                      <h2>Ledger AI</h2>
                      <p>Insights from books memory — propose only</p>
                    </div>
                  </div>
                  <ul className="ledger-insights">
                    {snapshot.insights.map((insight) => (
                      <li
                        key={insight.id}
                        className={`ledger-insight ledger-insight--${insight.severity}`}
                      >
                        <strong>{insight.title}</strong>
                        <span>{insight.body}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="ledger-panel">
                  <div className="ledger-panel__head">
                    <div>
                      <h2>Payables</h2>
                      <p>What we owe · vendor terms from sources</p>
                    </div>
                  </div>
                  <div className="ledger-table-wrap">
                    <table className="ledger-table">
                      <thead>
                        <tr>
                          <th>Vendor</th>
                          <th>Due</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.payables.map((row) => (
                          <tr key={row.vendor}>
                            <td>
                              <div>{row.vendor}</div>
                              <div className="ledger-table__sub">{row.terms}</div>
                            </td>
                            <td>{row.due}</td>
                            <td>{formatMoney(row.amount)}</td>
                            <td>
                              <span
                                className={`ledger-pill ledger-pill--${row.status}`}
                              >
                                {row.status.replace("_", " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="ledger-panel">
                  <div className="ledger-panel__head">
                    <div>
                      <h2>Receivables</h2>
                      <p>Recent invoices</p>
                    </div>
                  </div>
                  <div className="ledger-table-wrap">
                    <table className="ledger-table">
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Customer</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.invoices.map((row) => (
                          <tr key={row.id}>
                            <td>
                              <div>{row.id}</div>
                              <div className="ledger-table__sub">{row.date}</div>
                            </td>
                            <td>{row.customer}</td>
                            <td>{formatMoney(row.amount)}</td>
                            <td>
                              <span
                                className={`ledger-pill ledger-pill--${row.status}`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
}
