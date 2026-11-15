import type { EvidenceChunk, GateBand, GateResult } from "./types";

/** Score bands — tuned for hybrid cosine+keyword in retrieve.ts */
const HIGH = 0.38;
const MEDIUM = 0.1;

function bandFor(score: number): GateBand {
  if (score >= HIGH) return "high";
  if (score >= MEDIUM) return "medium";
  return "low";
}

/**
 * CRAG-inspired relevance gate: decide whether to call the LLM.
 * low  → refuse (no generation spend)
 * medium → keep fewer, higher-scoring chunks
 * high → keep fuller evidence set
 */
export function evaluateEvidence(
  chunks: EvidenceChunk[],
  opts: { maxKeep?: number } = {}
): GateResult {
  const maxKeep = opts.maxKeep ?? 6;
  if (chunks.length === 0) {
    return {
      band: "low",
      maxScore: 0,
      kept: [],
      reason: "No indexed sources matched this workspace query.",
    };
  }

  const maxScore = chunks[0]?.score ?? 0;
  const band = bandFor(maxScore);

  if (band === "low") {
    return {
      band,
      maxScore,
      kept: [],
      reason:
        "Retrieved evidence is too weak to answer safely. Upload a relevant policy, SOP, or export.",
    };
  }

  const limit = band === "medium" ? Math.min(3, maxKeep) : maxKeep;
  const kept = chunks.filter((c) => c.score >= MEDIUM).slice(0, limit);

  if (kept.length === 0) {
    return {
      band: "low",
      maxScore,
      kept: [],
      reason: "No chunk cleared the relevance floor.",
    };
  }

  return {
    band,
    maxScore,
    kept,
    reason:
      band === "high"
        ? "Strong evidence — generate grounded answer."
        : "Partial evidence — generate only what sources support.",
  };
}
