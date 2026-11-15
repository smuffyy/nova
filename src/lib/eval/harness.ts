import type { Citation } from "@/lib/rag/types";
import { runRagPipeline } from "@/lib/rag/pipeline";

/**
 * Pilot eval harness — RGB axes + specificity checks.
 * Run: npx tsx scripts/eval-rag.ts  (or node via compiled)
 */

export type EvalCase = {
  id: string;
  query: string;
  /** Exact strings that should appear when answerable */
  mustInclude?: string[];
  /** If true, expect refusal / weak evidence */
  expectRefuse?: boolean;
  workspaceId: string;
  userId?: string;
};

export type EvalScore = {
  id: string;
  query?: string;
  passed: boolean;
  refused: boolean;
  gateBand?: string;
  faithfulnessProxy: number;
  specificityHits: number;
  specificityNeeded: number;
  notes: string[];
  answerPreview?: string;
};

function citationCoverage(answer: string, citations: Citation[]): number {
  if (citations.length === 0) {
    // Refusals without citations are fine; answered claims without markers score low
    return 0;
  }
  const markers = (answer.match(/\[\d+\]/g) || []).length;
  if (markers === 0) return 0;
  return Math.min(1, markers / Math.max(1, Math.min(citations.length, 3)));
}

export async function runEvalCase(c: EvalCase): Promise<EvalScore> {
  const result = await runRagPipeline({
    surface: "chat",
    workspaceId: c.workspaceId,
    userId: c.userId,
    query: c.query,
    topK: 8,
  });

  const notes: string[] = [];
  let specificityHits = 0;
  const needed = c.mustInclude?.length || 0;
  for (const needle of c.mustInclude || []) {
    if (result.answer.toLowerCase().includes(needle.toLowerCase())) {
      specificityHits += 1;
    } else {
      notes.push(`missing: ${needle}`);
    }
  }

  const faithfulnessProxy = c.expectRefuse
    ? result.refused
      ? 1
      : 0
    : citationCoverage(result.answer, result.citations);

  if (!c.expectRefuse && faithfulnessProxy < 0.34) {
    notes.push("weak citations");
  }

  let passed = true;
  if (c.expectRefuse) {
    passed = result.refused || result.gateBand === "low";
    if (!passed) notes.push("expected refusal");
  } else {
    if (result.refused) {
      passed = false;
      notes.push("unexpected refusal");
    }
    if (needed > 0 && specificityHits < needed) passed = false;
  }

  return {
    id: c.id,
    query: c.query,
    passed,
    refused: result.refused,
    gateBand: result.gateBand,
    faithfulnessProxy,
    specificityHits,
    specificityNeeded: needed,
    notes,
    answerPreview: result.answer.slice(0, 220),
  };
}

export async function runEvalSuite(cases: EvalCase[]) {
  const scores: EvalScore[] = [];
  for (const c of cases) {
    scores.push(await runEvalCase(c));
  }
  const passed = scores.filter((s) => s.passed).length;
  return {
    total: scores.length,
    passed,
    failed: scores.length - passed,
    avgFaithfulness:
      scores.reduce((a, s) => a + s.faithfulnessProxy, 0) /
      Math.max(1, scores.length),
    scores,
  };
}
