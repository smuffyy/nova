import { db, type Source } from "./db";
import { cosineSimilarity, embedTexts } from "./embeddings";
import { cacheGet, cacheKey, cacheSet } from "./rag/cache";

export type RetrievedChunk = {
  id: string;
  content: string;
  score: number;
  sourceId: string;
  filename: string;
  chunkIndex: number;
  layer: "company" | "personal";
  metadata?: Record<string, unknown>;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function keywordScore(queryTokens: string[], content: string): number {
  const contentTokens = new Set(tokenize(content));
  if (contentTokens.size === 0 || queryTokens.length === 0) return 0;
  let hits = 0;
  for (const t of queryTokens) {
    if (contentTokens.has(t)) hits += 1;
  }
  const lower = content.toLowerCase();
  const phraseBoost =
    queryTokens.length > 1 && lower.includes(queryTokens.join(" ")) ? 0.35 : 0;
  return hits / queryTokens.length + phraseBoost;
}

function topicBoost(query: string, metadataJson: string | null): number {
  if (!metadataJson) return 0;
  try {
    const meta = JSON.parse(metadataJson) as { topic?: string };
    if (!meta.topic || meta.topic === "general") return 0;
    return query.toLowerCase().includes(meta.topic) ? 0.08 : 0;
  } catch {
    return 0;
  }
}

async function scoreRows(
  rows: {
    id: string;
    content: string;
    source_id: string;
    filename: string;
    chunk_index: number;
    embedding_json: string | null;
    metadata_json?: string | null;
    layer: "company" | "personal";
  }[],
  query: string,
  limit: number
): Promise<RetrievedChunk[]> {
  if (rows.length === 0) return [];
  const queryTokens = tokenize(query);

  const embCacheKey = cacheKey(["qemb", query]);
  let queryEmbedding = cacheGet<number[] | null>(embCacheKey);
  if (queryEmbedding === null || queryEmbedding === undefined) {
    queryEmbedding = (await embedTexts([query]))?.[0] ?? null;
    cacheSet(embCacheKey, queryEmbedding, 10 * 60_000);
  }

  // Tuned hybrid: slightly more keyword for IDs/vendor names (SAGE)
  const denseW = 0.68;
  const kwW = 0.32;

  const scored: RetrievedChunk[] = rows.map((row) => {
    const kw = keywordScore(queryTokens, row.content);
    let vector = 0;
    if (queryEmbedding && row.embedding_json) {
      try {
        const emb = JSON.parse(row.embedding_json) as number[];
        vector = cosineSimilarity(queryEmbedding, emb);
      } catch {
        vector = 0;
      }
    }
    const boost = topicBoost(query, row.metadata_json ?? null);
    const score = (queryEmbedding ? vector * denseW + kw * kwW : kw) + boost;
    let metadata: Record<string, unknown> | undefined;
    if (row.metadata_json) {
      try {
        metadata = JSON.parse(row.metadata_json) as Record<string, unknown>;
      } catch {
        metadata = undefined;
      }
    }
    return {
      id: row.id,
      content: row.content,
      score,
      sourceId: row.source_id,
      filename: row.filename,
      chunkIndex: row.chunk_index,
      layer: row.layer,
      metadata,
    };
  });

  return scored
    .filter((c) => c.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function retrieveChunks(
  workspaceId: string,
  query: string,
  limit = 6
): Promise<RetrievedChunk[]> {
  const rows = db.listReadyChunks(workspaceId);
  return scoreRows(rows, query, limit);
}

export async function retrievePersonalChunks(
  workspaceId: string,
  userId: string,
  query: string,
  limit = 6,
  sidekickId?: string
): Promise<RetrievedChunk[]> {
  const rows = db.listReadyPersonalChunks(workspaceId, userId, sidekickId);
  return scoreRows(rows, query, limit);
}

/** Hierarchical retrieve: prefer RAPTOR summaries first, then leaves. */
export async function retrieveHierarchical(
  workspaceId: string,
  query: string,
  limit = 8
): Promise<RetrievedChunk[]> {
  const all = await retrieveChunks(workspaceId, query, limit * 2);
  const summaries = all.filter(
    (c) => c.metadata && Number(c.metadata.raptorLevel) >= 1
  );
  const leaves = all.filter(
    (c) => !c.metadata || Number(c.metadata.raptorLevel || 0) === 0
  );
  return [...summaries.slice(0, Math.ceil(limit / 3)), ...leaves].slice(
    0,
    limit
  );
}

export async function retrieveHybridChunks(input: {
  workspaceId: string;
  userId: string;
  query: string;
  limit?: number;
  includePersonal?: boolean;
  hierarchical?: boolean;
  sidekickId?: string;
}): Promise<RetrievedChunk[]> {
  const limit = input.limit ?? 8;
  const company = input.hierarchical
    ? await retrieveHierarchical(input.workspaceId, input.query, limit)
    : await retrieveChunks(input.workspaceId, input.query, limit);
  if (!input.includePersonal) return company;
  const personal = await retrievePersonalChunks(
    input.workspaceId,
    input.userId,
    input.query,
    limit,
    input.sidekickId
  );
  return [...company, ...personal]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getWorkspaceSources(workspaceId: string): Source[] {
  return db.listSources(workspaceId);
}

export function getPersonalSources(
  workspaceId: string,
  userId: string,
  sidekickId?: string
): Source[] {
  return db.listPersonalSources(workspaceId, userId, sidekickId);
}
