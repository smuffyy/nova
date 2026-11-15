import type { MemoryLayer, RagSurface } from "./types";

/**
 * UniMS-style multi-source selection — which layers to query.
 */
export function selectMemoryLayers(input: {
  surface: RagSurface;
  query: string;
  includeCompany?: boolean;
}): MemoryLayer[] {
  const base =
    input.surface === "chat"
      ? (["company"] as MemoryLayer[])
      : input.surface === "sidekick"
        ? (["company", "personal"] as MemoryLayer[])
        : input.surface === "agent"
          ? (["company", "standards"] as MemoryLayer[])
          : input.surface === "digest"
            ? (["week", "company"] as MemoryLayer[])
            : (["company"] as MemoryLayer[]);

  if (input.includeCompany === false) {
    return base.filter((l) => l !== "company");
  }

  // Prefer standards-tagged chunks when agent asks about policy/SOP
  if (
    input.surface === "agent" &&
    /\b(policy|sop|standard|handbook)\b/i.test(input.query)
  ) {
    return ["standards", "company"];
  }

  return base;
}
