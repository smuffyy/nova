import type { AgentHandle, ChatMessage } from "@/types/nova";
import { AGENTS } from "@/lib/nova/data";

const MENTION_RE = /@([a-z]+)/gi;

export function parseMentions(text: string): AgentHandle[] {
  const handles = new Set<AgentHandle>();
  const valid = new Set(AGENTS.map((a) => a.handle));
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_RE);
  while ((m = re.exec(text))) {
    const h = m[1].toLowerCase() as AgentHandle;
    if (valid.has(h)) handles.add(h);
  }
  return [...handles];
}

function uid() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

/** Mock orchestrator — replace with real LLM later. */
export async function runOrchestrator(
  userText: string,
  onProgress?: (msg: ChatMessage) => void
): Promise<ChatMessage[]> {
  const mentions = parseMentions(userText);
  const lower = userText.toLowerCase();
  const out: ChatMessage[] = [];

  const push = (msg: ChatMessage) => {
    out.push(msg);
    onProgress?.(msg);
  };

  const isProfitPlan =
    lower.includes("20%") ||
    (lower.includes("profit") &&
      (lower.includes("increase") || lower.includes("grow") || lower.includes("figure out")));

  const isProfitDrop =
    lower.includes("profit") &&
    (lower.includes("drop") || lower.includes("down") || lower.includes("decreas"));

  const isDormant =
    lower.includes("dormant") ||
    (lower.includes("haven't") && lower.includes("order")) ||
    lower.includes("inactive");

  const isSharma =
    lower.includes("sharma") || lower.includes("overdue") || lower.includes("payment");

  // Default orchestrator path
  if (isProfitPlan || mentions.includes("ceo") && lower.includes("profit")) {
    push({
      id: uid(),
      role: "assistant",
      agent: "nova",
      content: "I'll coordinate the team on a 20% profit plan.",
      createdAt: nowIso(),
    });

    await delay(500);
    push({
      id: uid(),
      role: "assistant",
      agent: "nova",
      content: "",
      blocks: [
        {
          type: "collaboration",
          steps: [
            { agent: "ceo", label: "Analyzing growth opportunity", status: "working" },
            { agent: "finance", label: "Analyzing margins", status: "waiting" },
            { agent: "sales", label: "Analyzing customer opportunities", status: "waiting" },
            { agent: "marketing", label: "Analyzing campaigns", status: "waiting" },
            { agent: "operations", label: "Analyzing cost reduction", status: "waiting" },
          ],
        },
      ],
      createdAt: nowIso(),
    });

    await delay(700);
    push({
      id: uid(),
      role: "assistant",
      agent: "nova",
      content: "",
      blocks: [
        {
          type: "activity",
          steps: [
            { agent: "finance", label: "Analyzed margins & cost structure", status: "done" },
            { agent: "sales", label: "Analyzed 486 customers", status: "done" },
            { agent: "marketing", label: "Analyzed campaign performance", status: "done" },
            { agent: "operations", label: "Analyzed shipping & fulfillment", status: "done" },
          ],
        },
      ],
      createdAt: nowIso(),
    });

    await delay(600);
    push({
      id: uid(),
      role: "assistant",
      agent: "ceo",
      content: "Here's a synthesized plan from the team.",
      blocks: [
        {
          type: "plan",
          title: "Your 20% Profit Plan",
          items: [
            { agent: "finance", finding: "₹2.1L/month potential cost reduction" },
            { agent: "sales", finding: "₹4.8L/month dormant customer opportunity" },
            { agent: "marketing", finding: "₹1.3L/month campaign opportunity" },
            { agent: "operations", finding: "₹900K annual shipping optimization" },
          ],
          total: "₹8.2L/month combined opportunity",
          actions: [{ id: "create-plan", label: "Create Action Plan" }],
        },
      ],
      createdAt: nowIso(),
    });
    return out;
  }

  if (isProfitDrop || mentions.includes("finance") && lower.includes("profit")) {
    push({
      id: uid(),
      role: "assistant",
      agent: "nova",
      content: "I'll have Finance investigate.",
      createdAt: nowIso(),
    });
    await delay(400);
    push({
      id: uid(),
      role: "assistant",
      agent: "nova",
      content: "",
      blocks: [
        {
          type: "activity",
          steps: [
            { agent: "finance", label: "Analyzing financial data…", status: "working" },
          ],
        },
      ],
      createdAt: nowIso(),
    });
    await delay(800);
    push({
      id: uid(),
      role: "assistant",
      agent: "finance",
      content: "Profit decreased 8.4% compared with last month.",
      blocks: [
        {
          type: "findings",
          items: [
            { label: "Material cost", value: "+12%", detail: "₹1.2L impact" },
            { label: "Shipping", value: "+14%", detail: "₹48K impact" },
            { label: "Late payments", value: "₹6.8L", detail: "Outstanding receivables" },
          ],
        },
        {
          type: "recommendation",
          text: "The biggest driver is material cost. Review supplier pricing before next week's orders.",
        },
        {
          type: "actions",
          actions: [
            { id: "investigate-suppliers", label: "Investigate suppliers", variant: "primary" },
            { id: "see-receivables", label: "See receivables", variant: "ghost" },
          ],
        },
      ],
      createdAt: nowIso(),
    });
    return out;
  }

  if (isDormant || mentions.includes("sales")) {
    push({
      id: uid(),
      role: "assistant",
      agent: mentions.includes("marketing") ? "nova" : "sales",
      content: mentions.includes("marketing")
        ? "Sales and Marketing will collaborate on a win-back plan."
        : "I found 8 high-value customers worth contacting.",
      blocks: [
        {
          type: "findings",
          items: [
            { label: "Dormant accounts", value: "8", detail: "60+ days quiet" },
            { label: "Historical revenue", value: "₹4.2L", detail: "Recoverable cohort" },
            { label: "Avg order value", value: "₹52K", detail: "Typical reorder" },
          ],
        },
        {
          type: "recommendation",
          text: "Contact list, message drafts, and timing are ready for review.",
        },
        {
          type: "actions",
          actions: [
            { id: "approve-all", label: "Approve All", variant: "primary" },
            { id: "review", label: "Review", variant: "ghost" },
            { id: "edit", label: "Edit", variant: "ghost" },
          ],
        },
      ],
      createdAt: nowIso(),
    });
    return out;
  }

  if (isSharma || lower.includes("payment reminder")) {
    push({
      id: uid(),
      role: "assistant",
      agent: "finance",
      content: "I can create a payment request for Sharma Industries.",
      blocks: [
        {
          type: "approval",
          id: "ap-1842",
          title: "Approval required",
          action: "Create payment request",
          amount: "₹84,000",
          party: "Sharma Industries",
          reason: "Invoice #INV-1842 overdue 18 days.",
          status: "pending",
        },
      ],
      createdAt: nowIso(),
    });
    return out;
  }

  const isInventory =
    lower.includes("inventory") ||
    lower.includes("stockout") ||
    lower.includes("product x") ||
    lower.includes("mcb") ||
    (mentions.includes("operations") &&
      (lower.includes("stock") || lower.includes("po") || lower.includes("cover")));

  if (isInventory || (mentions.includes("operations") && !mentions.includes("sales"))) {
    push({
      id: uid(),
      role: "assistant",
      agent: "operations",
      content: "Relay here — Product X (MCB 32A) is the critical SKU.",
      blocks: [
        {
          type: "findings",
          items: [
            { label: "Days cover", value: "5", detail: "At current burn" },
            { label: "Open orders", value: "12", detail: "Need this SKU" },
            { label: "Polycab lead", value: "7–10 days", detail: "Standard" },
          ],
        },
        {
          type: "recommendation",
          text: "Raise a PO today for 3 weeks cover, or pay +18% for express if contractor jobs slip.",
        },
        {
          type: "actions",
          actions: [
            { id: "draft-po", label: "Draft PO", variant: "primary" },
            { id: "ask-research", label: "Ask Prism on copper", variant: "ghost" },
          ],
        },
      ],
      createdAt: nowIso(),
    });
    return out;
  }

  const isMarketing =
    mentions.includes("marketing") ||
    lower.includes("product y") ||
    lower.includes("promotion") ||
    lower.includes("campaign");

  if (isMarketing) {
    push({
      id: uid(),
      role: "assistant",
      agent: "marketing",
      content: "Signal here — Product Y is under-promoted relative to margin.",
      blocks: [
        {
          type: "findings",
          items: [
            { label: "Gross margin", value: "~31%", detail: "Best in catalog" },
            { label: "Promo share", value: "−38%", detail: "vs Product X" },
            { label: "Channel", value: "WhatsApp + email", detail: "B2B reactivation" },
          ],
        },
        {
          type: "recommendation",
          text: "Run a 2-week focused push to Tier A dealers with a sample kit offer.",
        },
        {
          type: "actions",
          actions: [
            { id: "draft-campaign", label: "Draft campaign", variant: "primary" },
            { id: "segment", label: "Show segment", variant: "ghost" },
          ],
        },
      ],
      createdAt: nowIso(),
    });
    return out;
  }

  // Generic multi-agent or CEO
  const lead = mentions[0] || "ceo";
  const agent = AGENTS.find((a) => a.handle === lead)!;
  push({
    id: uid(),
    role: "assistant",
    agent: lead,
    content: `${agent.name} here. I reviewed the latest business context for Arun Electricals.`,
    blocks: [
      {
        type: "recommendation",
        text: "Start with receivables and dormant high-value customers — that's the fastest path to cash and revenue this week.",
      },
      {
        type: "actions",
        actions: [
          { id: "brief", label: "Open today's briefing", variant: "primary" },
          { id: "profit", label: "Run 20% profit plan", variant: "ghost" },
        ],
      },
    ],
    createdAt: nowIso(),
  });
  return out;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
