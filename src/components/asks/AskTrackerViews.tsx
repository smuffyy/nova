"use client";

import { useMemo, useState } from "react";

export type TrackerTask = {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  assigneeName: string | null;
  startsOn: string | null;
  endsOn: string | null;
};

export type TrackerCost = {
  id: string;
  label: string;
  category: string;
  amount: number;
};

export type TrackerBom = {
  id: string;
  partNumber: string;
  name: string;
  qty: number;
  unit: string;
  unitCost: number;
  lineTotal: number;
};

function money(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function parseDay(iso: string | null) {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function AskGanttView({
  tasks,
  onUpdateDates,
}: {
  tasks: TrackerTask[];
  onUpdateDates: (
    id: string,
    startsOn: string | null,
    endsOn: string | null
  ) => void;
}) {
  const ranged = useMemo(() => {
    const withDates = tasks.map((t) => {
      let start = parseDay(t.startsOn);
      let end = parseDay(t.endsOn);
      if (!start && !end) {
        return { ...t, start: null as Date | null, end: null as Date | null };
      }
      if (start && !end) end = new Date(start.getTime() + 2 * 86400000);
      if (!start && end) start = new Date(end.getTime() - 2 * 86400000);
      if (start && end && end < start) end = start;
      return { ...t, start, end };
    });
    const dated = withDates.filter((t) => t.start && t.end) as Array<
      TrackerTask & { start: Date; end: Date }
    >;
    if (!dated.length) {
      return { rows: withDates, origin: new Date(), span: 14 };
    }
    const min = new Date(Math.min(...dated.map((t) => t.start.getTime())));
    const max = new Date(Math.max(...dated.map((t) => t.end.getTime())));
    const span = Math.max(7, daysBetween(min, max) + 1);
    return { rows: withDates, origin: min, span };
  }, [tasks]);

  return (
    <section className="asks-track">
      <div className="asks-track__head">
        <h2>Gantt</h2>
        <p>Set start and end dates on tasks to place them on the timeline.</p>
      </div>

      <div className="asks-gantt">
        <div
          className="asks-gantt__scale"
          style={{ ["--span" as string]: ranged.span }}
        >
          {Array.from({ length: Math.min(ranged.span, 28) }, (_, i) => {
            const d = new Date(ranged.origin.getTime() + i * 86400000);
            return (
              <span key={i}>
                {d.toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
            );
          })}
        </div>

        <ul className="asks-gantt__rows">
          {ranged.rows.map((t) => {
            const start = t.start;
            const end = t.end;
            const hasBar = Boolean(start && end);
            const left = hasBar
              ? (daysBetween(ranged.origin, start!) / ranged.span) * 100
              : 0;
            const width = hasBar
              ? (Math.max(1, daysBetween(start!, end!) + 1) / ranged.span) * 100
              : 0;
            return (
              <li key={t.id} className="asks-gantt__row">
                <div className="asks-gantt__label">
                  <strong>{t.title}</strong>
                  <span>{t.status}</span>
                </div>
                <div className="asks-gantt__track">
                  {hasBar ? (
                    <div
                      className={`asks-gantt__bar is-${t.status}`}
                      style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                      title={`${t.startsOn} → ${t.endsOn}`}
                    />
                  ) : (
                    <span className="asks-gantt__empty">No dates</span>
                  )}
                </div>
                <div className="asks-gantt__dates">
                  <input
                    type="date"
                    value={t.startsOn || ""}
                    onChange={(e) =>
                      onUpdateDates(
                        t.id,
                        e.target.value || null,
                        t.endsOn
                      )
                    }
                  />
                  <input
                    type="date"
                    value={t.endsOn || ""}
                    onChange={(e) =>
                      onUpdateDates(
                        t.id,
                        t.startsOn,
                        e.target.value || null
                      )
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
        {!tasks.length ? (
          <p className="asks-muted">Add tasks on the Board to schedule them here.</p>
        ) : null}
      </div>
    </section>
  );
}

export function AskCostView({
  costs,
  total,
  onAdd,
  onRemove,
}: {
  costs: TrackerCost[];
  total: number;
  onAdd: (input: { label: string; category: string; amount: number }) => void;
  onRemove: (id: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Labor");
  const [amount, setAmount] = useState("");

  return (
    <section className="asks-track">
      <div className="asks-track__head asks-track__head--row">
        <div>
          <h2>Project cost</h2>
          <p>Track spend lines against this ask.</p>
        </div>
        <div className="asks-track__kpi">
          <span>Total</span>
          <strong>{money(total)}</strong>
        </div>
      </div>

      <ul className="asks-cost-list">
        {costs.map((c) => (
          <li key={c.id}>
            <div>
              <strong>{c.label}</strong>
              <span>{c.category}</span>
            </div>
            <em>{money(c.amount)}</em>
            <button type="button" className="asks-icon-btn" onClick={() => onRemove(c.id)}>
              ×
            </button>
          </li>
        ))}
        {!costs.length ? (
          <li className="asks-muted">No cost lines yet.</li>
        ) : null}
      </ul>

      <form
        className="asks-track__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim()) return;
          onAdd({
            label: label.trim(),
            category,
            amount: Number(amount) || 0,
          });
          setLabel("");
          setAmount("");
        }}
      >
        <input
          placeholder="Line item"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Labor</option>
          <option>Materials</option>
          <option>Equipment</option>
          <option>Travel</option>
          <option>Other</option>
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="submit" className="asks-btn asks-btn--primary">
          Add
        </button>
      </form>
    </section>
  );
}

export function AskBomView({
  bom,
  total,
  onAdd,
  onRemove,
}: {
  bom: TrackerBom[];
  total: number;
  onAdd: (input: {
    name: string;
    partNumber: string;
    qty: number;
    unit: string;
    unitCost: number;
  }) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("ea");
  const [unitCost, setUnitCost] = useState("");

  return (
    <section className="asks-track">
      <div className="asks-track__head asks-track__head--row">
        <div>
          <h2>Bill of materials</h2>
          <p>Parts and quantities for this ask.</p>
        </div>
        <div className="asks-track__kpi">
          <span>BOM value</span>
          <strong>{money(total)}</strong>
        </div>
      </div>

      <div className="asks-bom-table">
        <div className="asks-bom-table__head">
          <span>Part #</span>
          <span>Name</span>
          <span>Qty</span>
          <span>Unit</span>
          <span>Unit $</span>
          <span>Line</span>
          <span />
        </div>
        {bom.map((b) => (
          <div key={b.id} className="asks-bom-table__row">
            <span>{b.partNumber || "—"}</span>
            <span>{b.name}</span>
            <span>{b.qty}</span>
            <span>{b.unit}</span>
            <span>{money(b.unitCost)}</span>
            <span>{money(b.lineTotal)}</span>
            <button type="button" className="asks-icon-btn" onClick={() => onRemove(b.id)}>
              ×
            </button>
          </div>
        ))}
        {!bom.length ? (
          <p className="asks-muted" style={{ padding: "0.75rem 0" }}>
            No BOM lines yet.
          </p>
        ) : null}
      </div>

      <form
        className="asks-track__form asks-track__form--bom"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAdd({
            name: name.trim(),
            partNumber: partNumber.trim(),
            qty: Number(qty) || 1,
            unit,
            unitCost: Number(unitCost) || 0,
          });
          setName("");
          setPartNumber("");
          setQty("1");
          setUnitCost("");
        }}
      >
        <input
          placeholder="Part #"
          value={partNumber}
          onChange={(e) => setPartNumber(e.target.value)}
        />
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <input
          placeholder="Unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Unit cost"
          value={unitCost}
          onChange={(e) => setUnitCost(e.target.value)}
        />
        <button type="submit" className="asks-btn asks-btn--primary">
          Add
        </button>
      </form>
    </section>
  );
}
