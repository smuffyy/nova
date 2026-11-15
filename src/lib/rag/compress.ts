import type { EvidenceChunk } from "./types";

/**
 * Compress retrieved evidence before the LLM call (RECOMP / FILCO inspired).
 * - Prefer distinct sources
 * - Cap total chars so generation stays cheap and focused
 */
export function compressEvidence(
  chunks: EvidenceChunk[],
  opts: { maxChunks?: number; maxCharsPerChunk?: number; maxTotalChars?: number } = {}
): EvidenceChunk[] {
  const maxChunks = opts.maxChunks ?? 6;
  const maxCharsPerChunk = opts.maxCharsPerChunk ?? 900;
  const maxTotalChars = opts.maxTotalChars ?? 4200;

  const seenSources = new Set<string>();
  const diversified: EvidenceChunk[] = [];

  // First pass: one chunk per source (highest score already sorted)
  for (const chunk of chunks) {
    if (diversified.length >= maxChunks) break;
    if (seenSources.has(chunk.sourceId)) continue;
    seenSources.add(chunk.sourceId);
    diversified.push(trimChunk(chunk, maxCharsPerChunk));
  }

  // Second pass: fill remaining slots from unused chunks
  for (const chunk of chunks) {
    if (diversified.length >= maxChunks) break;
    if (diversified.some((c) => c.id === chunk.id)) continue;
    diversified.push(trimChunk(chunk, maxCharsPerChunk));
  }

  const out: EvidenceChunk[] = [];
  let total = 0;
  for (const chunk of diversified) {
    if (total >= maxTotalChars) break;
    const room = maxTotalChars - total;
    const content =
      chunk.content.length > room
        ? `${chunk.content.slice(0, Math.max(0, room - 1)).trim()}…`
        : chunk.content;
    out.push({ ...chunk, content });
    total += content.length;
  }
  return out;
}

function trimChunk(chunk: EvidenceChunk, maxChars: number): EvidenceChunk {
  const cleaned = chunk.content.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxChars) {
    return { ...chunk, content: cleaned };
  }
  return {
    ...chunk,
    content: `${cleaned.slice(0, maxChars - 1).trim()}…`,
  };
}
