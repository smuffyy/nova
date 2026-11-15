import { randomBytes } from "crypto";
import { v4 as uuid } from "uuid";
import { parseAgentMentions } from "@/lib/agents";
import { db, type MeetupMessage, type MeetupRoom, type User } from "@/lib/db";
import { askMeetup, runRagPipeline } from "@/lib/rag";

export function makeInviteCode() {
  return randomBytes(3).toString("hex").toUpperCase();
}

export function serializeMeetupMessage(m: MeetupMessage) {
  return {
    id: m.id,
    roomId: m.room_id,
    userId: m.user_id,
    authorName: m.author_name,
    role: m.role,
    content: m.content,
    agentId: m.agent_id,
    citations: m.citations_json ? JSON.parse(m.citations_json) : [],
    createdAt: m.created_at,
  };
}

export function roomPayload(room: MeetupRoom, viewerId: string) {
  const members = db.listMeetupMembers(room.id).map((m) => {
    const user = db.getUserById(m.user_id);
    const shared =
      m.share_sidekick_id != null
        ? db.getSidekick(m.share_sidekick_id)
        : null;
    return {
      userId: m.user_id,
      name: user?.name || "Member",
      email: user?.email || "",
      role: m.role,
      joinedAt: m.joined_at,
      shareSidekickId: m.share_sidekick_id,
      shareSidekickName:
        shared && shared.user_id === m.user_id ? shared.name : null,
    };
  });
  const viewer = members.find((m) => m.userId === viewerId);
  return {
    id: room.id,
    title: room.title,
    inviteCode: room.invite_code,
    status: room.status,
    kind: room.kind || "company",
    folderLabel: room.folder_label,
    artifactMd: room.artifact_md,
    hostUserId: room.host_user_id,
    createdAt: room.created_at,
    updatedAt: room.updated_at,
    isHost: room.host_user_id === viewerId,
    myShareSidekickId: viewer?.shareSidekickId ?? null,
    members,
    messages: db.listMeetupMessages(room.id).map(serializeMeetupMessage),
  };
}

export function createMeetupForUser(input: {
  workspaceId: string;
  user: User;
  title: string;
  folderLabel?: string | null;
  kind?: "company" | "sidekick";
}) {
  const kind = input.kind === "sidekick" ? "sidekick" : "company";
  const defaultSidekick =
    kind === "sidekick"
      ? db.ensureDefaultSidekick(input.workspaceId, input.user.id)
      : null;

  const room = db.createMeetupRoom({
    id: uuid(),
    workspace_id: input.workspaceId,
    title: input.title.trim() || "Untitled Meetup",
    invite_code: makeInviteCode(),
    host_user_id: input.user.id,
    folder_label: input.folderLabel?.trim() || null,
    kind,
  });

  db.addMeetupMember({
    room_id: room.id,
    user_id: input.user.id,
    role: "host",
    joined_at: new Date().toISOString(),
    share_sidekick_id: defaultSidekick?.id ?? null,
  });

  const systemContent =
    kind === "sidekick"
      ? `Sidekick Meet opened. Share invite code ${room.invite_code} with teammates (same workspace). Each person chooses which Sidekick shelf to share — intentional personal context for this room only. Company library still applies. Type @Moony / @Relay / … to summon an agent.`
      : `Meetup opened. Share invite code ${room.invite_code} with teammates (same workspace). Type @Moony / @Relay / … to summon an agent. Personal Sidekick memory stays out of this room.`;

  db.addMeetupMessage({
    id: uuid(),
    room_id: room.id,
    workspace_id: input.workspaceId,
    user_id: null,
    author_name: "Sentry",
    role: "system",
    content: systemContent,
    agent_id: null,
    citations_json: null,
  });

  return room;
}

export async function postMeetupUserMessage(input: {
  room: MeetupRoom;
  user: User;
  content: string;
}) {
  const text = input.content.trim();
  if (!text) throw new Error("message required");
  if (input.room.status !== "open") throw new Error("Meetup is closed");

  db.addMeetupMessage({
    id: uuid(),
    room_id: input.room.id,
    workspace_id: input.room.workspace_id,
    user_id: input.user.id,
    author_name: input.user.name,
    role: "user",
    content: text,
    agent_id: null,
    citations_json: null,
  });

  const parsed = parseAgentMentions(text);
  // Only run AI when an agent is @mentioned — otherwise humans talk among themselves
  if (!parsed.agent) {
    return { ranAgent: false as const };
  }

  const folderHint = input.room.folder_label
    ? ` Prefer sources related to: ${input.room.folder_label}.`
    : "";

  const isSidekickMeet = (input.room.kind || "company") === "sidekick";
  const member = db.getMeetupMember(input.room.id, input.user.id);
  const shareSidekickId = isSidekickMeet
    ? member?.share_sidekick_id || undefined
    : undefined;

  const sidekickNote = isSidekickMeet
    ? " This is an intentional Sidekick Meet — the posting user's shared personal shelf may be used alongside company memory."
    : "";

  const result = await askMeetup({
    workspaceId: input.room.workspace_id,
    userId: input.user.id,
    agentId: parsed.agent.id,
    query: `${parsed.query}${folderHint}${sidekickNote}`,
    includePersonal: Boolean(isSidekickMeet && shareSidekickId),
    sidekickId: shareSidekickId,
  });

  db.addMeetupMessage({
    id: uuid(),
    room_id: input.room.id,
    workspace_id: input.room.workspace_id,
    user_id: null,
    author_name: result.agentName || parsed.agent.name,
    role: "assistant",
    content: result.answer,
    agent_id: result.agentId || parsed.agent.id,
    citations_json: JSON.stringify(result.citations),
  });

  return { ranAgent: true as const, agentId: parsed.agent.id };
}

export async function summarizeMeetup(input: {
  room: MeetupRoom;
  user: User;
}) {
  const transcript = db
    .listMeetupMessages(input.room.id)
    .filter((m) => m.role !== "system")
    .slice(-40)
    .map((m) => `${m.author_name}: ${m.content}`)
    .join("\n");

  const folderHint = input.room.folder_label
    ? ` Folder focus: ${input.room.folder_label}.`
    : "";

  const query = `Facilitate this Meetup. Summarize positions, list open questions, propose a single next owner and next step, and draft a short handoff note teammates can approve.
${folderHint}

Transcript:
${transcript || "(empty room)"}`;

  const result = await runRagPipeline({
    surface: "meetup",
    workspaceId: input.room.workspace_id,
    userId: input.user.id,
    agentId: "relay",
    query,
    topK: 8,
  });

  const artifact = [
    `# Meetup handoff — ${input.room.title}`,
    "",
    result.answer,
    "",
    `_Generated by Relay · propose only · ${new Date().toISOString().slice(0, 10)}_`,
  ].join("\n");

  db.updateMeetupRoom(input.room.id, { artifact_md: artifact });

  db.addMeetupMessage({
    id: uuid(),
    room_id: input.room.id,
    workspace_id: input.room.workspace_id,
    user_id: null,
    author_name: "Relay",
    role: "assistant",
    content: result.answer,
    agent_id: "relay",
    citations_json: JSON.stringify(result.citations),
  });

  return { artifact, result };
}
