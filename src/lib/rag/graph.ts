/**
 * Light entity graph over company chunks (HippoRAG / GraphRAG lite).
 * Extracts vendor/policy-like entities for multi-hop hints — not a full KG.
 */

export type GraphNode = {
  id: string;
  label: string;
  kind: "vendor" | "policy" | "person" | "doc" | "other";
};

export type GraphEdge = {
  from: string;
  to: string;
  rel: string;
};

const VENDOR_RE =
  /\b(Acme Supplies(?: LLC)?|Bright Paper Co|CloudHost Inc|Contoso Retail|Fabrikam Events)\b/g;
const PERSON_RE = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;

export function buildLightGraph(
  chunks: { id: string; content: string; filename: string }[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const add = (n: GraphNode) => {
    if (!nodes.has(n.id)) nodes.set(n.id, n);
  };

  for (const chunk of chunks) {
    const docId = `doc:${chunk.filename}`;
    add({ id: docId, label: chunk.filename, kind: "doc" });

    const vendors = chunk.content.match(VENDOR_RE) || [];
    for (const v of vendors) {
      const id = `vendor:${v.toLowerCase()}`;
      add({ id, label: v, kind: "vendor" });
      edges.push({ from: docId, to: id, rel: "mentions" });
    }

    if (/policy|sop|standard/i.test(chunk.content)) {
      const id = `policy:${chunk.filename}`;
      add({ id, label: chunk.filename, kind: "policy" });
      edges.push({ from: docId, to: id, rel: "defines" });
    }

    const people = chunk.content.match(PERSON_RE) || [];
    for (const p of people.slice(0, 3)) {
      if (/Net |Due |Sheet /.test(p)) continue;
      const id = `person:${p.toLowerCase()}`;
      add({ id, label: p, kind: "person" });
      edges.push({ from: docId, to: id, rel: "names" });
    }
  }

  return { nodes: Array.from(nodes.values()), edges: edges.slice(0, 200) };
}

export function neighborsOf(
  graph: { nodes: GraphNode[]; edges: GraphEdge[] },
  label: string
): GraphNode[] {
  const needle = label.toLowerCase();
  const node = graph.nodes.find((n) => n.label.toLowerCase().includes(needle));
  if (!node) return [];
  const ids = new Set<string>();
  for (const e of graph.edges) {
    if (e.from === node.id) ids.add(e.to);
    if (e.to === node.id) ids.add(e.from);
  }
  return graph.nodes.filter((n) => ids.has(n.id));
}
