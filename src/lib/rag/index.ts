export type {
  Citation,
  EvidenceChunk,
  GateBand,
  GateResult,
  MemoryLayer,
  RagRequest,
  RagResult,
  RagSurface,
} from "./types";

export { layersForSurface, assertRagAuth } from "./policy";
export { evaluateEvidence } from "./gate";
export { compressEvidence } from "./compress";
export { generateGroundedAnswer, refuseAnswer } from "./generate";
export { runRagPipeline } from "./pipeline";
export { askChat, askSidekick, askAgent, askDigest, askMeetup } from "./surfaces";
export { maybeRewriteQuery } from "./rewrite";
export { rerankChunks, diversifyBySource } from "./rerank";
export { shouldRetrieveCompany } from "./adaptive";
export { selectMemoryLayers } from "./unims";
export { buildLightGraph, neighborsOf } from "./graph";
export { listAgents, parseAgentMentions } from "@/lib/agents";

/** @deprecated Prefer runRagPipeline — kept for older imports. */
export { answerWithCitations } from "./legacy";
