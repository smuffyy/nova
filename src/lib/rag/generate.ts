import { getAgentById } from "@/lib/agents";
import type { Citation, EvidenceChunk, RagSurface } from "./types";

const SURFACE_VOICE: Record<RagSurface, string> = {
  chat: "You are Sentry Chat — the company's shared institutional memory.",
  sidekick:
    "You are a Sentry Sidekick — a personal companion that may use company memory plus this user's personal context.",
  agent:
    "You are a Sentry Agent drafting domain work inside published company standards. Propose; do not claim silent write-backs.",
  digest:
    "You are Sentry Digest — summarize the week's pulse with citations; do not invent meetings or mail.",
  meetup:
    "You are in a Sentry Meetup Room — multiple teammates share one grounded company context. Facilitate clarity, cite sources, propose next owners. Never merge personal Sidekick memory. Never claim you sent messages or wrote systems back.",
};

const SIDEKICK_MEET_VOICE =
  "You are in a Sentry Sidekick Meet — teammates intentionally share selected personal Sidekick shelves for this room only, plus company memory. Cite sources; mark personal vs company when relevant. Never claim silent write-backs or that personal indexes were permanently merged.";

/**
 * LLM-tied answer: specific (exact sourced values) + informative (actionable context).
 * Extractive path is degrade-only when OPENAI_API_KEY is missing or the API fails.
 */
export async function generateGroundedAnswer(input: {
  surface: RagSurface;
  query: string;
  chunks: EvidenceChunk[];
  partial: boolean;
  agentId?: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  knowledgePills?: { title: string; body: string; bullets: string[] }[];
  skillTokens?: {
    name: string;
    topic: string;
    body: string;
    bullets: string[];
    proficiency: number;
    active?: boolean;
  }[];
  /** Intentional Sidekick Meet personal share */
  sidekickMeet?: boolean;
}): Promise<{ answer: string; citations: Citation[]; llmUsed: boolean }> {
  const citations = toCitations(input.chunks);
  const llm = await llmAnswer(input);
  if (llm) {
    return { answer: llm, citations, llmUsed: true };
  }
  return {
    answer: extractiveAnswer(
      input.query,
      input.chunks,
      input.partial,
      input.agentId,
      input.knowledgePills,
      input.skillTokens
    ),
    citations,
    llmUsed: false,
  };
}

export function refuseAnswer(
  reason: string,
  agentId?: string
): {
  answer: string;
  citations: Citation[];
  llmUsed: boolean;
  refused: true;
} {
  const agent = agentId ? getAgentById(agentId) : null;
  const who = agent ? `${agent.name}` : "Sentry";
  return {
    answer: `${who} doesn’t have enough grounded evidence yet. ${reason} Upload a relevant policy, SOP, or CSV export and ask again.`,
    citations: [],
    llmUsed: false,
    refused: true,
  };
}

function toCitations(chunks: EvidenceChunk[]): Citation[] {
  return chunks.map((c) => ({
    sourceId: c.sourceId,
    filename: c.filename,
    chunkId: c.id,
    snippet: c.content.replace(/\s+/g, " ").trim().slice(0, 240),
  }));
}

function voiceFor(
  surface: RagSurface,
  agentId?: string,
  sidekickMeet?: boolean
): string {
  if (agentId) {
    const agent = getAgentById(agentId);
    if (agent) {
      const meetupNote =
        surface === "meetup"
          ? sidekickMeet
            ? "\nYou are speaking inside a Sidekick Meet — intentional personal share for this room plus company context. Be concise; propose next owners; do not claim messages were sent or indexes permanently merged."
            : "\nYou are speaking inside a Meetup Room with multiple teammates sharing company context. Be concise; propose next owners; do not claim messages were sent."
          : "";
      return `${agent.systemPrompt}${meetupNote}`;
    }
  }
  if (surface === "meetup" && sidekickMeet) return SIDEKICK_MEET_VOICE;
  return SURFACE_VOICE[surface];
}

async function llmAnswer(input: {
  surface: RagSurface;
  query: string;
  chunks: EvidenceChunk[];
  partial: boolean;
  agentId?: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  knowledgePills?: { title: string; body: string; bullets: string[] }[];
  skillTokens?: {
    name: string;
    topic: string;
    body: string;
    bullets: string[];
    proficiency: number;
    active?: boolean;
  }[];
  sidekickMeet?: boolean;
}): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const context = input.chunks
    .map(
      (c, i) =>
        `[${i + 1}] source=${c.filename} chunk=${c.id}\n${c.content}`
    )
    .join("\n\n---\n\n");

  const partialNote = input.partial
    ? "Evidence is partial. Answer only what is supported; explicitly list gaps."
    : "Evidence looks sufficient for a direct answer if present in context.";

  const agent = input.agentId ? getAgentById(input.agentId) : null;
  const capabilityLine = agent
    ? `Capabilities in scope: ${agent.capabilities.join("; ")}.`
    : "";

  const historyBlock =
    input.conversationHistory && input.conversationHistory.length > 0
      ? `\n\nPrior conversation (continuity + pronouns only — NOT citable company facts; never invent from chat memory):\n${input.conversationHistory
          .map(
            (t) =>
              `${t.role === "user" ? "User" : "Assistant"}: ${t.content.slice(0, 1200)}`
          )
          .join("\n")}`
      : "";

  const pills = input.knowledgePills || [];
  const pillsBlock =
    pills.length > 0
      ? `\n\nKnowledge pills (shared prior context / similarities N — established for this thread; NOT Library citations; do not invent beyond them; when answering, prefer focusing on the delta K vs repeating N):\n${pills
          .map((p) => {
            const bullets =
              p.bullets.length > 0
                ? `\n${p.bullets.map((b) => `- ${b}`).join("\n")}`
                : "";
            return `### ${p.title}\n${p.body}${bullets}`;
          })
          .join("\n\n")}`
      : "";

  const skills = input.skillTokens || [];
  const skillsBlock =
    skills.length > 0
      ? `\n\nEquipped skill tokens (personal SME lanes — deepen answers when relevant; still answer general questions outside these lanes):\n${skills
          .map((s) => {
            const focus = s.active ? " [ACTIVE — now working]" : "";
            const level =
              s.proficiency >= 3
                ? "SME"
                : s.proficiency === 2
                  ? "Working"
                  : "Emerging";
            const bullets =
              s.bullets.length > 0
                ? `\n${s.bullets.map((b) => `- ${b}`).join("\n")}`
                : "";
            return `### ${s.name}${focus}\nTopic: ${s.topic} · ${level}\n${s.body}${bullets}`;
          })
          .join("\n\n")}`
      : "";

  const sidekickGeneral =
    input.surface === "sidekick"
      ? "\nYou are a personal Sidekick: answer general questions helpfully. When equipped skills are active/relevant, lean into that SME craft. Do not refuse ordinary questions just because Library evidence is thin — use skills + personal shelf + honest uncertainty."
      : "";

  const system = `${voiceFor(input.surface, input.agentId, input.sidekickMeet)}

${capabilityLine}
${sidekickGeneral}

Answer using provided Library context (cite with [n]), knowledge pills, and/or skill tokens.
Never invent vendors, amounts, dates, people, policies, or procedures beyond those sources and skills.
Agents propose drafts and next steps — never claim you already wrote back to email, billing, shipping, or IT systems.
Use prior conversation only to resolve references (e.g. "that vendor", "as above").
Knowledge pills are compressed shared project context — treat them as established similarities; emphasize what is new or different for this question.
Skill tokens are personal proficiency — prefer active tokens when the question matches; still help on unrelated general asks.

Answer quality contract:
1. SPECIFIC — use exact names, numbers, dates, owners, and clauses from the sources/skills.
2. SCANNABLE — open with one short paragraph that answers directly. Then use bullet points for lists, steps, owners, amounts, dates, or options. Use another short paragraph only when you need a wrap-up or caveat. Prefer bullets over long walls of prose.
3. CITE LIBRARY FACTS — put [1], [2], … immediately after each factual claim from Library context. Pill/skill-only claims do not need [n] markers.
4. NOT A DUMP — synthesize for an operator; do not paste raw chunk walls. Keep bullets to one idea each (about 1–2 lines).
5. NOT VAGUE — no generic advice ("companies usually…"). If the answer is not in Library context, pills, or skills, say you don't know and suggest what to upload or which skill to grow.
6. ${partialNote}

Format example (adapt to the question):
Lead sentence with the answer [1].

- Key detail [1]
- Next detail [2]

Short wrap-up only if needed.

Be concise and operational. Do not repeat your name — the app shows it.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Context:\n${context || "(no chunks)"}${pillsBlock}${skillsBlock}${historyBlock}\n\nQuestion: ${input.query}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("LLM error", await res.text());
    return null;
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || null;
}

function extractiveAnswer(
  query: string,
  chunks: EvidenceChunk[],
  partial: boolean,
  agentId?: string,
  knowledgePills?: { title: string; body: string; bullets: string[] }[],
  skillTokens?: {
    name: string;
    topic: string;
    body: string;
    bullets: string[];
    proficiency: number;
    active?: boolean;
  }[]
): string {
  const pills = knowledgePills || [];
  const skills = skillTokens || [];
  if (chunks.length === 0 && pills.length === 0 && skills.length === 0) {
    return "I don’t know based on what’s trained yet. Upload a relevant doc and ask again.";
  }

  if (chunks.length === 0 && pills.length === 0 && skills.length > 0) {
    const active = skills.find((s) => s.active) || skills[0];
    const lines = [
      `Using skill token “${active.name}” (${active.topic}): ${active.body}`,
      "",
      ...active.bullets.slice(0, 6).map((b) => `- ${b}`),
      "",
      "General questions are still welcome — equip more skill tokens or upload shelf docs to deepen answers.",
    ];
    return lines.join("\n").trim();
  }

  if (chunks.length === 0 && pills.length > 0) {
    const p = pills[0];
    const lines = [
      `From attached pill “${p.title}”: ${p.body}`,
      "",
      ...p.bullets.slice(0, 6).map((b) => `- ${b}`),
      "",
      "Library citations unavailable — this answer used knowledge pills only. Upload docs or ask about the delta for this project.",
    ];
    return lines.join("\n").trim();
  }

  const top = chunks[0];
  const snippet = top.content.replace(/\s+/g, " ").trim().slice(0, 320);
  const lead =
    snippet.endsWith(".") || snippet.endsWith("?") || snippet.endsWith("!")
      ? snippet
      : `${snippet}…`;

  const lines = [`${lead} [1]`];

  if (chunks.length > 1) {
    lines.push("");
    lines.push("- Also relevant from another source [2]");
    const second = chunks[1].content.replace(/\s+/g, " ").trim().slice(0, 180);
    lines.push(`- ${second}…`);
  }

  if (pills.length > 0) {
    lines.push(
      "",
      `Also considering pill “${pills[0].title}” for shared prior context.`
    );
  }

  if (skills.length > 0) {
    const active = skills.find((s) => s.active) || skills[0];
    lines.push("", `Skill lens: “${active.name}” (${active.topic}).`);
  }

  if (partial) {
    lines.push("", "This looks partial — double-check before you act.");
  }
  if (agentId) {
    const agent = getAgentById(agentId);
    if (agent) {
      lines.push(
        "",
        `${agent.name} can propose next steps — nothing is sent until you approve.`
      );
    }
  }
  void query;
  return lines.join("\n").trim();
}
