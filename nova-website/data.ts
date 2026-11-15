import type {
  Agent,
  AgentHandle,
  BriefingItem,
  BusinessProfile,
  Integration,
  KnowledgeDoc,
  NovaTask,
  ActivityEvent,
} from "@/types/nova";

export const BUSINESS: BusinessProfile = {
  name: "Arun Electricals",
  industry: "Electrical Components Distribution",
  location: "Bengaluru, India",
  employees: 24,
  customers: 486,
  monthlyRevenue: "₹38.4L",
  outstanding: "₹6.8L",
  owner: "Arun",
  plan: "Pro",
};

export const AGENTS: Agent[] = [
  {
    id: "ceo",
    handle: "ceo",
    name: "Atlas",
    role: "Strategy",
    description:
      "Understands the whole business, coordinates the team, and turns findings into decisions.",
    capabilities: [
      "Strategic planning",
      "Cross-agent coordination",
      "Decision synthesis",
      "Business plans",
    ],
    status: "available",
    tools: ["generateReport", "createTask", "searchDocuments"],
    permissions: ["delegate_agents", "create_plans", "read_documents"],
    memory: [
      { label: "Growth target", detail: "20% profit increase this fiscal year" },
      { label: "Priority markets", detail: "Bengaluru industrial + mid-size contractors" },
      { label: "Operating rhythm", detail: "Weekly cash review; monthly margin review" },
    ],
    color: "#111111",
  },
  {
    id: "finance",
    handle: "finance",
    name: "Ledger",
    role: "Finance",
    description:
      "Owns money: revenue, expenses, profit, cash, receivables, and financial anomalies.",
    capabilities: [
      "P&L analysis",
      "Cash flow",
      "Receivables / payables",
      "Invoice analysis",
      "Forecasting",
    ],
    status: "working",
    currentTask: "Analyzing September expenses",
    tools: [
      "getRevenue",
      "getExpenses",
      "searchInvoices",
      "generateReport",
      "draftEmail",
      "createTask",
    ],
    permissions: [
      "read_financial",
      "write_financial_reports",
      "request_payment",
    ],
    memory: [
      { label: "Fiscal year", detail: "April–March" },
      { label: "Typical gross margin", detail: "18–22%" },
      { label: "Key suppliers", detail: "Havells, Polycab, L&T Electrical" },
      { label: "Receivables goal", detail: "Keep DSO under 35 days" },
    ],
    color: "#2563eb",
  },
  {
    id: "sales",
    handle: "sales",
    name: "Scout",
    role: "Sales",
    description:
      "Finds revenue: dormant customers, follow-ups, prioritization, and pipeline risk.",
    capabilities: [
      "Customer prioritization",
      "Dormant recovery",
      "Lead analysis",
      "Revenue forecasting",
    ],
    status: "available",
    tools: ["searchCustomers", "getCustomer", "createTask", "draftEmail"],
    permissions: [
      "read_customers",
      "create_followup_tasks",
      "draft_customer_messages",
    ],
    memory: [
      { label: "Top accounts", detail: "Sharma Industries, Contoso India, Northwind Studio" },
      { label: "Buying cycle", detail: "Industrial buyers reorder every 45–60 days" },
      { label: "Avg order value", detail: "₹52,000" },
    ],
    color: "#0d9488",
  },
  {
    id: "marketing",
    handle: "marketing",
    name: "Signal",
    role: "Marketing",
    description:
      "Campaigns, promotions, retention, and making high-margin products get attention.",
    capabilities: [
      "Campaign drafts",
      "Segmentation",
      "Retention / reactivation",
      "Promotion analysis",
    ],
    status: "available",
    tools: ["searchCustomers", "createTask", "draftEmail", "generateReport"],
    permissions: ["read_segments", "create_campaign_drafts", "read_customers"],
    memory: [
      { label: "Best channel", detail: "WhatsApp + email for B2B reactivation" },
      { label: "High-margin SKU", detail: "Industrial sensors (Product Y)" },
    ],
    color: "#c2410c",
  },
  {
    id: "operations",
    handle: "operations",
    name: "Relay",
    role: "Operations",
    description:
      "Orders, inventory, suppliers, delivery, and the bottlenecks that slow everything down.",
    capabilities: [
      "Inventory risk",
      "Supplier issues",
      "Order bottlenecks",
      "Process tasks",
    ],
    status: "waiting",
    tools: ["getInventory", "getOrders", "createTask", "searchDocuments"],
    permissions: ["read_orders", "read_inventory", "create_ops_tasks"],
    memory: [
      { label: "Lead time", detail: "Polycab cables: 7–10 days" },
      { label: "Stock policy", detail: "Keep 12 days cover on A-movers" },
    ],
    color: "#0f766e",
  },
  {
    id: "research",
    handle: "research",
    name: "Prism",
    role: "Research",
    description:
      "Looks outside the company: markets, competitors, suppliers, and industry trends.",
    capabilities: [
      "Competitor research",
      "Supplier research",
      "Industry trends",
      "External web research",
    ],
    status: "available",
    tools: ["searchWeb", "searchDocuments", "generateReport"],
    permissions: ["search_external", "read_documents"],
    memory: [
      { label: "Competitors", detail: "Vashi Electricals, local OEM distributors" },
      { label: "Watch", detail: "Copper price swings affecting cable margins" },
    ],
    color: "#475569",
  },
];

export function agentByHandle(handle: string): Agent | undefined {
  return AGENTS.find((a) => a.handle === handle);
}

export const BRIEFING: BriefingItem[] = [
  {
    id: "b1",
    severity: "critical",
    title: "Payment overdue",
    agent: "finance",
    summary: "Sharma Industries owes ₹84,000. Invoice #INV-1842 is 18 days overdue.",
    why: "Cash is trapped and DSO is drifting above target.",
    recommendation: "Send a payment reminder today.",
    impact: "₹84,000",
    primaryAction: { label: "Review", href: "/nova/chat?prompt=Review%20Sharma%20Industries%20overdue%20invoice" },
    secondaryAction: { label: "Let Finance Handle", href: "/nova/chat?prompt=%40finance%20Handle%20Sharma%20Industries%20payment%20reminder" },
  },
  {
    id: "b2",
    severity: "high",
    title: "Sales opportunity",
    agent: "sales",
    summary: "8 high-value customers haven't reordered recently.",
    why: "Historical revenue from this cohort is ₹4.2L — recoverable with outreach.",
    recommendation: "Prioritize reactivation this week.",
    impact: "₹4.2L potential",
    primaryAction: { label: "View Customers", href: "/nova/chat?prompt=%40sales%20Show%20dormant%20high-value%20customers" },
    secondaryAction: { label: "Ask Sales", href: "/nova/chat?prompt=%40sales%20Plan%20outreach%20for%20dormant%20customers" },
  },
  {
    id: "b3",
    severity: "high",
    title: "Inventory risk",
    agent: "operations",
    summary: "Product X (MCB 32A) will run out in about 5 days at current burn.",
    why: "Stockout would delay contractor orders this week.",
    recommendation: "Review PO timing with Polycab.",
    impact: "5 days cover",
    primaryAction: { label: "Review", href: "/nova/chat?prompt=%40operations%20Review%20Product%20X%20stockout%20risk" },
  },
  {
    id: "b4",
    severity: "medium",
    title: "Marketing opportunity",
    agent: "marketing",
    summary:
      "Product Y (industrial sensors) has the highest margin but gets 38% less promotion than Product X.",
    why: "Margin mix can improve without raising volume risk.",
    recommendation: "Explore a focused promotion this month.",
    impact: "Highest margin SKU",
    primaryAction: { label: "Explore", href: "/nova/chat?prompt=%40marketing%20Explore%20promotion%20for%20Product%20Y" },
  },
];

export const TASKS: NovaTask[] = [
  {
    id: "t1",
    title: "Follow up with Sharma Industries",
    status: "do_today",
    createdBy: "finance",
    reason: "₹84,000 overdue on INV-1842",
    impact: "₹84,000",
    createdAt: "2026-10-06",
  },
  {
    id: "t2",
    title: "Reactivate dormant customers",
    status: "do_today",
    createdBy: "sales",
    reason: "8 high-value accounts quiet for 60+ days",
    impact: "₹4.2L potential",
    createdAt: "2026-10-06",
  },
  {
    id: "t3",
    title: "Raise PO for MCB 32A (Product X)",
    status: "waiting",
    createdBy: "operations",
    reason: "5-day stock cover remaining",
    impact: "Avoid stockout",
    createdAt: "2026-10-05",
  },
  {
    id: "t4",
    title: "Draft Product Y margin campaign",
    status: "in_progress",
    createdBy: "marketing",
    reason: "Underpromoted high-margin SKU",
    impact: "Margin mix lift",
    createdAt: "2026-10-04",
  },
  {
    id: "t5",
    title: "September expense variance report",
    status: "completed",
    createdBy: "finance",
    reason: "Material + shipping cost spike",
    impact: "₹1.68L/month",
    createdAt: "2026-10-03",
  },
];

export const KNOWLEDGE: KnowledgeDoc[] = [
  { id: "k1", title: "Product Catalog 2026", category: "Products", updatedAt: "2 days ago", size: "2.4 MB" },
  { id: "k2", title: "Pricing Sheet — Wholesale", category: "Financial", updatedAt: "Yesterday", size: "180 KB" },
  { id: "k3", title: "Customer Credit Policy", category: "Policies", updatedAt: "1 week ago", size: "92 KB" },
  { id: "k4", title: "Order Fulfillment SOP", category: "Processes", updatedAt: "3 weeks ago", size: "410 KB" },
  { id: "k5", title: "Supplier Master — Polycab & Havells", category: "Operations", updatedAt: "5 days ago", size: "640 KB" },
  { id: "k6", title: "Top 50 Customers FY25", category: "Customers", updatedAt: "4 days ago", size: "220 KB" },
  { id: "k7", title: "Q2 Expense Export", category: "Financial", updatedAt: "Sep 30", size: "1.1 MB" },
];

export const INTEGRATIONS: Integration[] = [
  { id: "gmail", name: "Gmail", description: "Email drafts and sync", connected: true, lastSynced: "5 minutes ago" },
  { id: "drive", name: "Google Drive", description: "Documents and folders", connected: true, lastSynced: "1 hour ago" },
  { id: "sheets", name: "Google Sheets", description: "Spreadsheets and ledgers", connected: false },
  { id: "calendar", name: "Google Calendar", description: "Meetings and reminders", connected: false },
  { id: "accounting", name: "Accounting", description: "Invoices and books", connected: true, lastSynced: "12 minutes ago" },
  { id: "crm", name: "CRM", description: "Customers and pipeline", connected: false },
  { id: "slack", name: "Slack", description: "Team notifications", connected: false },
  { id: "teams", name: "Microsoft Teams", description: "Team chat", connected: false },
];

export const ACTIVITY: ActivityEvent[] = [
  { id: "a1", agent: "finance", text: "Analyzed September revenue vs last month", at: "8:12 AM", kind: "done" },
  { id: "a2", agent: "sales", text: "Scanned 486 customers for reorder gaps", at: "8:14 AM", kind: "done" },
  { id: "a3", agent: "marketing", text: "Comparing promotion mix for Product X vs Y", at: "8:18 AM", kind: "working" },
  { id: "a4", agent: "operations", text: "Waiting on inventory burn rate", at: "8:18 AM", kind: "waiting" },
  { id: "a5", agent: "finance", text: "Flagged INV-1842 for approval workflow", at: "8:20 AM", kind: "approval" },
  { id: "a6", agent: "nova", text: "Morning briefing prepared for Arun", at: "8:22 AM", kind: "info" },
];

export const CUSTOMERS = [
  { id: "c1", name: "Sharma Industries", city: "Peenya", lastOrder: "62 days ago", value: "₹9.4L/yr", status: "Overdue" },
  { id: "c2", name: "Contoso India", city: "Whitefield", lastOrder: "18 days ago", value: "₹12.1L/yr", status: "Active" },
  { id: "c3", name: "Northwind Studio", city: "Koramangala", lastOrder: "71 days ago", value: "₹6.2L/yr", status: "Dormant" },
  { id: "c4", name: "Mehta Switchgear", city: "Bommasandra", lastOrder: "9 days ago", value: "₹4.8L/yr", status: "Active" },
  { id: "c5", name: "Rao Controls", city: "Yelahanka", lastOrder: "55 days ago", value: "₹3.9L/yr", status: "Dormant" },
];

export const INVOICES = [
  { id: "INV-1842", customer: "Sharma Industries", amount: "₹84,000", daysOverdue: 18, status: "Overdue" },
  { id: "INV-1831", customer: "Contoso India", amount: "₹1.2L", daysOverdue: 0, status: "Paid" },
  { id: "INV-1820", customer: "Northwind Studio", amount: "₹46,500", daysOverdue: 4, status: "Due soon" },
];

export function formatToday() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export const AGENT_MENTION_META: Record<
  AgentHandle,
  { blurb: string }
> = {
  ceo: { blurb: "Executive strategy and coordination" },
  finance: { blurb: "Money, expenses, profit, receivables" },
  sales: { blurb: "Customers, leads, revenue opportunities" },
  marketing: { blurb: "Campaigns, promotions, engagement" },
  operations: { blurb: "Orders, inventory, suppliers, workflow" },
  research: { blurb: "Market, competitors, external research" },
};
