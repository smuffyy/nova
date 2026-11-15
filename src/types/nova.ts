export type AgentStatus =
  | "available"
  | "thinking"
  | "working"
  | "waiting"
  | "needs_approval"
  | "completed"
  | "error";

export type AgentHandle =
  | "ceo"
  | "finance"
  | "sales"
  | "marketing"
  | "operations"
  | "research";

export type ToolId =
  | "searchCustomers"
  | "getCustomer"
  | "searchInvoices"
  | "getRevenue"
  | "getExpenses"
  | "searchDocuments"
  | "createTask"
  | "draftEmail"
  | "searchWeb"
  | "generateReport"
  | "getInventory"
  | "getOrders";

export type PermissionId =
  | "read_financial"
  | "write_financial_reports"
  | "request_payment"
  | "read_customers"
  | "create_followup_tasks"
  | "draft_customer_messages"
  | "read_segments"
  | "create_campaign_drafts"
  | "read_orders"
  | "read_inventory"
  | "create_ops_tasks"
  | "read_documents"
  | "search_external"
  | "delegate_agents"
  | "create_plans";

export type Agent = {
  id: string;
  handle: AgentHandle;
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  status: AgentStatus;
  currentTask?: string;
  tools: ToolId[];
  permissions: PermissionId[];
  memory: { label: string; detail: string }[];
  color: string;
};

export type BriefingSeverity = "critical" | "high" | "medium" | "low";

export type BriefingItem = {
  id: string;
  severity: BriefingSeverity;
  title: string;
  agent: AgentHandle;
  summary: string;
  why: string;
  recommendation: string;
  impact?: string;
  primaryAction: { label: string; href?: string };
  secondaryAction?: { label: string; href?: string };
};

export type NovaTaskStatus = "do_today" | "waiting" | "in_progress" | "completed";

export type NovaTask = {
  id: string;
  title: string;
  status: NovaTaskStatus;
  createdBy: AgentHandle;
  reason: string;
  impact: string;
  createdAt: string;
};

export type KnowledgeDoc = {
  id: string;
  title: string;
  category:
    | "Documents"
    | "Products"
    | "Customers"
    | "Processes"
    | "Policies"
    | "Financial"
    | "Operations";
  updatedAt: string;
  size: string;
  summary?: string;
  body?: string;
};

export type Integration = {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  lastSynced?: string;
};

export type ActivityEvent = {
  id: string;
  agent?: AgentHandle | "nova";
  text: string;
  at: string;
  kind: "done" | "working" | "waiting" | "info" | "approval";
};

export type ChatBlock =
  | { type: "text"; text: string }
  | { type: "findings"; items: { label: string; value: string; detail?: string }[] }
  | { type: "recommendation"; text: string }
  | { type: "actions"; actions: { id: string; label: string; variant?: "primary" | "ghost" }[] }
  | {
      type: "approval";
      id: string;
      title: string;
      action: string;
      amount?: string;
      party?: string;
      reason: string;
      status: "pending" | "approved" | "rejected";
    }
  | {
      type: "collaboration";
      steps: { agent: AgentHandle; label: string; status: "done" | "working" | "waiting" }[];
    }
  | {
      type: "plan";
      title: string;
      items: { agent: AgentHandle; finding: string }[];
      total: string;
      actions: { id: string; label: string }[];
    }
  | {
      type: "activity";
      steps: { agent: AgentHandle; label: string; status: "done" | "working" | "waiting" }[];
    };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  agent?: AgentHandle | "nova";
  content: string;
  blocks?: ChatBlock[];
  createdAt: string;
};

export type BusinessProfile = {
  name: string;
  industry: string;
  location: string;
  employees: number;
  customers: number;
  monthlyRevenue: string;
  outstanding: string;
  owner: string;
  plan: string;
};
