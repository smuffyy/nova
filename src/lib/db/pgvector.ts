/**
 * Optional Postgres + pgvector backend.
 * When DATABASE_URL is unset, JSON store remains the source of truth.
 *
 * Schema (apply manually when enabling):
 *   CREATE EXTENSION IF NOT EXISTS vector;
 *   CREATE TABLE portal_chunks (
 *     id text PRIMARY KEY,
 *     workspace_id text NOT NULL,
 *     source_id text NOT NULL,
 *     chunk_index int NOT NULL,
 *     content text NOT NULL,
 *     metadata_json text,
 *     embedding vector(1536)
 *   );
 *   CREATE INDEX ON portal_chunks USING ivfflat (embedding vector_cosine_ops);
 */

import type { Pool } from "pg";

let pool: Pool | null = null;

export function pgEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getPgPool(): Promise<Pool | null> {
  if (!pgEnabled()) return null;
  if (pool) return pool;
  const pg = await import("pg");
  const PoolCtor = pg.Pool || (pg as { default?: { Pool: typeof Pool } }).default?.Pool;
  if (!PoolCtor) return null;
  pool = new PoolCtor({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export async function upsertChunkPg(row: {
  id: string;
  workspace_id: string;
  source_id: string;
  chunk_index: number;
  content: string;
  metadata_json: string | null;
  embedding: number[] | null;
}) {
  const p = await getPgPool();
  if (!p) return;
  const emb =
    row.embedding && row.embedding.length
      ? `[${row.embedding.join(",")}]`
      : null;
  await p.query(
    `INSERT INTO portal_chunks (id, workspace_id, source_id, chunk_index, content, metadata_json, embedding)
     VALUES ($1,$2,$3,$4,$5,$6,$7::vector)
     ON CONFLICT (id) DO UPDATE SET
       content = EXCLUDED.content,
       metadata_json = EXCLUDED.metadata_json,
       embedding = EXCLUDED.embedding`,
    [
      row.id,
      row.workspace_id,
      row.source_id,
      row.chunk_index,
      row.content,
      row.metadata_json,
      emb,
    ]
  );
}

export async function searchChunksPg(input: {
  workspaceId: string;
  embedding: number[];
  limit?: number;
}): Promise<
  { id: string; content: string; source_id: string; score: number }[]
> {
  const p = await getPgPool();
  if (!p) return [];
  const emb = `[${input.embedding.join(",")}]`;
  const limit = input.limit ?? 8;
  const res = await p.query(
    `SELECT id, content, source_id,
            1 - (embedding <=> $1::vector) AS score
     FROM portal_chunks
     WHERE workspace_id = $2 AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [emb, input.workspaceId, limit]
  );
  return res.rows.map((r) => ({
    id: r.id,
    content: r.content,
    source_id: r.source_id,
    score: Number(r.score) || 0,
  }));
}
