import type { MemoryLayer, RagSurface } from "./types";

/**
 * Surface → memory policy. Tenancy (workspace / user) is enforced at retrieve time.
 * Sidekick collab/meetup is a temporary context window — never merged indexes.
 */
const SURFACE_LAYERS: Record<RagSurface, MemoryLayer[]> = {
  chat: ["company"],
  sidekick: ["company", "personal"],
  agent: ["company", "standards"],
  digest: ["week", "company"],
  /** Shared company brain only by default — Sidekick Meet opts into personal via RagRequest.includePersonal */
  meetup: ["company"],
};

export function layersForSurface(surface: RagSurface): MemoryLayer[] {
  return SURFACE_LAYERS[surface];
}

export function assertRagAuth(input: {
  surface: RagSurface;
  workspaceId: string;
  userId?: string;
}): void {
  if (!input.workspaceId) {
    throw new Error("workspaceId required");
  }
  if (input.surface === "sidekick" && !input.userId) {
    throw new Error("userId required for sidekick");
  }
}

/** Personal layer is live for sidekick when userId is present. */
export function companyOnlyForNow(layers: MemoryLayer[]): MemoryLayer[] {
  return layers.filter((l) => l === "company" || l === "personal" || l === "standards");
}
