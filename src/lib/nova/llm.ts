import type { AgentHandle } from "@/types/nova";
import {
  AGENTS,
  BUSINESS,
  BRIEFING,
  CUSTOMERS,
  INVOICES,
  TASKS,
  KNOWLEDGE,
} from "@/lib/nova/data";
import { runTool } from "@/lib/nova/tools";

export type LlmProvider =
  | "xai"
  | "openai"
  | "openrouter"
  | "anthropic"
  | "compatible"
  | "mock";

export type LlmConfig = {
  provider: LlmProvider;
  apiKey: string | null;
  model: string;
  baseUrl: string;
  label: string;
};

/**
 * Connect NOVA to almost any smart LLM.
 * Priority (override with NOVA_LLM_PROVIDER):
 * 1. OpenRouter  — one key, many models (Claude, GPT, Grok, Gemini…)
 * 2. xAI Grok
 * 3. Anthropic Claude
 * 4. OpenAI
 * 5. Generic OpenAI-compatible (Groq, Together, Ollama, Fireworks…)
 */
export function resolveLlm(): LlmConfig {
  const forced = (process.env.NOVA_LLM_PROVIDER || "").toLowerCase();

  const openrouter = process.env.OPENROUTER_API_KEY || null;
  const xai = process.env.XAI_API_KEY || process.env.GROK_API_KEY || null;
  const anthropic = process.env.ANTHROPIC_API_KEY || null;
  const openai = process.env.OPENAI_API_KEY || null;
  const compatibleKey =
    process.env.NOVA_LLM_API_KEY || process.env.LLM_API_KEY || null;
  const compatibleBase =
    process.env.NOVA_LLM_BASE_URL || process.env.LLM_BASE_URL || null;

  const pick = (provider: LlmProvider): LlmConfig | null => {
    if (provider === "openrouter" && openrouter) {
      return {
        provider: "openrouter",
        apiKey: openrouter,
        model:
          process.env.OPENROUTER_MODEL ||
          process.env.NOVA_LLM_MODEL ||
          "openai/gpt-4o-mini",
        baseUrl: "https://openrouter.ai/api/v1",
        label: "OpenRouter",
      };
    }
    if (provider === "xai" && xai) {
      return {
        provider: "xai",
        apiKey: xai,
        model: process.env.XAI_MODEL || process.env.GROK_MODEL || "grok-4.7",
        baseUrl: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
        label: "Grok",
      };
    }
    if (provider === "anthropic" && anthropic) {
      return {
        provider: "anthropic",
        apiKey: anthropic,
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        baseUrl: "https://api.anthropic.com/v1",
        label: "Claude",
      };
    }
    if (provider === "openai" && openai) {
      return {
        provider: "openai",
        apiKey: openai,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        baseUrl: "https://api.openai.com/v1",
        label: "OpenAI",
      };
    }
    if (provider === "compatible" && compatibleKey && compatibleBase) {
      return {
        provider: "compatible",
        apiKey: compatibleKey,
        model: process.env.NOVA_LLM_MODEL || process.env.LLM_MODEL || "gpt-4o-mini",
        baseUrl: compatibleBase.replace(/\/$/, ""),
        label: "Custom LLM",
      };
    }
    return null;
  };

  if (forced) {
    const cfg = pick(forced as LlmProvider);
    if (cfg) return cfg;
  }

  return (
    pick("openrouter") ||
    pick("xai") ||
    pick("anthropic") ||
    pick("openai") ||
    pick("compatible") || {
      provider: "mock",
      apiKey: null,
      model: "mock",
      baseUrl: "",
      label: "Demo",
    }
  );
}

export function buildSystemPrompt(mentions: AgentHandle[]): string {
  const lead = mentions[0] || "ceo";
  const agents = AGENTS.map(
    (a) => `- @${a.handle} (${a.name}, ${a.role}): ${a.description}`
  ).join("\n");

  return `You are NOVA — a sharp multi-agent AI operating system for small and mid-size businesses.
You are also a broadly capable assistant: you can answer general knowledge, strategy, math, writing, coding, and research questions — not only CRM/ERP queries.

Never say you are "just an AI language model." Speak as a calm, confident executive AI team.

Business workspace:
- Company: ${BUSINESS.name}
- Industry: ${BUSINESS.industry}
- Location: ${BUSINESS.location}
- Employees: ${BUSINESS.employees}
- Customers: ${BUSINESS.customers}
- Monthly revenue: ${BUSINESS.monthlyRevenue}
- Outstanding: ${BUSINESS.outstanding}
- Owner: ${BUSINESS.owner}

Team:
${agents}

Default voice: @${lead} (or NOVA when coordinating).
When a specialist is clearly needed, answer as that agent and prefix with @handle.

You can and should:
- Answer almost any useful question clearly
- Use business tools when the question is about this company
- Use live search / code tools when available
- Give practical recommendations and next actions
- Ask for approval before external actions (email, payment, outreach)

Style:
- Concise and structured
- Prefer short explanation → findings → recommendation → action
- Use ₹ and Indian context when talking about this business
- Be helpful on general topics too (markets, writing, analysis, how-tos)

Briefing signals:
${BRIEFING.map((b) => `- ${b.title} (@${b.agent}): ${b.summary}`).join("\n")}`;
}

export const BUSINESS_FUNCTIONS = [
  {
    type: "function" as const,
    function: {
      name: "searchCustomers",
      description: "Search Arun Electricals customers",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "searchInvoices",
      description: "Search invoices and receivables",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getRevenue",
      description: "Get latest revenue snapshot",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getExpenses",
      description: "Get expense variance snapshot",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getInventory",
      description: "Get inventory risk snapshot",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "listTasks",
      description: "List open AI-generated business tasks",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "searchKnowledge",
      description: "Search business knowledge documents",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getBusinessProfile",
      description: "Get the workspace business profile",
      parameters: { type: "object", properties: {} },
    },
  },
];

export function executeBusinessFunction(
  name: string,
  agent: AgentHandle = "ceo"
): unknown {
  switch (name) {
    case "searchCustomers":
      return CUSTOMERS;
    case "searchInvoices":
      return INVOICES;
    case "getRevenue":
      return runTool(agent === "finance" ? "finance" : "ceo", "getRevenue");
    case "getExpenses":
      return runTool("finance", "getExpenses");
    case "getInventory":
      return runTool("operations", "getInventory");
    case "listTasks":
      return TASKS;
    case "searchKnowledge":
      return KNOWLEDGE;
    case "getBusinessProfile":
      return BUSINESS;
    default:
      return { error: `Unknown tool ${name}` };
  }
}

export type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

export async function callNovaLlm(opts: {
  messages: ChatTurn[];
  mentions: AgentHandle[];
}): Promise<{
  text: string;
  provider: LlmProvider;
  model: string;
  toolsUsed: string[];
  label: string;
} | null> {
  const cfg = resolveLlm();
  if (cfg.provider === "mock" || !cfg.apiKey) return null;

  const system = buildSystemPrompt(opts.mentions);
  const toolsUsed: string[] = [];

  if (cfg.provider === "anthropic") {
    const text = await callAnthropic({
      cfg,
      system,
      messages: opts.messages,
    });
    if (!text) return null;
    return {
      text,
      provider: "anthropic",
      model: cfg.model,
      toolsUsed,
      label: cfg.label,
    };
  }

  if (cfg.provider === "xai") {
    try {
      const res = await fetch(`${cfg.baseUrl}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: cfg.model,
          input: [
            { role: "system", content: system },
            ...opts.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          tools: [
            { type: "web_search" },
            { type: "x_search" },
            { type: "code_interpreter" },
            ...BUSINESS_FUNCTIONS.map((f) => ({
              type: "function",
              name: f.function.name,
              description: f.function.description,
              parameters: f.function.parameters,
            })),
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = extractResponsesText(data);
        toolsUsed.push(...extractResponsesTools(data));
        if (text) {
          return {
            text,
            provider: "xai",
            model: cfg.model,
            toolsUsed: [...new Set(toolsUsed)],
            label: cfg.label,
          };
        }
      }
    } catch {
      /* fall through */
    }
  }

  // OpenAI-compatible path: OpenAI, OpenRouter, xAI chat completions, Groq, Ollama, etc.
  const result = await chatCompletionsLoop({
    cfg,
    system,
    messages: opts.messages,
    mentions: opts.mentions,
    toolsUsed,
  });
  if (!result) return null;
  return { ...result, label: cfg.label };
}

async function callAnthropic(opts: {
  cfg: LlmConfig;
  system: string;
  messages: ChatTurn[];
}): Promise<string | null> {
  const { cfg, system, messages } = opts;
  if (!cfg.apiKey) return null;

  const res = await fetch(`${cfg.baseUrl}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 4096,
      system,
      messages: messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Claude error ${res.status}: ${err.slice(0, 240)}`);
  }

  const data = await res.json();
  const parts = data.content;
  if (!Array.isArray(parts)) return null;
  return parts
    .filter((p: { type?: string }) => p.type === "text")
    .map((p: { text?: string }) => p.text || "")
    .join("\n")
    .trim();
}

async function chatCompletionsLoop(opts: {
  cfg: LlmConfig;
  system: string;
  messages: ChatTurn[];
  mentions: AgentHandle[];
  toolsUsed: string[];
}): Promise<{
  text: string;
  provider: LlmProvider;
  model: string;
  toolsUsed: string[];
} | null> {
  const { cfg, system, mentions } = opts;
  if (!cfg.apiKey) return null;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
    "Content-Type": "application/json",
  };
  if (cfg.provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL || "http://localhost:3000";
    headers["X-Title"] = "NOVA";
  }

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: system },
    ...opts.messages,
  ];

  const useTools = cfg.provider !== "compatible" || process.env.NOVA_LLM_TOOLS !== "0";

  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: 0.55,
        ...(useTools ? { tools: BUSINESS_FUNCTIONS, tool_choice: "auto" } : {}),
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`LLM error ${res.status}: ${err.slice(0, 240)}`);
    }

    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    if (!msg) return null;

    const toolCalls = msg.tool_calls as
      | Array<{
          id: string;
          function: { name: string; arguments: string };
        }>
      | undefined;

    if (toolCalls?.length) {
      messages.push(msg);
      for (const call of toolCalls) {
        opts.toolsUsed.push(call.function.name);
        const result = executeBusinessFunction(
          call.function.name,
          mentions[0] || "ceo"
        );
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }

    const text = String(msg.content || "").trim();
    if (!text) return null;
    return {
      text,
      provider: cfg.provider,
      model: cfg.model,
      toolsUsed: [...new Set(opts.toolsUsed)],
    };
  }

  return {
    text: "I hit a tool-loop limit — try a more specific question.",
    provider: cfg.provider,
    model: cfg.model,
    toolsUsed: [...new Set(opts.toolsUsed)],
  };
}

function extractResponsesText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  if (typeof d.output_text === "string") return d.output_text.trim();
  const output = d.output;
  if (!Array.isArray(output)) return "";
  const parts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const it = item as Record<string, unknown>;
    if (it.type === "message" && Array.isArray(it.content)) {
      for (const c of it.content) {
        if (c && typeof c === "object") {
          const chunk = c as Record<string, unknown>;
          if (typeof chunk.text === "string") parts.push(chunk.text);
        }
      }
    }
  }
  return parts.join("\n").trim();
}

function extractResponsesTools(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  const output = d.output;
  if (!Array.isArray(output)) return [];
  const used: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const it = item as Record<string, unknown>;
    if (typeof it.type === "string") {
      if (it.type.includes("web_search")) used.push("web_search");
      if (it.type.includes("x_search")) used.push("x_search");
      if (it.type.includes("code")) used.push("code_interpreter");
      if (it.type === "function_call" && typeof it.name === "string") {
        used.push(it.name);
      }
    }
  }
  return used;
}

/** Smarter offline answers when no API key is configured. */
export function smartMockAnswer(
  userText: string,
  mentions: AgentHandle[]
): string {
  const q = userText.toLowerCase();
  const lead = mentions[0] || "ceo";

  if (/(who are you|what is nova|what can you do)/.test(q)) {
    return `I'm NOVA — your AI business team for ${BUSINESS.name}.\n\nAsk me about profit, customers, inventory, marketing, operations, or general strategy. Mention specialists with @finance @sales @marketing @operations @research @ceo.\n\nFor full intelligence (web, reasoning, any topic), connect an LLM key in .env — OpenRouter, Grok, Claude, or OpenAI.`;
  }

  if (/(revenue|monthly sales|turnover)/.test(q)) {
    return `${BUSINESS.name} runs about ${BUSINESS.monthlyRevenue}/month across ${BUSINESS.customers} customers. Outstanding receivables sit at ${BUSINESS.outstanding}.\n\nIf you want a deeper cut, ask @finance for expense drivers or overdue invoices.`;
  }

  if (/(customer|client)/.test(q) && /(list|top|dormant|who)/.test(q)) {
    const lines = CUSTOMERS.map(
      (c) => `• ${c.name} — ${c.status}, last order ${c.lastOrder}, ${c.value}`
    ).join("\n");
    return `Here's a snapshot of key accounts:\n\n${lines}\n\n@sales can draft a win-back sequence for dormant accounts.`;
  }

  if (/(invoice|overdue|receivable|payment)/.test(q)) {
    const lines = INVOICES.map(
      (i) =>
        `• ${i.id} · ${i.customer} · ${i.amount} · ${i.status}${
          i.daysOverdue ? ` (${i.daysOverdue}d)` : ""
        }`
    ).join("\n");
    return `Receivables snapshot:\n\n${lines}\n\nHighest urgency: Sharma Industries on INV-1842.`;
  }

  if (/(inventory|stock|product x|mcb)/.test(q)) {
    return `@operations: Product X (MCB 32A) has ~5 days of cover at current burn. Raise a PO with Polycab this week to avoid contractor delays.`;
  }

  if (/(weather|news|stock market|cricket|joke)/.test(q)) {
    return `I can discuss that fully once a live LLM is connected (OpenRouter / Grok / Claude / OpenAI).\n\nRight now I'm in local demo mode with ${BUSINESS.name}'s business brain. Ask about customers, invoices, profit, inventory, or say:\n\n@ceo I want to increase profit by 20%…`;
  }

  if (/(write|draft|email|message|proposal|plan)/.test(q)) {
    return `Here's a tight draft you can edit:\n\nSubject: Quick follow-up from ${BUSINESS.name}\n\nHi — following up on our recent work together. We'd like to help you keep supply steady and pricing predictable this quarter. Are you open to a 15-minute check-in this week?\n\n— ${BUSINESS.owner}\n\nWant @sales or @finance to tailor this for a specific account?`;
  }

  if (/(how|what|why|explain|help|idea|suggest|advice|strategy)/.test(q)) {
    return `@${lead}: Based on ${BUSINESS.name}'s current picture — ${BUSINESS.monthlyRevenue}/mo, ${BUSINESS.outstanding} outstanding, and ${BRIEFING.length} live priorities — I'd focus on cash collection and dormant high-value customers first.\n\nAsk me anything specific (a customer, an invoice, a margin question, a campaign idea), or connect an LLM key for open-ended intelligence on any topic.`;
  }

  return `@${lead}: Got it — “${userText.trim()}”.\n\nIn demo mode I can dig into ${BUSINESS.name}'s customers, invoices, inventory, tasks, and growth plans. For broad world knowledge and deeper reasoning, add any of these to .env:\n\n• OPENROUTER_API_KEY (recommended — Claude, GPT, Grok, Gemini…)\n• XAI_API_KEY (Grok)\n• ANTHROPIC_API_KEY (Claude)\n• OPENAI_API_KEY\n\nThen restart the app.`;
}
