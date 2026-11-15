import { NextResponse } from "next/server";
import { parseMentions, runOrchestrator } from "@/lib/nova/orchestrator";
import {
  callNovaLlm,
  resolveLlm,
  smartMockAnswer,
  type ChatTurn,
} from "@/lib/nova/llm";
import type { AgentHandle, ChatMessage } from "@/types/nova";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  message: string;
  history?: ChatTurn[];
  forceDemo?: boolean;
};

function uid() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isWowDemo(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    (lower.includes("20%") && lower.includes("profit")) ||
    (lower.includes("profit") && lower.includes("figure out")) ||
    (lower.includes("profit") &&
      (lower.includes("drop") || lower.includes("down") || lower.includes("decreas"))) ||
    lower.includes("dormant") ||
    (lower.includes("sharma") && lower.includes("payment"))
  );
}

export async function GET() {
  const cfg = resolveLlm();
  const caps =
    cfg.provider === "xai"
      ? ["chat", "reasoning", "web_search", "x_search", "code", "tools"]
      : cfg.provider === "openrouter"
        ? ["chat", "multi_model", "tools"]
        : cfg.provider === "anthropic"
          ? ["chat", "reasoning", "writing"]
          : cfg.provider === "openai" || cfg.provider === "compatible"
            ? ["chat", "tools"]
            : ["demo", "business_data"];

  return NextResponse.json({
    provider: cfg.provider,
    model: cfg.model,
    label: cfg.label,
    connected: cfg.provider !== "mock",
    capabilities: caps,
    howToConnect: {
      openrouter: "OPENROUTER_API_KEY + optional OPENROUTER_MODEL",
      grok: "XAI_API_KEY + optional XAI_MODEL",
      claude: "ANTHROPIC_API_KEY + optional ANTHROPIC_MODEL",
      openai: "OPENAI_API_KEY + optional OPENAI_MODEL",
      compatible: "NOVA_LLM_API_KEY + NOVA_LLM_BASE_URL + NOVA_LLM_MODEL",
      force: "NOVA_LLM_PROVIDER=openrouter|xai|anthropic|openai|compatible",
    },
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const message = (body.message || "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const mentions = parseMentions(message);
  const cfg = resolveLlm();

  // Animated multi-agent wow demos (optional)
  if (body.forceDemo || (cfg.provider === "mock" && isWowDemo(message))) {
    const demo = await runOrchestrator(message);
    return NextResponse.json({
      provider: cfg.provider,
      model: cfg.provider === "mock" ? "demo" : cfg.model,
      label: cfg.label,
      toolsUsed: [],
      mode: "demo",
      messages: demo,
    });
  }

  // Prefer real LLM for everything else
  if (cfg.provider !== "mock") {
    try {
      const history = (body.history || []).slice(-20);
      const result = await callNovaLlm({
        messages: [...history, { role: "user", content: message }],
        mentions,
      });

      if (result?.text) {
        const agent: AgentHandle | "nova" = mentions[0] || "nova";
        const messages: ChatMessage[] = [];

        if (result.toolsUsed.length) {
          messages.push({
            id: uid(),
            role: "assistant",
            agent: "nova",
            content: "",
            blocks: [
              {
                type: "activity",
                steps: result.toolsUsed.map((t) => ({
                  agent: (mentions[0] || "research") as AgentHandle,
                  label:
                    t === "web_search"
                      ? "Searching the live web…"
                      : t === "x_search"
                        ? "Searching X…"
                        : t === "code_interpreter"
                          ? "Running code…"
                          : `Using ${t}…`,
                  status: "done" as const,
                })),
              },
            ],
            createdAt: new Date().toISOString(),
          });
        }

        messages.push({
          id: uid(),
          role: "assistant",
          agent,
          content: result.text,
          createdAt: new Date().toISOString(),
        });

        return NextResponse.json({
          provider: result.provider,
          model: result.model,
          label: result.label,
          toolsUsed: result.toolsUsed,
          mode: "llm",
          messages,
        });
      }
    } catch (err) {
      return NextResponse.json(
        {
          error: err instanceof Error ? err.message : "LLM request failed",
          provider: cfg.provider,
          label: cfg.label,
        },
        { status: 502 }
      );
    }
  }

  // Smarter offline answers
  if (isWowDemo(message)) {
    const demo = await runOrchestrator(message);
    return NextResponse.json({
      provider: "mock",
      model: "demo",
      label: "Demo",
      toolsUsed: [],
      mode: "demo",
      messages: demo,
    });
  }

  const agent: AgentHandle | "nova" = mentions[0] || "nova";
  return NextResponse.json({
    provider: "mock",
    model: "local",
    label: "Demo",
    toolsUsed: [],
    mode: "local",
    messages: [
      {
        id: uid(),
        role: "assistant",
        agent,
        content: smartMockAnswer(message, mentions),
        createdAt: new Date().toISOString(),
      },
    ] satisfies ChatMessage[],
  });
}
