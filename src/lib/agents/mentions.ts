import { AGENTS, getAgentByName, type AgentDefinition } from "./catalog";

export type MentionParse = {
  /** Clean query without @mentions (for retrieval + LLM). */
  query: string;
  /** First matched agent, if any. */
  agent: AgentDefinition | null;
  /** All matched agent ids (multi-@ reserved; first wins for routing). */
  mentionedIds: string[];
};

/**
 * Parse @Agent mentions from chat text.
 * Supports @Moony, @moony, @"Path", and bare role @Billing → Moony.
 */
export function parseAgentMentions(raw: string): MentionParse {
  const mentioned: AgentDefinition[] = [];
  const seen = new Set<string>();

  const mentionRe = /@(?:"([A-Za-z]+)"|([A-Za-z]+))/g;
  let match: RegExpExecArray | null;
  while ((match = mentionRe.exec(raw)) !== null) {
    const token = (match[1] || match[2] || "").trim();
    const agent = getAgentByName(token);
    if (agent && !seen.has(agent.id)) {
      seen.add(agent.id);
      mentioned.push(agent);
    }
  }

  const query = raw
    .replace(/@(?:"[A-Za-z]+"|[A-Za-z]+)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    query: query || raw.trim(),
    agent: mentioned[0] || null,
    mentionedIds: mentioned.map((a) => a.id),
  };
}

export function agentMentionSuggestions(prefix: string): AgentDefinition[] {
  const p = prefix.replace(/^@/, "").toLowerCase();
  if (!p) return AGENTS;
  return AGENTS.filter(
    (a) =>
      a.name.toLowerCase().startsWith(p) ||
      a.id.startsWith(p) ||
      a.role.toLowerCase().startsWith(p)
  );
}
