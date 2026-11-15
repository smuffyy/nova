/**
 * Demo finance snapshot for Ledger money dashboard (Ledgerix-inspired).
 * Grounded in Northwind demo vendors/invoices — not a live GL.
 */

export type MoneyKpi = {
  id: string;
  label: string;
  value: number;
  deltaPct: number;
  tone: "up" | "down" | "flat";
};

export type MonthPoint = {
  month: string;
  income: number;
  expenses: number;
  profit: number;
};

export type PayableRow = {
  vendor: string;
  category: string;
  due: string;
  amount: number;
  terms: string;
  status: "open" | "due_soon" | "overdue" | "paid";
};

export type InvoiceRow = {
  id: string;
  customer: string;
  date: string;
  amount: number;
  status: "paid" | "sent" | "draft";
};

export type AiInsight = {
  id: string;
  title: string;
  body: string;
  severity: "info" | "watch" | "good";
};

export type LedgerMoneySnapshot = {
  currency: string;
  asOf: string;
  kpis: MoneyKpi[];
  months: MonthPoint[];
  payables: PayableRow[];
  invoices: InvoiceRow[];
  insights: AiInsight[];
  cashByCategory: { label: string; amount: number; pct: number }[];
};

export function getDemoLedgerMoney(): LedgerMoneySnapshot {
  return {
    currency: "USD",
    asOf: "2025-07-15",
    kpis: [
      {
        id: "income",
        label: "Income (MTD)",
        value: 11250,
        deltaPct: 8.4,
        tone: "up",
      },
      {
        id: "expenses",
        label: "Expenses (MTD)",
        value: 4820,
        deltaPct: 3.1,
        tone: "up",
      },
      {
        id: "profit",
        label: "Gross profit",
        value: 6430,
        deltaPct: 12.2,
        tone: "up",
      },
      {
        id: "cash",
        label: "Cash on hand",
        value: 42840,
        deltaPct: -2.4,
        tone: "down",
      },
    ],
    months: [
      { month: "Feb", income: 8200, expenses: 4100, profit: 4100 },
      { month: "Mar", income: 9100, expenses: 4300, profit: 4800 },
      { month: "Apr", income: 8700, expenses: 4500, profit: 4200 },
      { month: "May", income: 10400, expenses: 4700, profit: 5700 },
      { month: "Jun", income: 9800, expenses: 5100, profit: 4700 },
      { month: "Jul", income: 11250, expenses: 4820, profit: 6430 },
    ],
    payables: [
      {
        vendor: "Acme Supplies LLC",
        category: "COGS",
        due: "2025-07-28",
        amount: 1240,
        terms: "Net 30 · 2/10",
        status: "due_soon",
      },
      {
        vendor: "Bright Paper Co",
        category: "COGS",
        due: "2025-07-18",
        amount: 640,
        terms: "Net 15",
        status: "overdue",
      },
      {
        vendor: "CloudHost Inc",
        category: "Software",
        due: "2025-07-28",
        amount: 89,
        terms: "Due on receipt <$500",
        status: "open",
      },
    ],
    invoices: [
      {
        id: "INV-1042",
        customer: "Contoso Retail",
        date: "2025-05-12",
        amount: 4800,
        status: "paid",
      },
      {
        id: "INV-1048",
        customer: "Contoso Retail",
        date: "2025-06-10",
        amount: 2250,
        status: "sent",
      },
      {
        id: "INV-1051",
        customer: "Fabrikam Events",
        date: "2025-06-22",
        amount: 1100,
        status: "paid",
      },
      {
        id: "INV-1055",
        customer: "Contoso Retail",
        date: "2025-07-01",
        amount: 3000,
        status: "draft",
      },
    ],
    insights: [
      {
        id: "i1",
        title: "Early-pay discount available",
        body: "Acme Supplies 2/10 Net 30 — paying by Jul 18 saves ~$25 vs waiting for Net 30.",
        severity: "good",
      },
      {
        id: "i2",
        title: "AR concentration",
        body: "Contoso Retail is 89% of open AR ($5,250). Collections risk is concentrated.",
        severity: "watch",
      },
      {
        id: "i3",
        title: "July run-rate",
        body: "Income is +8.4% vs June with expenses nearly flat — profit margin expanded.",
        severity: "info",
      },
    ],
    cashByCategory: [
      { label: "COGS", amount: 1880, pct: 39 },
      { label: "Software", amount: 89, pct: 2 },
      { label: "Ops / other", amount: 2851, pct: 59 },
    ],
  };
}

export function formatMoney(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}
