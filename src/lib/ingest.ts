import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import {
  buildRaptorSummaries,
  chunkTabularRows,
  chunkText,
  type StructuredChunk,
} from "./chunk";
import { db } from "./db";
import { pgEnabled, upsertChunkPg } from "./db/pgvector";
import { embedTexts } from "./embeddings";
import { extractDocument } from "./extract";

export async function ingestSource(sourceId: string) {
  const source = db.getSource(sourceId);
  if (!source) return;

  db.updateSource(sourceId, { status: "processing", error_message: null });

  try {
    const absolute = path.isAbsolute(source.storage_path)
      ? source.storage_path
      : path.join(process.cwd(), source.storage_path);

    if (!fs.existsSync(absolute)) {
      throw new Error("File missing on disk");
    }

    const doc = await extractDocument(
      absolute,
      source.mime_type,
      source.filename
    );

    let structured: StructuredChunk[] = [];
    if (doc.rows && doc.rows.length > 0) {
      structured = chunkTabularRows(doc.rows, {
        filename: source.filename,
        sheet: doc.sheetName,
        docType: doc.docType,
      });
    } else {
      structured = chunkText(doc.text, {
        filename: source.filename,
        docType: doc.docType,
      });
    }

    if (structured.length >= 8) {
      structured = [...structured, ...buildRaptorSummaries(structured)];
    }

    if (structured.length === 0) {
      throw new Error("No text extracted from file");
    }

    const contents = structured.map((c) => c.content);
    const embeddings = await embedTexts(contents);
    const rows = structured.map((c, index) => ({
      id: uuid(),
      source_id: sourceId,
      workspace_id: source.workspace_id,
      chunk_index: index,
      content: c.content,
      embedding_json: embeddings?.[index]
        ? JSON.stringify(embeddings[index])
        : null,
      metadata_json: JSON.stringify(c.metadata),
    }));
    db.replaceChunks(sourceId, rows);

    if (pgEnabled()) {
      for (let i = 0; i < rows.length; i++) {
        await upsertChunkPg({
          id: rows[i].id,
          workspace_id: rows[i].workspace_id,
          source_id: rows[i].source_id,
          chunk_index: rows[i].chunk_index,
          content: rows[i].content,
          metadata_json: rows[i].metadata_json,
          embedding: embeddings?.[i] ?? null,
        });
      }
    }

    db.updateSource(sourceId, { status: "ready", error_message: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingest failed";
    db.updateSource(sourceId, { status: "error", error_message: message });
  }
}
