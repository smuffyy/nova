import type { AgentHandle, ToolId } from "@/types/nova";
import { AGENTS, CUSTOMERS, INVOICES } from "@/lib/nova/data";

type ToolResult = { ok: true; data: unknown } | { ok: false; error: string };

const TOOLS: Record<ToolId, () => ToolResult> = {
  searchCustomers: () => ({ ok: true, data: CUSTOMERS }),
  getCustomer: () => ({ ok: true, data: CUSTOMERS[0] }),
  searchInvoices: () => ({ ok: true, data: INVOICES }),
  getRevenue: () => ({
    ok: true,
    data: { month: "Sep 2026", revenue: "₹38.4L", change: "-2.1%" },
  }),
  getExpenses: () => ({
    ok: true,
    data: {
      material: "+12%",
      shipping: "+14%",
      impact: "₹1.68L/month",
    },
  }),
  searchDocuments: () => ({
    ok: true,
    data: ["Pricing Sheet — Wholesale", "Q2 Expense Export"],
  }),
  createTask: () => ({ ok: true, data: { created: true } }),
  draftEmail: () => ({
    ok: true,
    data: {
      subject: "Reminder: Invoice INV-1842",
      body: "Dear Sharma Industries, …",
    },
  }),
  searchWeb: () => ({
    ok: true,
    data: { note: "Copper prices up 6% MoM (mock)" },
  }),
  generateReport: () => ({ ok: true, data: { title: "Profit review" } }),
  getInventory: () => ({
    ok: true,
    data: { sku: "MCB 32A", daysCover: 5 },
  }),
  getOrders: () => ({ ok: true, data: { open: 42, delayed: 3 } }),
};

export function runTool(agent: AgentHandle, tool: ToolId): ToolResult {
  const def = AGENTS.find((a) => a.handle === agent);
  if (!def?.tools.includes(tool)) {
    return { ok: false, error: `@${agent} cannot use ${tool}` };
  }
  return TOOLS[tool]();
}

export function toolsFor(agent: AgentHandle): ToolId[] {
  return AGENTS.find((a) => a.handle === agent)?.tools || [];
}
