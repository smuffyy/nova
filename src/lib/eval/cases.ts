/**
 * Pilot success questions for Northwind demo workspace.
 * Fill workspaceId at runtime from store.
 */
export const PILOT_EVAL_TEMPLATES = [
  {
    id: "refund-policy",
    query: "What is our customer refund policy for digital services?",
    mustInclude: ["7 days"],
  },
  {
    id: "vendor-acme",
    query: "What are payment terms with Acme Supplies?",
    mustInclude: ["Net 30"],
  },
  {
    id: "negative-rejection",
    query: "What is our quantum teleportation SLA?",
    expectRefuse: true,
  },
  {
    id: "onboarding-owner",
    query: "Who owns onboarding for new hires?",
    mustInclude: ["Maya"],
  },
  {
    id: "bright-paper-terms",
    query: "What are Bright Paper Co payment terms?",
    mustInclude: ["Net 15"],
  },
  {
    id: "refund-approval",
    query: "Who approves refunds over $250?",
    mustInclude: ["Maya"],
  },
  {
    id: "negative-payroll",
    query: "What is our Mars colony payroll schedule?",
    expectRefuse: true,
  },
];
