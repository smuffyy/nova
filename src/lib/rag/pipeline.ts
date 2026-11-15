import { getAgentById } from "@/lib/agents";
import { retrieveHybridChunks } from "@/lib/retrieve";
import { shouldRetrieveCompany } from "./adaptive";
import { cacheGet, cacheKey, cacheSet } from "./cache";
import { compressEvidence } from "./compress";
import { evaluateEvidence } from "./gate";
import { generateGroundedAnswer, refuseAnswer } from "./generate";
import { assertRagAuth } from "./policy";
import { diversifyBySource, rerankChunks } from "./rerank";
import { maybeRewriteQuery } from "./rewrite";
import { selectMemoryLayers } from "./unims";
import type { EvidenceChunk, RagRequest, RagResult } from "./types";

/**
 * Sentry RAG pipeline:
 * auth → UniMS layers → optional rewrite → hybrid retrieve → rerank/diversify
 * → gate → compress → single LLM generate
 */
export async function runRagPipeline(req: RagRequest): Promise<RagResult> {
  assertRagAuth(req);

  const agent = req.agentId ? getAgentById(req.agentId) : null;
  const surface =
    req.surface === "meetup" ? "meetup" : agent ? "agent" : req.surface;

  const includeCompany = shouldRetrieveCompany({
    surface,
    query: req.query,
  });
  const layersUsed = selectMemoryLayers({
    surface,
    query: req.query,
    includeCompany,
  });

  // Sidekick Meet: intentional personal share for the posting user only
  if (
    req.includePersonal &&
    req.userId &&
    !layersUsed.includes("personal")
  ) {
    layersUsed.push("personal");
  }

  const includePersonal =
    layersUsed.includes("personal") && Boolean(req.userId);
  const topK = req.topK ?? 8;

  const { query: rewritten, rewritten: didRewrite } = await maybeRewriteQuery({
    query: req.query,
    surface,
  });

  const retrievalQuery = agent
    ? `${rewritten}\n${agent.topicHints.slice(0, 6).join(" ")}`
    : rewritten;

  const cacheId = cacheKey([
    "ret",
    req.workspaceId,
    req.userId,
    req.sidekickId || "",
    surface,
    retrievalQuery,
    topK,
  ]);
  let raw = cacheGet<EvidenceChunk[]>(cacheId);

  if (!raw) {
    if (!includeCompany && !includePersonal) {
      raw = [];
    } else {
      const hits = await retrieveHybridChunks({
        workspaceId: req.workspaceId,
        userId: req.userId || "",
        query: retrievalQuery,
        limit: Math.max(topK, 12),
        includePersonal,
        hierarchical: surface === "agent" || surface === "digest",
        sidekickId: includePersonal ? req.sidekickId : undefined,
      });
      raw = hits.map((c) => ({
        ...c,
        layer: c.layer,
      }));
    }
    cacheSet(cacheId, raw, 60_000);
  }

  const reranked = diversifyBySource(
    rerankChunks(retrievalQuery, raw, { limit: topK }),
    { limit: topK }
  );

  const gate = evaluateEvidence(reranked, { maxKeep: topK });
  const pills = req.knowledgePills || [];
  const skills = req.skillTokens || [];
  const hasPills = pills.length > 0;
  const hasSkills = skills.length > 0;
  const sidekickGeneral = req.surface === "sidekick";

  if (
    (gate.band === "low" || gate.kept.length === 0) &&
    !hasPills &&
    !hasSkills &&
    !sidekickGeneral
  ) {
    const refused = refuseAnswer(gate.reason, agent?.id);
    return {
      answer: refused.answer,
      citations: refused.citations,
      refused: true,
      surface,
      layersUsed,
      evidenceCount: 0,
      gateBand: "low",
      llmUsed: false,
      agentId: agent?.id,
      agentName: agent?.name,
      meta: { rewritten: didRewrite, rewriteQuery: rewritten },
    };
  }

  const compressed =
    gate.kept.length > 0
      ? compressEvidence(gate.kept, {
          maxChunks: gate.band === "medium" ? 3 : 6,
        })
      : [];

  const { answer, citations, llmUsed } = await generateGroundedAnswer({
    surface,
    query: req.query,
    chunks: compressed,
    partial:
      gate.band === "medium" ||
      ((hasPills || hasSkills || sidekickGeneral) && compressed.length === 0),
    agentId: agent?.id,
    conversationHistory: req.conversationHistory,
    knowledgePills: pills,
    skillTokens: skills,
    sidekickMeet: Boolean(req.includePersonal && req.surface === "meetup"),
  });

  return {
    answer,
    citations,
    refused: false,
    surface,
    layersUsed,
    evidenceCount: compressed.length,
    gateBand:
      compressed.length === 0 && (hasPills || hasSkills || sidekickGeneral)
        ? "medium"
        : gate.band,
    llmUsed,
    agentId: agent?.id,
    agentName: agent?.name,
    meta: { rewritten: didRewrite, rewriteQuery: rewritten },
  };
}
