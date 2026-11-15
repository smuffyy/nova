import type { RetrievedChunk } from "@/lib/retrieve";
import { compressEvidence } from "./compress";
import { evaluateEvidence } from "./gate";
import { generateGroundedAnswer, refuseAnswer } from "./generate";
import type { Citation, EvidenceChunk } from "./types";

/**
 * Backward-compatible helper used by older call sites.
 * New code should call runRagPipeline({ surface: "chat", ... }).
 */
export async function answerWithCitations(
  query: string,
  chunks: RetrievedChunk[]
): Promise<{ answer: string; citations: Citation[] }> {
  const evidence: EvidenceChunk[] = chunks.map((c) => ({
    ...c,
    layer: "company" as const,
  }));

  const gate = evaluateEvidence(evidence);
  if (gate.band === "low" || gate.kept.length === 0) {
    const refused = refuseAnswer(gate.reason);
    return { answer: refused.answer, citations: refused.citations };
  }

  const compressed = compressEvidence(gate.kept);
  const { answer, citations } = await generateGroundedAnswer({
    surface: "chat",
    query,
    chunks: compressed,
    partial: gate.band === "medium",
  });
  return { answer, citations };
}
