export type ChunkMeta = {
  docType?: string;
  topic?: string;
  section?: string;
  sheet?: string;
  kind?: "body" | "row" | "summary" | "heading";
  /** RAPTOR level: 0 = leaf, 1+ = summaries */
  raptorLevel?: number;
};

export type StructuredChunk = {
  content: string;
  metadata: ChunkMeta;
};

const TOPIC_HINTS: { topic: string; re: RegExp }[] = [
  { topic: "billing", re: /invoice|billing|refund|payment|ar\b|receivable/i },
  { topic: "books", re: /vendor|expense|payable|ledger|cogs|finance|xlsx|csv/i },
  { topic: "shipping", re: /shipping|fulfillment|carrier|delivery|logistics/i },
  { topic: "it", re: /\bit\b|access|sso|vpn|deploy|security|onboarding/i },
  { topic: "people", re: /onboarding|hire|handbook|hr\b|employee/i },
  { topic: "standards", re: /policy|sop|standard|procedure|guideline/i },
];

export function inferTopic(filename: string, sample: string): string {
  const blob = `${filename}\n${sample.slice(0, 1200)}`;
  for (const h of TOPIC_HINTS) {
    if (h.re.test(blob)) return h.topic;
  }
  return "general";
}

/** Paragraph / heading–aware text chunking with metadata. */
export function chunkText(
  text: string,
  opts: {
    size?: number;
    overlap?: number;
    filename?: string;
    docType?: string;
  } = {}
): StructuredChunk[] {
  const size = opts.size ?? 900;
  const overlap = opts.overlap ?? 120;
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();
  if (!cleaned) return [];

  const topic = inferTopic(opts.filename || "", cleaned);
  const paragraphs = cleaned.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: StructuredChunk[] = [];
  let current = "";
  let section = "body";

  const push = () => {
    if (!current.trim()) return;
    chunks.push({
      content: current.trim(),
      metadata: {
        docType: opts.docType,
        topic,
        section,
        kind: "body",
        raptorLevel: 0,
      },
    });
    current = "";
  };

  for (const para of paragraphs) {
    if (/^#{1,3}\s+\S/.test(para) || /^[A-Z][A-Za-z0-9 /&-]{3,60}$/.test(para)) {
      if (current) push();
      section = para.replace(/^#+\s*/, "").slice(0, 80);
    }
    if ((current + "\n\n" + para).length <= size) {
      current = current ? `${current}\n\n${para}` : para;
      continue;
    }
    if (current) push();
    if (para.length <= size) {
      current = para;
      continue;
    }
    for (let i = 0; i < para.length; i += size - overlap) {
      const slice = para.slice(i, i + size).trim();
      if (!slice) continue;
      chunks.push({
        content: slice,
        metadata: {
          docType: opts.docType,
          topic,
          section,
          kind: "body",
          raptorLevel: 0,
        },
      });
    }
  }
  push();
  return chunks;
}

/** Row-aware chunks for CSV / Excel. */
export function chunkTabularRows(
  rows: Record<string, string>[],
  opts: { filename?: string; sheet?: string; docType?: string; groupSize?: number } = {}
): StructuredChunk[] {
  if (!rows.length) return [];
  const groupSize = opts.groupSize ?? 8;
  const topic = inferTopic(opts.filename || "", JSON.stringify(rows[0]));
  const headers = Object.keys(rows[0]);
  const out: StructuredChunk[] = [];

  for (let i = 0; i < rows.length; i += groupSize) {
    const group = rows.slice(i, i + groupSize);
    const lines = group.map((row, j) => {
      const fields = headers
        .map((h) => `${h}: ${row[h] || ""}`)
        .filter((x) => !x.endsWith(": "));
      return `Row ${i + j + 1} — ${fields.join("; ")}`;
    });
    out.push({
      content: [
        opts.sheet ? `Sheet ${opts.sheet}` : "Table",
        `File ${opts.filename || "data"}`,
        ...lines,
      ].join("\n"),
      metadata: {
        docType: opts.docType || "csv",
        topic,
        sheet: opts.sheet,
        section: opts.sheet || "table",
        kind: "row",
        raptorLevel: 0,
      },
    });
  }
  return out;
}

/** Build RAPTOR-style summary chunks from leaf chunks (simple concatenate+summarize stubs). */
export function buildRaptorSummaries(
  leaves: StructuredChunk[],
  opts: { groupSize?: number } = {}
): StructuredChunk[] {
  const groupSize = opts.groupSize ?? 4;
  if (leaves.length < groupSize) return [];
  const summaries: StructuredChunk[] = [];
  for (let i = 0; i < leaves.length; i += groupSize) {
    const group = leaves.slice(i, i + groupSize);
    const topic = group[0]?.metadata.topic || "general";
    const joined = group.map((c) => c.content).join("\n---\n");
    const summary =
      joined.length <= 700
        ? `Summary: ${joined}`
        : `Summary covering ${group.length} sections:\n${joined.slice(0, 650)}…`;
    summaries.push({
      content: summary,
      metadata: {
        ...group[0].metadata,
        kind: "summary",
        raptorLevel: 1,
        topic,
        section: `summary-${Math.floor(i / groupSize) + 1}`,
      },
    });
  }
  return summaries;
}

/** Back-compat: plain string array */
export function chunkTextPlain(
  text: string,
  opts: { size?: number; overlap?: number } = {}
): string[] {
  return chunkText(text, opts).map((c) => c.content);
}
