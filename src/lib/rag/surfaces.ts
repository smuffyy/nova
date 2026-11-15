import { runRagPipeline } from "./pipeline";
import type { RagResult } from "./types";

/** Thin surface entrypoints — same core, different policy. */

export function askChat(input: {
  workspaceId: string;
  userId: string;
  query: string;
}): Promise<RagResult> {
  return runRagPipeline({
    surface: "chat",
    workspaceId: input.workspaceId,
    userId: input.userId,
    query: input.query,
  });
}

/** Phase 3: personal index. Today falls through to company-only via policy. */
export function askSidekick(input: {
  workspaceId: string;
  userId: string;
  query: string;
}): Promise<RagResult> {
  return runRagPipeline({
    surface: "sidekick",
    workspaceId: input.workspaceId,
    userId: input.userId,
    query: input.query,
  });
}

/** Phase 4: standards-scoped agent drafts. */
export function askAgent(input: {
  workspaceId: string;
  userId?: string;
  agentId: string;
  query: string;
}): Promise<RagResult> {
  return runRagPipeline({
    surface: "agent",
    workspaceId: input.workspaceId,
    userId: input.userId,
    agentId: input.agentId,
    query: input.query,
  });
}

/** Meetup Room — shared company context, optional @agent; Sidekick Meet may include personal. */
export function askMeetup(input: {
  workspaceId: string;
  userId: string;
  query: string;
  agentId?: string;
  includePersonal?: boolean;
  sidekickId?: string;
}): Promise<RagResult> {
  return runRagPipeline({
    surface: "meetup",
    workspaceId: input.workspaceId,
    userId: input.userId,
    agentId: input.agentId,
    query: input.query,
    includePersonal: input.includePersonal,
    sidekickId: input.sidekickId,
  });
}

/** Phase 4: week layer + light company grounding. */
export function askDigest(input: {
  workspaceId: string;
  userId?: string;
  query: string;
}): Promise<RagResult> {
  return runRagPipeline({
    surface: "digest",
    workspaceId: input.workspaceId,
    userId: input.userId,
    query: input.query,
  });
}
