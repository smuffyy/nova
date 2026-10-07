export type Agent = {
  id: string;
  handle: string;
  name: string;
  role: string;
  description: string;
};

export const AGENTS: Agent[] = [
  {
    id: "ceo",
    handle: "ceo",
    name: "Atlas",
    role: "Strategy",
    description:
      "Understands the whole business, coordinates the team, and turns findings into decisions.",
  },
  {
    id: "finance",
    handle: "finance",
    name: "Ledger",
    role: "Finance",
    description:
      "Owns money: revenue, expenses, profit, cash, receivables, and financial anomalies.",
  },
  {
    id: "sales",
    handle: "sales",
    name: "Scout",
    role: "Sales",
    description:
      "Finds revenue: dormant customers, follow-ups, prioritization, and pipeline risk.",
  },
  {
    id: "marketing",
    handle: "marketing",
    name: "Signal",
    role: "Marketing",
    description:
      "Campaigns, promotions, retention, and making high-margin products get attention.",
  },
  {
    id: "operations",
    handle: "operations",
    name: "Relay",
    role: "Operations",
    description:
      "Orders, inventory, suppliers, delivery, and the bottlenecks that slow everything down.",
  },
  {
    id: "research",
    handle: "research",
    name: "Prism",
    role: "Research",
    description:
      "Looks outside the company: markets, competitors, suppliers, and industry trends.",
  },
];
