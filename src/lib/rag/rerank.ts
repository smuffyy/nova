import type { EvidenceChunk } from "./types";

/**
 * Lightweight rerank + diversify (RankRAG / G-RAG inspired).
 * Uses keyword overlap + score; optional LLM rerank when key present and n small.
 */

function tokenOverlap(query: string, content: string): number {
  const q = new Set(
    query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
  if (q.size === 0) return 0;
  const c = new Set(
    content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
  let hits = 0;
  for (const t of q) if (c.has(t)) hits += 1;
  return hits / q.size;
}

export function rerankChunks(
  query: string,
  chunks: EvidenceChunk[],
  opts: { limit?: number } = {}
): EvidenceChunk[] {
  const limit = opts.limit ?? chunks.length;
  const scored = chunks.map((c) => {
    const overlap = tokenOverlap(query, c.content);
    const metaBoost =
      c.content.toLowerCase().includes("summary covering") ? 0.05 : 0;
    return {
      ...c,
      score: c.score * 0.7 + overlap * 0.3 + metaBoost,
    };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Prefer distinct sources, then fill. */
export function diversifyBySource(
  chunks: EvidenceChunk[],
  opts: { limit?: number } = {}
): EvidenceChunk[] {
  const limit = opts.limit ?? 8;
  const seen = new Set<string>();
  const first: EvidenceChunk[] = [];
  const rest: EvidenceChunk[] = [];
  for (const c of chunks) {
    if (!seen.has(c.sourceId)) {
      seen.add(c.sourceId);
      first.push(c);
    } else {
      rest.push(c);
    }
  }
  return [...first, ...rest].slice(0, limit);
}
