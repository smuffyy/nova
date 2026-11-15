/**
 * PORTAL RAG contracts — one retrieval core, many surfaces.
 * Company facts: cite or refuse. Answers: LLM-tied, specific + informative.
 */

export type RagSurface = "chat" | "sidekick" | "agent" | "digest" | "meetup";

/** Which memory index a query may read. */
export type MemoryLayer = "company" | "personal" | "standards" | "week";

export type Citation = {
  sourceId: string;
  filename: string;
  chunkId: string;
  snippet: string;
};

export type EvidenceChunk = {
  id: string;
  content: string;
  score: number;
  sourceId: string;
  filename: string;
  chunkIndex: number;
  layer?: MemoryLayer;
  metadata?: Record<string, unknown>;
};

export type GateBand = "high" | "medium" | "low";

export type GateResult = {
  band: GateBand;
  maxScore: number;
  kept: EvidenceChunk[];
  reason: string;
};

export type RagRequest = {
  surface: RagSurface;
  workspaceId: string;
  /** Required for personal layer (Sidekick). */
  userId?: string;
  /** Which personal Sidekick shelf to retrieve from (sidekick surface). */
  sidekickId?: string;
  /**
   * Force personal layer (Sidekick Meet). Company Meetups stay company-only
   * unless this is set with a sidekickId.
   */
  includePersonal?: boolean;
  /** Agent id when surface === "agent" (e.g. moony, path). */
  agentId?: string;
  query: string;
  /** Hybrid retrieve limit before gate/compress. Default 8. */
  topK?: number;
  /** Prior turns (this chat + imported chats), oldest→newest. Continuity only. */
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  /**
   * Attached knowledge pills — compressed shared prior (N).
   * Not company citations; use so the model can focus on the delta (K).
   */
  knowledgePills?: { title: string; body: string; bullets: string[] }[];
  /**
   * Sidekick skill tokens — personal SME lanes.
   * Active ones are “now working”; still answer general questions.
   */
  skillTokens?: {
    name: string;
    topic: string;
    body: string;
    bullets: string[];
    proficiency: number;
    active?: boolean;
  }[];
};

export type RagResult = {
  answer: string;
  citations: Citation[];
  refused: boolean;
  surface: RagSurface;
  layersUsed: MemoryLayer[];
  evidenceCount: number;
  gateBand: GateBand;
  /** True when OpenAI generated; false for extractive/refuse fallback. */
  llmUsed: boolean;
  agentId?: string;
  agentName?: string;
  meta?: { rewritten?: boolean; rewriteQuery?: string };
};
