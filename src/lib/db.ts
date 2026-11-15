import { topicFromQuestion } from "@/lib/chatSummary";
import fs from "fs";
import path from "path";
import {
  normalizeRolePolicy,
  type WorkspaceRolePolicy,
} from "@/lib/roles";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "portal-store.json");

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type WorkspaceRolePolicyRow = {
  workspace_id: string;
  policy: WorkspaceRolePolicy;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
};

export type Membership = {
  user_id: string;
  workspace_id: string;
  role: string;
};

export type Source = {
  id: string;
  workspace_id: string;
  filename: string;
  mime_type: string;
  storage_path: string;
  status: "pending" | "processing" | "ready" | "error";
  error_message: string | null;
  created_at: string;
  updated_at: string;
  /** company = shared brain; personal = one user's Sidekick */
  scope: "company" | "personal";
  /** Set when scope is personal */
  user_id: string | null;
  /** Dojo folder id (company library) */
  folder_id: string | null;
  /** Personal Sidekick this file trains (personal scope only) */
  sidekick_id: string | null;
};

export type Sidekick = {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  description: string;
  /** Equipped skill tokens — Sidekick can lean on these as personal SME lanes. */
  skill_ids: string[];
  /** Currently focused tokens for “now working” (subset of skill_ids). */
  active_skill_ids: string[];
  created_at: string;
  updated_at: string;
};

/** Personal SME token — any topic the Sidekick can grow proficiency in. */
export type SkillToken = {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  /** Short topic label (robots, python, plc…). */
  topic: string;
  /** How to act as an SME in this lane. */
  body: string;
  bullets: string[];
  /** 1 emerging · 2 working · 3 sme */
  proficiency: 1 | 2 | 3;
  source_chat_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DojoFolder = {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
};

export type Chunk = {
  id: string;
  source_id: string;
  workspace_id: string;
  chunk_index: number;
  content: string;
  embedding_json: string | null;
  /** JSON: docType, topic, section, kind, raptorLevel, sheet */
  metadata_json: string | null;
};

export type Chat = {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  /** Other chats whose transcripts feed this chat's LLM context. */
  imported_chat_ids: string[];
  /** Knowledge pills attached to this chat (compressed prior context). */
  pill_ids: string[];
  /** ISO timestamp when pinned; null = unpinned. */
  pinned_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Distilled knowledge capsule from a chat — reusable across chats/projects. */
export type KnowledgePill = {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  /** Compact narrative of shared context / decisions / constraints. */
  body: string;
  /** Scannable facts, assumptions, and decisions. */
  bullets: string[];
  /** Structured sections JSON (goals, stack, decisions, …). */
  detail_json: string | null;
  /** Portable markdown for paste/upload into any AI chat. */
  export_md: string | null;
  source_chat_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  workspace_id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  citations_json: string | null;
  created_at: string;
};

export type WaitlistEntry = {
  id: string;
  email: string;
  company: string | null;
  created_at: string;
};

export type MeetupRoom = {
  id: string;
  workspace_id: string;
  title: string;
  invite_code: string;
  host_user_id: string;
  status: "open" | "closed";
  /** company = company brain only; sidekick = intentional personal share */
  kind: "company" | "sidekick";
  /** Optional Dojo folder label for scoped retrieval hints */
  folder_label: string | null;
  artifact_md: string | null;
  created_at: string;
  updated_at: string;
};

export type MeetupMember = {
  room_id: string;
  user_id: string;
  role: "host" | "contributor";
  /** Sidekick Meet only — which personal shelf this member shares into the room */
  share_sidekick_id: string | null;
  joined_at: string;
};

export type MeetupMessage = {
  id: string;
  room_id: string;
  workspace_id: string;
  user_id: string | null;
  author_name: string;
  role: "user" | "assistant" | "system";
  content: string;
  agent_id: string | null;
  citations_json: string | null;
  created_at: string;
};

/** Workspace project / ask tracker (Jira-light, Apple-calm). */
export type AskProject = {
  id: string;
  workspace_id: string;
  title: string;
  aim: string;
  objective: string;
  documentation: string;
  status: "active" | "paused" | "done";
  owner_id: string;
  /** When set, delete is pending unanimous confirmation from ask members. */
  delete_requested_at: string | null;
  delete_requested_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AskMember = {
  project_id: string;
  user_id: string;
  role: "owner" | "collaborator";
  joined_at: string;
};

export type AskDeleteVote = {
  project_id: string;
  user_id: string;
  confirmed_at: string;
};

export type AskPathStep = {
  id: string;
  project_id: string;
  label: string;
  detail: string;
  status: "pending" | "current" | "done";
  sort_order: number;
};

export type AskTask = {
  id: string;
  project_id: string;
  workspace_id: string;
  title: string;
  notes: string;
  status: "todo" | "doing" | "done";
  assignee_id: string | null;
  /** ISO date (YYYY-MM-DD) for Gantt */
  starts_on: string | null;
  ends_on: string | null;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type AskCostLine = {
  id: string;
  project_id: string;
  label: string;
  category: string;
  amount: number;
  created_at: string;
};

export type AskBomItem = {
  id: string;
  project_id: string;
  part_number: string;
  name: string;
  qty: number;
  unit: string;
  unit_cost: number;
  notes: string;
  sort_order: number;
};

export type AskChecklistItem = {
  id: string;
  project_id: string;
  task_id: string | null;
  title: string;
  done: boolean;
  sort_order: number;
};

export type AskComment = {
  id: string;
  project_id: string;
  task_id: string | null;
  user_id: string;
  body: string;
  created_at: string;
};

export type AskFile = {
  id: string;
  project_id: string;
  task_id: string | null;
  workspace_id: string;
  filename: string;
  mime_type: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
};

export type WorkspaceInvite = {
  id: string;
  workspace_id: string;
  code: string;
  role: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  /** null = unlimited */
  max_uses: number | null;
  use_count: number;
  revoked: boolean;
};

export type AgentDraft = {
  id: string;
  workspace_id: string;
  user_id: string;
  agent_id: string;
  agent_name: string;
  title: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  chat_id: string | null;
  message_id: string | null;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
};

type Store = {
  workspaces: Workspace[];
  users: User[];
  memberships: Membership[];
  sources: Source[];
  chunks: Chunk[];
  chats: Chat[];
  messages: Message[];
  knowledge_pills: KnowledgePill[];
  skill_tokens: SkillToken[];
  waitlist: WaitlistEntry[];
  meetup_rooms: MeetupRoom[];
  meetup_members: MeetupMember[];
  meetup_messages: MeetupMessage[];
  role_policies: WorkspaceRolePolicyRow[];
  dojo_folders: DojoFolder[];
  sidekicks: Sidekick[];
  ask_projects: AskProject[];
  ask_members: AskMember[];
  ask_delete_votes: AskDeleteVote[];
  ask_path_steps: AskPathStep[];
  ask_tasks: AskTask[];
  ask_checklist: AskChecklistItem[];
  ask_comments: AskComment[];
  ask_files: AskFile[];
  ask_cost_lines: AskCostLine[];
  ask_bom_items: AskBomItem[];
  workspace_invites: WorkspaceInvite[];
  agent_drafts: AgentDraft[];
};

function emptyStore(): Store {
  return {
    workspaces: [],
    users: [],
    memberships: [],
    sources: [],
    chunks: [],
    chats: [],
    messages: [],
    knowledge_pills: [],
    skill_tokens: [],
    waitlist: [],
    meetup_rooms: [],
    meetup_members: [],
    meetup_messages: [],
    role_policies: [],
    dojo_folders: [],
    sidekicks: [],
    ask_projects: [],
    ask_members: [],
    ask_delete_votes: [],
    ask_path_steps: [],
    ask_tasks: [],
    ask_checklist: [],
    ask_comments: [],
    ask_files: [],
    ask_cost_lines: [],
    ask_bom_items: [],
    workspace_invites: [],
    agent_drafts: [],
  };
}

function newId() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Migrate legacy workspace-global messages into per-user chats. */
function migrateChatStore(store: Store): boolean {
  let changed = false;
  if (!Array.isArray(store.chats)) {
    store.chats = [];
    changed = true;
  }

  for (const chat of store.chats) {
    if (!Array.isArray(chat.imported_chat_ids)) {
      chat.imported_chat_ids = [];
      changed = true;
    }
    if (!Array.isArray(chat.pill_ids)) {
      chat.pill_ids = [];
      changed = true;
    }
    if (chat.pinned_at === undefined) {
      chat.pinned_at = null;
      changed = true;
    }
  }
  if (!Array.isArray(store.knowledge_pills)) {
    store.knowledge_pills = [];
    changed = true;
  }
  for (const pill of store.knowledge_pills) {
    if (pill.detail_json === undefined) {
      pill.detail_json = null;
      changed = true;
    }
    if (pill.export_md === undefined) {
      pill.export_md = null;
      changed = true;
    }
  }

  type LooseMessage = Message & { chat_id?: string };
  const orphans = (store.messages as LooseMessage[]).filter((m) => !m.chat_id);
  if (orphans.length === 0) return changed;

  const byWorkspace = new Map<string, LooseMessage[]>();
  for (const m of orphans) {
    const list = byWorkspace.get(m.workspace_id) || [];
    list.push(m);
    byWorkspace.set(m.workspace_id, list);
  }

  for (const [workspaceId, msgs] of byWorkspace) {
    const membership = store.memberships.find((m) => m.workspace_id === workspaceId);
    const userId = membership?.user_id || "unknown";
    const sorted = [...msgs].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );
    const chatId = newId();
    const firstUser = sorted.find((m) => m.role === "user");
    const title = firstUser
      ? firstUser.content.replace(/\s+/g, " ").trim().slice(0, 48) || "Earlier chat"
      : "Earlier chat";
    const stamp = sorted[0]?.created_at || now();
    store.chats.push({
      id: chatId,
      workspace_id: workspaceId,
      user_id: userId,
      title,
      imported_chat_ids: [],
      pill_ids: [],
      pinned_at: null,
      created_at: stamp,
      updated_at: sorted[sorted.length - 1]?.created_at || stamp,
    });
    for (const m of sorted) {
      m.chat_id = chatId;
    }
    changed = true;
  }

  return changed;
}

/** Ensure every personal source belongs to a Sidekick profile. */
function migrateSidekickStore(store: Store): boolean {
  let changed = false;
  if (!Array.isArray(store.sidekicks)) {
    store.sidekicks = [];
    changed = true;
  }

  const personal = store.sources.filter(
    (s) => (s.scope || "company") === "personal" && s.user_id
  );
  const byOwner = new Map<string, Source[]>();
  for (const s of personal) {
    const key = `${s.workspace_id}::${s.user_id}`;
    const list = byOwner.get(key) || [];
    list.push(s);
    byOwner.set(key, list);
  }

  for (const [key, sources] of byOwner) {
    const [workspaceId, userId] = key.split("::");
    let sidekick = store.sidekicks.find(
      (sk) => sk.workspace_id === workspaceId && sk.user_id === userId
    );
    if (!sidekick) {
      const stamp = now();
      sidekick = {
        id: newId(),
        workspace_id: workspaceId,
        user_id: userId,
        name: "My Sidekick",
        description: "Personal shelf — private to you.",
        skill_ids: [],
        active_skill_ids: [],
        created_at: stamp,
        updated_at: stamp,
      };
      store.sidekicks.push(sidekick);
      changed = true;
    }
    for (const s of sources) {
      if (!(s as Source).sidekick_id) {
        (s as Source).sidekick_id = sidekick.id;
        changed = true;
      }
    }
  }

  for (const s of store.sources) {
    if ((s.scope || "company") === "company" && s.sidekick_id) {
      s.sidekick_id = null;
      changed = true;
    }
    if (s.sidekick_id === undefined) {
      s.sidekick_id = null;
      changed = true;
    }
  }

  for (const sk of store.sidekicks) {
    if (!Array.isArray(sk.skill_ids)) {
      sk.skill_ids = [];
      changed = true;
    }
    if (!Array.isArray(sk.active_skill_ids)) {
      sk.active_skill_ids = [];
      changed = true;
    }
  }

  if (!Array.isArray(store.skill_tokens)) {
    store.skill_tokens = [];
    changed = true;
  }

  return changed;
}

/** Meetup Room v1: kind + optional Sidekick share on members. */
function migrateMeetupStore(store: Store): boolean {
  let changed = false;
  if (!Array.isArray(store.meetup_rooms)) {
    store.meetup_rooms = [];
    changed = true;
  }
  if (!Array.isArray(store.meetup_members)) {
    store.meetup_members = [];
    changed = true;
  }
  if (!Array.isArray(store.meetup_messages)) {
    store.meetup_messages = [];
    changed = true;
  }
  for (const room of store.meetup_rooms) {
    if (!room.kind) {
      room.kind = "company";
      changed = true;
    }
  }
  for (const member of store.meetup_members) {
    if (member.share_sidekick_id === undefined) {
      member.share_sidekick_id = null;
      changed = true;
    }
  }
  return changed;
}

/** Repair ask projects wiped by undefined PATCH fields; seed ask members. */
function migrateAskStore(store: Store): boolean {
  let changed = false;
  if (!Array.isArray(store.ask_projects)) {
    store.ask_projects = [];
    changed = true;
  }
  if (!Array.isArray(store.ask_members)) {
    store.ask_members = [];
    changed = true;
  }
  if (!Array.isArray(store.ask_delete_votes)) {
    store.ask_delete_votes = [];
    changed = true;
  }
  const knownTitles: Record<string, string> = {
    "13ab1ec0-5512-433f-a943-cd420e4ee282": "plasma upgrade",
  };
  for (const p of store.ask_projects) {
    if (!p.title) {
      p.title = knownTitles[p.id] || "Untitled Ask";
      changed = true;
    }
    if (p.aim == null) {
      p.aim = "";
      changed = true;
    }
    if (p.objective == null) {
      p.objective = "";
      changed = true;
    }
    if (p.documentation == null) {
      p.documentation = "";
      changed = true;
    }
    if (!p.status) {
      p.status = "active";
      changed = true;
    }
    if (p.delete_requested_at === undefined) {
      p.delete_requested_at = null;
      changed = true;
    }
    if (p.delete_requested_by === undefined) {
      p.delete_requested_by = null;
      changed = true;
    }
    const hasOwner = store.ask_members.some(
      (m) => m.project_id === p.id && m.user_id === p.owner_id
    );
    if (!hasOwner && p.owner_id) {
      store.ask_members.push({
        project_id: p.id,
        user_id: p.owner_id,
        role: "owner",
        joined_at: p.created_at || now(),
      });
      changed = true;
    }
  }
  for (const t of store.ask_tasks || []) {
    if (t.starts_on === undefined) {
      t.starts_on = null;
      changed = true;
    }
    if (t.ends_on === undefined) {
      t.ends_on = null;
      changed = true;
    }
    if (
      t.assignee_id &&
      !store.ask_members.some(
        (m) => m.project_id === t.project_id && m.user_id === t.assignee_id
      )
    ) {
      store.ask_members.push({
        project_id: t.project_id,
        user_id: t.assignee_id,
        role: "collaborator",
        joined_at: t.created_at || now(),
      });
      changed = true;
    }
  }
  return changed;
}

function now() {
  return new Date().toISOString();
}

/** In-memory store — avoid re-reading/parsing portal-store.json on every helper call. */
let memoryStore: Store | null = null;
/**
 * mtime+size of the file behind `memoryStore`. Out-of-process writers (db:seed,
 * connector imports, manual edits) change the file underneath us; without this
 * check a long-running server serves a stale copy and then overwrites their
 * work on its next write.
 */
let memoryStamp = "";

function diskStamp(): string {
  try {
    const stat = fs.statSync(dbPath);
    return `${stat.mtimeMs}:${stat.size}`;
  } catch {
    return "";
  }
}

function readStore(): Store {
  if (memoryStore && diskStamp() === memoryStamp) return memoryStore;

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    const initial = emptyStore();
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    memoryStore = initial;
    memoryStamp = diskStamp();
    return initial;
  }
  const raw = JSON.parse(fs.readFileSync(dbPath, "utf8")) as Partial<Store>;
  const store: Store = {
    ...emptyStore(),
    ...raw,
    chats: raw.chats || [],
    sidekicks: raw.sidekicks || [],
    meetup_rooms: raw.meetup_rooms || [],
    meetup_members: raw.meetup_members || [],
    meetup_messages: raw.meetup_messages || [],
    role_policies: raw.role_policies || [],
    dojo_folders: raw.dojo_folders || [],
    ask_projects: raw.ask_projects || [],
    ask_members: raw.ask_members || [],
    ask_delete_votes: raw.ask_delete_votes || [],
    ask_path_steps: raw.ask_path_steps || [],
    ask_tasks: raw.ask_tasks || [],
    ask_checklist: raw.ask_checklist || [],
    ask_comments: raw.ask_comments || [],
    ask_files: raw.ask_files || [],
    ask_cost_lines: raw.ask_cost_lines || [],
    ask_bom_items: raw.ask_bom_items || [],
    knowledge_pills: raw.knowledge_pills || [],
    skill_tokens: raw.skill_tokens || [],
    workspace_invites: raw.workspace_invites || [],
    agent_drafts: raw.agent_drafts || [],
  };
  store.sources = (raw.sources || []).map((s) => ({
    ...s,
    scope: s.scope || "company",
    user_id: s.user_id ?? null,
    folder_id: s.folder_id ?? null,
    sidekick_id: s.sidekick_id ?? null,
  }));
  store.chunks = (raw.chunks || []).map((c) => ({
    ...c,
    metadata_json: c.metadata_json ?? null,
  }));
  store.ask_tasks = (raw.ask_tasks || []).map((t) => ({
    ...t,
    starts_on: t.starts_on ?? null,
    ends_on: t.ends_on ?? null,
  }));
  let migrated = migrateChatStore(store);
  migrated = migrateSidekickStore(store) || migrated;
  migrated = migrateMeetupStore(store) || migrated;
  migrated = migrateAskStore(store) || migrated;
  memoryStore = store;
  memoryStamp = diskStamp();
  if (migrated) {
    writeStore(store);
  }
  return store;
}

function writeStore(store: Store) {
  memoryStore = store;
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(store, null, 2));
  memoryStamp = diskStamp();
}

function mutate<T>(fn: (store: Store) => T): T {
  const store = readStore();
  const result = fn(store);
  writeStore(store);
  return result;
}

export const db = {
  getWorkspaceById(id: string) {
    return readStore().workspaces.find((w) => w.id === id) || null;
  },
  getWorkspaceBySlug(slug: string) {
    return readStore().workspaces.find((w) => w.slug === slug) || null;
  },
  createWorkspace(input: Omit<Workspace, "created_at"> & { created_at?: string }) {
    return mutate((store) => {
      const workspace: Workspace = {
        ...input,
        created_at: input.created_at || now(),
      };
      store.workspaces.push(workspace);
      return workspace;
    });
  },
  getUserById(id: string) {
    return readStore().users.find((u) => u.id === id) || null;
  },
  getUserByEmail(email: string) {
    return readStore().users.find((u) => u.email === email) || null;
  },
  createUser(input: Omit<User, "created_at"> & { created_at?: string }) {
    return mutate((store) => {
      const user: User = { ...input, created_at: input.created_at || now() };
      store.users.push(user);
      return user;
    });
  },
  ensureMembership(membership: Membership) {
    return mutate((store) => {
      const exists = store.memberships.some(
        (m) =>
          m.user_id === membership.user_id &&
          m.workspace_id === membership.workspace_id
      );
      if (!exists) store.memberships.push(membership);
      return membership;
    });
  },
  getMembership(userId: string, workspaceId: string) {
    return (
      readStore().memberships.find(
        (m) => m.user_id === userId && m.workspace_id === workspaceId
      ) || null
    );
  },
  getFirstMembership(userId: string) {
    return readStore().memberships.find((m) => m.user_id === userId) || null;
  },
  listMemberships(workspaceId: string) {
    return readStore().memberships.filter((m) => m.workspace_id === workspaceId);
  },
  updateMembershipRole(userId: string, workspaceId: string, role: string) {
    return mutate((store) => {
      const row = store.memberships.find(
        (m) => m.user_id === userId && m.workspace_id === workspaceId
      );
      if (!row) return null;
      row.role = role;
      return row;
    });
  },
  getRolePolicy(workspaceId: string): WorkspaceRolePolicy {
    const row = readStore().role_policies.find(
      (r) => r.workspace_id === workspaceId
    );
    return normalizeRolePolicy(row?.policy);
  },
  setRolePolicy(workspaceId: string, policy: WorkspaceRolePolicy) {
    return mutate((store) => {
      const next: WorkspaceRolePolicyRow = {
        workspace_id: workspaceId,
        policy: normalizeRolePolicy(policy),
        updated_at: now(),
      };
      const idx = store.role_policies.findIndex(
        (r) => r.workspace_id === workspaceId
      );
      if (idx >= 0) store.role_policies[idx] = next;
      else store.role_policies.push(next);
      return next;
    });
  },
  listSources(workspaceId: string) {
    return readStore()
      .sources.filter(
        (s) =>
          s.workspace_id === workspaceId &&
          (s.scope || "company") === "company"
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  listPersonalSources(workspaceId: string, userId: string, sidekickId?: string) {
    return readStore()
      .sources.filter(
        (s) =>
          s.workspace_id === workspaceId &&
          s.scope === "personal" &&
          s.user_id === userId &&
          (!sidekickId || s.sidekick_id === sidekickId)
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getSource(id: string) {
    const s = readStore().sources.find((row) => row.id === id) || null;
    if (!s) return null;
    return {
      ...s,
      scope: s.scope || "company",
      user_id: s.user_id ?? null,
      folder_id: s.folder_id ?? null,
      sidekick_id: s.sidekick_id ?? null,
    };
  },
  createSource(
    input: Omit<
      Source,
      | "created_at"
      | "updated_at"
      | "error_message"
      | "status"
      | "scope"
      | "user_id"
      | "folder_id"
      | "sidekick_id"
    > & {
      status?: Source["status"];
      error_message?: string | null;
      scope?: Source["scope"];
      user_id?: string | null;
      folder_id?: string | null;
      sidekick_id?: string | null;
    }
  ) {
    return mutate((store) => {
      const source: Source = {
        ...input,
        scope: input.scope || "company",
        user_id: input.user_id ?? null,
        folder_id: input.folder_id ?? null,
        sidekick_id: input.sidekick_id ?? null,
        status: input.status || "pending",
        error_message: input.error_message ?? null,
        created_at: now(),
        updated_at: now(),
      };
      store.sources.push(source);
      return source;
    });
  },
  updateSource(
    id: string,
    patch: Partial<
      Pick<Source, "status" | "error_message" | "updated_at" | "folder_id" | "filename">
    >
  ) {
    return mutate((store) => {
      const source = store.sources.find((s) => s.id === id);
      if (!source) return null;
      Object.assign(source, patch, { updated_at: now() });
      return source;
    });
  },
  listDojoFolders(workspaceId: string) {
    return readStore()
      .dojo_folders.filter((f) => f.workspace_id === workspaceId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  createDojoFolder(input: Omit<DojoFolder, "created_at"> & { created_at?: string }) {
    return mutate((store) => {
      const folder: DojoFolder = {
        ...input,
        created_at: input.created_at || now(),
      };
      store.dojo_folders.push(folder);
      return folder;
    });
  },
  renameDojoFolder(id: string, name: string) {
    return mutate((store) => {
      const folder = store.dojo_folders.find((f) => f.id === id);
      if (!folder) return null;
      folder.name = name.trim();
      return folder;
    });
  },
  deleteDojoFolder(id: string) {
    return mutate((store) => {
      store.dojo_folders = store.dojo_folders.filter((f) => f.id !== id);
      for (const s of store.sources) {
        if (s.folder_id === id) s.folder_id = null;
      }
      return true;
    });
  },
  deleteSource(id: string) {
    return mutate((store) => {
      const source = store.sources.find((s) => s.id === id) || null;
      store.sources = store.sources.filter((s) => s.id !== id);
      store.chunks = store.chunks.filter((c) => c.source_id !== id);
      return source;
    });
  },
  listSourcesByFilenames(workspaceId: string, filenames: string[]) {
    const set = new Set(filenames);
    return readStore().sources.filter(
      (s) => s.workspace_id === workspaceId && set.has(s.filename)
    );
  },
  replaceChunks(sourceId: string, chunks: Chunk[]) {
    return mutate((store) => {
      store.chunks = store.chunks.filter((c) => c.source_id !== sourceId);
      store.chunks.push(...chunks);
    });
  },
  listReadyChunks(workspaceId: string) {
    const store = readStore();
    const readySourceIds = new Set(
      store.sources
        .filter(
          (s) =>
            s.workspace_id === workspaceId &&
            s.status === "ready" &&
            (s.scope || "company") === "company"
        )
        .map((s) => s.id)
    );
    return store.chunks
      .filter((c) => c.workspace_id === workspaceId && readySourceIds.has(c.source_id))
      .map((c) => {
        const source = store.sources.find((s) => s.id === c.source_id);
        return { ...c, filename: source?.filename || "unknown", layer: "company" as const };
      });
  },
  listReadyPersonalChunks(
    workspaceId: string,
    userId: string,
    sidekickId?: string
  ) {
    const store = readStore();
    const readySourceIds = new Set(
      store.sources
        .filter(
          (s) =>
            s.workspace_id === workspaceId &&
            s.status === "ready" &&
            s.scope === "personal" &&
            s.user_id === userId &&
            (!sidekickId || s.sidekick_id === sidekickId)
        )
        .map((s) => s.id)
    );
    return store.chunks
      .filter((c) => c.workspace_id === workspaceId && readySourceIds.has(c.source_id))
      .map((c) => {
        const source = store.sources.find((s) => s.id === c.source_id);
        return {
          ...c,
          filename: source?.filename || "unknown",
          layer: "personal" as const,
        };
      });
  },
  listSidekicks(workspaceId: string, userId: string) {
    return readStore()
      .sidekicks.filter(
        (s) => s.workspace_id === workspaceId && s.user_id === userId
      )
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },
  getSidekick(id: string) {
    return readStore().sidekicks.find((s) => s.id === id) || null;
  },
  ensureDefaultSidekick(workspaceId: string, userId: string) {
    const existing = this.listSidekicks(workspaceId, userId);
    if (existing[0]) return existing[0];
    return this.createSidekick({
      workspaceId,
      userId,
      name: "My Sidekick",
      description: "Personal shelf — private to you.",
    });
  },
  createSidekick(input: {
    workspaceId: string;
    userId: string;
    name: string;
    description?: string;
  }) {
    return mutate((store) => {
      const stamp = now();
      const sidekick: Sidekick = {
        id: newId(),
        workspace_id: input.workspaceId,
        user_id: input.userId,
        name: input.name.trim() || "Sidekick",
        description: (input.description || "").trim(),
        skill_ids: [],
        active_skill_ids: [],
        created_at: stamp,
        updated_at: stamp,
      };
      store.sidekicks.push(sidekick);
      return sidekick;
    });
  },
  updateSidekick(
    id: string,
    patch: Partial<
      Pick<Sidekick, "name" | "description" | "skill_ids" | "active_skill_ids">
    >
  ) {
    return mutate((store) => {
      const sk = store.sidekicks.find((s) => s.id === id);
      if (!sk) return null;
      if (patch.name !== undefined) sk.name = patch.name.trim() || sk.name;
      if (patch.description !== undefined) {
        sk.description = patch.description.trim();
      }
      if (patch.skill_ids !== undefined) {
        sk.skill_ids = [...new Set(patch.skill_ids)];
        sk.active_skill_ids = sk.active_skill_ids.filter((sid) =>
          sk.skill_ids.includes(sid)
        );
      }
      if (patch.active_skill_ids !== undefined) {
        const equipped = new Set(sk.skill_ids);
        sk.active_skill_ids = [
          ...new Set(patch.active_skill_ids.filter((sid) => equipped.has(sid))),
        ];
      }
      sk.updated_at = now();
      return sk;
    });
  },
  deleteSidekick(id: string) {
    return mutate((store) => {
      const sk = store.sidekicks.find((s) => s.id === id);
      if (!sk) return { ok: false as const, reason: "missing" };
      const owned = store.sidekicks.filter(
        (s) =>
          s.workspace_id === sk.workspace_id && s.user_id === sk.user_id
      );
      if (owned.length <= 1) {
        return { ok: false as const, reason: "last" };
      }
      store.sidekicks = store.sidekicks.filter((s) => s.id !== id);
      const fallback =
        store.sidekicks.find(
          (s) =>
            s.workspace_id === sk.workspace_id && s.user_id === sk.user_id
        ) || null;
      store.sources = store.sources.map((source) => {
        if (source.sidekick_id !== id) return source;
        return { ...source, sidekick_id: fallback?.id || null };
      });
      return { ok: true as const, fallbackId: fallback?.id || null };
    });
  },
  listSkillTokens(workspaceId: string, userId: string) {
    return readStore()
      .skill_tokens.filter(
        (t) => t.workspace_id === workspaceId && t.user_id === userId
      )
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },
  getSkillToken(id: string) {
    return readStore().skill_tokens.find((t) => t.id === id) || null;
  },
  getSkillTokensByIds(ids: string[]) {
    if (!ids.length) return [] as SkillToken[];
    const byId = new Map(readStore().skill_tokens.map((t) => [t.id, t]));
    return ids
      .map((id) => byId.get(id))
      .filter((t): t is SkillToken => Boolean(t));
  },
  createSkillToken(input: {
    workspaceId: string;
    userId: string;
    name: string;
    topic?: string;
    body?: string;
    bullets?: string[];
    proficiency?: 1 | 2 | 3;
    sourceChatId?: string | null;
  }) {
    return mutate((store) => {
      const stamp = now();
      const name = input.name.trim() || "Untitled skill";
      const token: SkillToken = {
        id: newId(),
        workspace_id: input.workspaceId,
        user_id: input.userId,
        name,
        topic: (input.topic || name).trim().toLowerCase().slice(0, 64),
        body: (input.body || "").trim(),
        bullets: (input.bullets || [])
          .map((b) => b.trim())
          .filter(Boolean)
          .slice(0, 16),
        proficiency: input.proficiency || 1,
        source_chat_id: input.sourceChatId ?? null,
        created_at: stamp,
        updated_at: stamp,
      };
      store.skill_tokens.push(token);
      return token;
    });
  },
  updateSkillToken(
    id: string,
    patch: Partial<
      Pick<SkillToken, "name" | "topic" | "body" | "bullets" | "proficiency">
    >
  ) {
    return mutate((store) => {
      const token = store.skill_tokens.find((t) => t.id === id);
      if (!token) return null;
      if (patch.name !== undefined) token.name = patch.name.trim() || token.name;
      if (patch.topic !== undefined) {
        token.topic =
          patch.topic.trim().toLowerCase().slice(0, 64) || token.topic;
      }
      if (patch.body !== undefined) token.body = patch.body.trim();
      if (patch.bullets !== undefined) {
        token.bullets = patch.bullets
          .map((b) => b.trim())
          .filter(Boolean)
          .slice(0, 16);
      }
      if (patch.proficiency !== undefined) {
        token.proficiency = patch.proficiency;
      }
      token.updated_at = now();
      return token;
    });
  },
  deleteSkillToken(id: string) {
    return mutate((store) => {
      store.skill_tokens = store.skill_tokens.filter((t) => t.id !== id);
      for (const sk of store.sidekicks) {
        sk.skill_ids = sk.skill_ids.filter((sid) => sid !== id);
        sk.active_skill_ids = sk.active_skill_ids.filter((sid) => sid !== id);
      }
    });
  },
  listChats(workspaceId: string, userId: string) {
    return readStore()
      .chats.filter(
        (c) => c.workspace_id === workspaceId && c.user_id === userId
      )
      .sort((a, b) => {
        const ap = a.pinned_at ? 1 : 0;
        const bp = b.pinned_at ? 1 : 0;
        if (ap !== bp) return bp - ap;
        if (a.pinned_at && b.pinned_at) {
          return b.pinned_at.localeCompare(a.pinned_at);
        }
        return b.updated_at.localeCompare(a.updated_at);
      });
  },
  getChat(chatId: string) {
    return readStore().chats.find((c) => c.id === chatId) || null;
  },
  createChat(input: {
    workspaceId: string;
    userId: string;
    title?: string;
  }) {
    return mutate((store) => {
      const stamp = now();
      const chat: Chat = {
        id: newId(),
        workspace_id: input.workspaceId,
        user_id: input.userId,
        title: (input.title || "New chat").trim() || "New chat",
        imported_chat_ids: [],
        pill_ids: [],
        pinned_at: null,
        created_at: stamp,
        updated_at: stamp,
      };
      store.chats.push(chat);
      return chat;
    });
  },
  updateChat(
    chatId: string,
    patch: Partial<
      Pick<
        Chat,
        "title" | "imported_chat_ids" | "pill_ids" | "updated_at" | "pinned_at"
      >
    >
  ) {
    return mutate((store) => {
      const chat = store.chats.find((c) => c.id === chatId);
      if (!chat) return null;
      let touch = false;
      if (patch.title !== undefined) {
        chat.title = patch.title.trim() || chat.title;
        touch = true;
      }
      if (patch.imported_chat_ids !== undefined) {
        chat.imported_chat_ids = [
          ...new Set(patch.imported_chat_ids.filter((id) => id !== chatId)),
        ];
        touch = true;
      }
      if (patch.pill_ids !== undefined) {
        chat.pill_ids = [...new Set(patch.pill_ids)];
        touch = true;
      }
      if (patch.pinned_at !== undefined) {
        chat.pinned_at = patch.pinned_at;
      }
      if (patch.updated_at !== undefined) {
        chat.updated_at = patch.updated_at;
      } else if (touch) {
        chat.updated_at = now();
      }
      return chat;
    });
  },
  deleteChat(chatId: string) {
    return mutate((store) => {
      store.chats = store.chats.filter((c) => c.id !== chatId);
      store.messages = store.messages.filter((m) => m.chat_id !== chatId);
      for (const chat of store.chats) {
        chat.imported_chat_ids = chat.imported_chat_ids.filter(
          (id) => id !== chatId
        );
      }
      for (const pill of store.knowledge_pills) {
        if (pill.source_chat_id === chatId) {
          pill.source_chat_id = null;
        }
      }
    });
  },
  listPills(workspaceId: string, userId: string) {
    return readStore()
      .knowledge_pills.filter(
        (p) => p.workspace_id === workspaceId && p.user_id === userId
      )
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },
  getPill(pillId: string) {
    return readStore().knowledge_pills.find((p) => p.id === pillId) || null;
  },
  getPillsByIds(pillIds: string[]) {
    if (!pillIds.length) return [] as KnowledgePill[];
    const store = readStore();
    const byId = new Map(store.knowledge_pills.map((p) => [p.id, p]));
    return pillIds
      .map((id) => byId.get(id))
      .filter((p): p is KnowledgePill => Boolean(p));
  },
  createPill(input: {
    workspaceId: string;
    userId: string;
    title: string;
    body: string;
    bullets?: string[];
    detailJson?: string | null;
    exportMd?: string | null;
    sourceChatId?: string | null;
  }) {
    return mutate((store) => {
      const stamp = now();
      const pill: KnowledgePill = {
        id: newId(),
        workspace_id: input.workspaceId,
        user_id: input.userId,
        title: input.title.trim() || "Untitled pill",
        body: input.body.trim(),
        bullets: (input.bullets || [])
          .map((b) => b.trim())
          .filter(Boolean)
          .slice(0, 16),
        detail_json: input.detailJson ?? null,
        export_md: input.exportMd ?? null,
        source_chat_id: input.sourceChatId ?? null,
        created_at: stamp,
        updated_at: stamp,
      };
      store.knowledge_pills.push(pill);
      return pill;
    });
  },
  updatePill(
    pillId: string,
    patch: Partial<
      Pick<
        KnowledgePill,
        "title" | "body" | "bullets" | "detail_json" | "export_md"
      >
    >
  ) {
    return mutate((store) => {
      const pill = store.knowledge_pills.find((p) => p.id === pillId);
      if (!pill) return null;
      if (patch.title !== undefined) {
        pill.title = patch.title.trim() || pill.title;
      }
      if (patch.body !== undefined) {
        pill.body = patch.body.trim();
      }
      if (patch.bullets !== undefined) {
        pill.bullets = patch.bullets
          .map((b) => b.trim())
          .filter(Boolean)
          .slice(0, 16);
      }
      if (patch.detail_json !== undefined) {
        pill.detail_json = patch.detail_json;
      }
      if (patch.export_md !== undefined) {
        pill.export_md = patch.export_md;
      }
      pill.updated_at = now();
      return pill;
    });
  },
  deletePill(pillId: string) {
    return mutate((store) => {
      store.knowledge_pills = store.knowledge_pills.filter((p) => p.id !== pillId);
      for (const chat of store.chats) {
        chat.pill_ids = chat.pill_ids.filter((id) => id !== pillId);
      }
    });
  },
  listMessages(chatId: string) {
    return readStore()
      .messages.filter((m) => m.chat_id === chatId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(-200);
  },
  /** Current chat turns + imported chats, oldest→newest, capped for the LLM. */
  getConversationContext(
    chatId: string,
    opts?: { maxTurns?: number; maxChars?: number }
  ) {
    const store = readStore();
    const chat = store.chats.find((c) => c.id === chatId);
    if (!chat) return [] as { role: "user" | "assistant"; content: string }[];

    const maxTurns = opts?.maxTurns ?? 24;
    const maxChars = opts?.maxChars ?? 8000;
    const turns: { role: "user" | "assistant"; content: string }[] = [];

    for (const importedId of chat.imported_chat_ids) {
      const imported = store.chats.find((c) => c.id === importedId);
      if (!imported) continue;
      const msgs = store.messages
        .filter((m) => m.chat_id === importedId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      if (!msgs.length) continue;
      turns.push({
        role: "user",
        content: `[Imported chat: ${imported.title}]`,
      });
      for (const m of msgs) {
        turns.push({ role: m.role, content: m.content });
      }
    }

    const current = store.messages
      .filter((m) => m.chat_id === chatId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (const m of current) {
      turns.push({ role: m.role, content: m.content });
    }

    const sliced = turns.slice(-maxTurns);
    let total = 0;
    const kept: typeof sliced = [];
    for (let i = sliced.length - 1; i >= 0; i--) {
      const len = sliced[i].content.length;
      if (total + len > maxChars && kept.length > 0) break;
      kept.unshift(sliced[i]);
      total += len;
    }
    return kept;
  },
  addMessage(input: Omit<Message, "created_at"> & { created_at?: string }) {
    return mutate((store) => {
      const message: Message = {
        ...input,
        created_at: input.created_at || now(),
      };
      store.messages.push(message);
      const chat = store.chats.find((c) => c.id === input.chat_id);
      if (chat) {
        chat.updated_at = message.created_at;
        if (
          input.role === "user" &&
          (chat.title === "New chat" || chat.title === "Earlier chat")
        ) {
          const t = topicFromQuestion(input.content);
          if (t && t !== "New chat") chat.title = t;
        }
      }
      return message;
    });
  },
  clearMessages(chatId: string) {
    return mutate((store) => {
      store.messages = store.messages.filter((m) => m.chat_id !== chatId);
      const chat = store.chats.find((c) => c.id === chatId);
      if (chat) chat.updated_at = now();
    });
  },
  addWaitlist(entry: Omit<WaitlistEntry, "created_at"> & { created_at?: string }) {
    return mutate((store) => {
      const row: WaitlistEntry = {
        ...entry,
        created_at: entry.created_at || now(),
      };
      store.waitlist.push(row);
      return row;
    });
  },

  listMeetupRooms(workspaceId: string) {
    return readStore()
      .meetup_rooms.filter((r) => r.workspace_id === workspaceId)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },
  getMeetupRoom(id: string) {
    return readStore().meetup_rooms.find((r) => r.id === id) || null;
  },
  getMeetupRoomByInvite(workspaceId: string, code: string) {
    const normalized = code.trim().toUpperCase();
    return (
      readStore().meetup_rooms.find(
        (r) =>
          r.workspace_id === workspaceId &&
          r.invite_code === normalized &&
          r.status === "open"
      ) || null
    );
  },
  createMeetupRoom(
    input: Omit<
      MeetupRoom,
      "created_at" | "updated_at" | "artifact_md" | "status" | "kind"
    > & {
      status?: MeetupRoom["status"];
      kind?: MeetupRoom["kind"];
      artifact_md?: string | null;
    }
  ) {
    return mutate((store) => {
      const room: MeetupRoom = {
        ...input,
        kind: input.kind || "company",
        status: input.status || "open",
        artifact_md: input.artifact_md ?? null,
        created_at: now(),
        updated_at: now(),
      };
      store.meetup_rooms.push(room);
      return room;
    });
  },
  updateMeetupRoom(
    id: string,
    patch: Partial<
      Pick<
        MeetupRoom,
        "title" | "status" | "folder_label" | "artifact_md" | "updated_at" | "kind"
      >
    >
  ) {
    return mutate((store) => {
      const room = store.meetup_rooms.find((r) => r.id === id);
      if (!room) return null;
      Object.assign(room, patch, { updated_at: now() });
      return room;
    });
  },
  listMeetupMembers(roomId: string) {
    return readStore().meetup_members.filter((m) => m.room_id === roomId);
  },
  getMeetupMember(roomId: string, userId: string) {
    return (
      readStore().meetup_members.find(
        (m) => m.room_id === roomId && m.user_id === userId
      ) || null
    );
  },
  addMeetupMember(
    member: Omit<MeetupMember, "share_sidekick_id"> & {
      share_sidekick_id?: string | null;
    }
  ) {
    return mutate((store) => {
      const row: MeetupMember = {
        ...member,
        share_sidekick_id: member.share_sidekick_id ?? null,
      };
      const exists = store.meetup_members.some(
        (m) => m.room_id === row.room_id && m.user_id === row.user_id
      );
      if (!exists) store.meetup_members.push(row);
      return row;
    });
  },
  updateMeetupMember(
    roomId: string,
    userId: string,
    patch: Partial<Pick<MeetupMember, "share_sidekick_id" | "role">>
  ) {
    return mutate((store) => {
      const member = store.meetup_members.find(
        (m) => m.room_id === roomId && m.user_id === userId
      );
      if (!member) return null;
      Object.assign(member, patch);
      return member;
    });
  },
  listMeetupMessages(roomId: string) {
    return readStore()
      .meetup_messages.filter((m) => m.room_id === roomId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(-200);
  },
  addMeetupMessage(
    input: Omit<MeetupMessage, "created_at"> & { created_at?: string }
  ) {
    return mutate((store) => {
      const message: MeetupMessage = {
        ...input,
        created_at: input.created_at || now(),
      };
      store.meetup_messages.push(message);
      const room = store.meetup_rooms.find((r) => r.id === input.room_id);
      if (room) room.updated_at = message.created_at;
      return message;
    });
  },

  // —— Asks (project tracker) ——
  listAskProjects(workspaceId: string) {
    return readStore()
      .ask_projects.filter((p) => p.workspace_id === workspaceId)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },
  getAskProject(id: string) {
    return readStore().ask_projects.find((p) => p.id === id) || null;
  },
  listAskMembers(projectId: string) {
    return readStore().ask_members.filter((m) => m.project_id === projectId);
  },
  getAskMember(projectId: string, userId: string) {
    return (
      readStore().ask_members.find(
        (m) => m.project_id === projectId && m.user_id === userId
      ) || null
    );
  },
  addAskMember(member: AskMember) {
    return mutate((store) => {
      const exists = store.ask_members.some(
        (m) =>
          m.project_id === member.project_id && m.user_id === member.user_id
      );
      if (!exists) {
        store.ask_members.push(member);
        const project = store.ask_projects.find(
          (p) => p.id === member.project_id
        );
        if (project) project.updated_at = now();
      }
      return member;
    });
  },
  removeAskMember(projectId: string, userId: string) {
    return mutate((store) => {
      const before = store.ask_members.length;
      store.ask_members = store.ask_members.filter(
        (m) => !(m.project_id === projectId && m.user_id === userId)
      );
      store.ask_delete_votes = store.ask_delete_votes.filter(
        (v) => !(v.project_id === projectId && v.user_id === userId)
      );
      if (store.ask_members.length !== before) {
        const project = store.ask_projects.find((p) => p.id === projectId);
        if (project) project.updated_at = now();
        return true;
      }
      return false;
    });
  },
  listAskDeleteVotes(projectId: string) {
    return readStore().ask_delete_votes.filter((v) => v.project_id === projectId);
  },
  upsertAskDeleteVote(vote: AskDeleteVote) {
    return mutate((store) => {
      const idx = store.ask_delete_votes.findIndex(
        (v) => v.project_id === vote.project_id && v.user_id === vote.user_id
      );
      if (idx >= 0) store.ask_delete_votes[idx] = vote;
      else store.ask_delete_votes.push(vote);
      return vote;
    });
  },
  clearAskDeleteVotes(projectId: string) {
    return mutate((store) => {
      store.ask_delete_votes = store.ask_delete_votes.filter(
        (v) => v.project_id !== projectId
      );
      const project = store.ask_projects.find((p) => p.id === projectId);
      if (project) {
        project.delete_requested_at = null;
        project.delete_requested_by = null;
        project.updated_at = now();
      }
      return true;
    });
  },
  createAskProject(
    input: Omit<
      AskProject,
      | "created_at"
      | "updated_at"
      | "status"
      | "delete_requested_at"
      | "delete_requested_by"
    > & {
      status?: AskProject["status"];
    }
  ) {
    return mutate((store) => {
      const stamp = now();
      const project: AskProject = {
        ...input,
        title: input.title.trim() || "Untitled Ask",
        aim: input.aim || "",
        objective: input.objective || "",
        documentation: input.documentation || "",
        status: input.status || "active",
        delete_requested_at: null,
        delete_requested_by: null,
        created_at: stamp,
        updated_at: stamp,
      };
      store.ask_projects.push(project);
      store.ask_members.push({
        project_id: project.id,
        user_id: project.owner_id,
        role: "owner",
        joined_at: stamp,
      });
      return project;
    });
  },
  updateAskProject(
    id: string,
    patch: Partial<
      Pick<
        AskProject,
        | "title"
        | "aim"
        | "objective"
        | "documentation"
        | "status"
        | "delete_requested_at"
        | "delete_requested_by"
      >
    >
  ) {
    return mutate((store) => {
      const project = store.ask_projects.find((p) => p.id === id);
      if (!project) return null;
      for (const [key, value] of Object.entries(patch)) {
        if (value !== undefined) {
          (project as Record<string, unknown>)[key] = value;
        }
      }
      if (typeof project.title === "string") {
        project.title = project.title.trim() || "Untitled Ask";
      }
      project.updated_at = now();
      return project;
    });
  },
  deleteAskProject(id: string) {
    return mutate((store) => {
      const exists = store.ask_projects.some((p) => p.id === id);
      if (!exists) return false;
      store.ask_projects = store.ask_projects.filter((p) => p.id !== id);
      store.ask_members = store.ask_members.filter((m) => m.project_id !== id);
      store.ask_delete_votes = store.ask_delete_votes.filter(
        (v) => v.project_id !== id
      );
      store.ask_path_steps = store.ask_path_steps.filter(
        (s) => s.project_id !== id
      );
      store.ask_tasks = store.ask_tasks.filter((t) => t.project_id !== id);
      store.ask_checklist = store.ask_checklist.filter(
        (c) => c.project_id !== id
      );
      store.ask_comments = store.ask_comments.filter((c) => c.project_id !== id);
      store.ask_files = store.ask_files.filter((f) => f.project_id !== id);
      store.ask_cost_lines = store.ask_cost_lines.filter(
        (c) => c.project_id !== id
      );
      store.ask_bom_items = store.ask_bom_items.filter(
        (b) => b.project_id !== id
      );
      return true;
    });
  },
  touchAskProject(id: string) {
    return mutate((store) => {
      const project = store.ask_projects.find((p) => p.id === id);
      if (!project) return null;
      project.updated_at = now();
      return project;
    });
  },
  listAskPathSteps(projectId: string) {
    return readStore()
      .ask_path_steps.filter((s) => s.project_id === projectId)
      .sort((a, b) => a.sort_order - b.sort_order);
  },
  createAskPathStep(
    input: Omit<AskPathStep, "status"> & { status?: AskPathStep["status"] }
  ) {
    return mutate((store) => {
      const step: AskPathStep = {
        ...input,
        label: input.label.trim() || "Step",
        detail: input.detail || "",
        status: input.status || "pending",
      };
      store.ask_path_steps.push(step);
      const project = store.ask_projects.find((p) => p.id === input.project_id);
      if (project) project.updated_at = now();
      return step;
    });
  },
  /** Create project + default path in one write (avoids N disk flushes). */
  createAskProjectWithPath(
    input: Omit<
      AskProject,
      | "created_at"
      | "updated_at"
      | "status"
      | "delete_requested_at"
      | "delete_requested_by"
    > & {
      status?: AskProject["status"];
    },
    pathSteps: { label: string; detail: string; status?: AskPathStep["status"] }[]
  ) {
    return mutate((store) => {
      const stamp = now();
      const project: AskProject = {
        ...input,
        title: input.title.trim() || "Untitled Ask",
        aim: input.aim || "",
        objective: input.objective || "",
        documentation: input.documentation || "",
        status: input.status || "active",
        delete_requested_at: null,
        delete_requested_by: null,
        created_at: stamp,
        updated_at: stamp,
      };
      store.ask_projects.push(project);
      store.ask_members.push({
        project_id: project.id,
        user_id: project.owner_id,
        role: "owner",
        joined_at: stamp,
      });
      pathSteps.forEach((step, i) => {
        store.ask_path_steps.push({
          id: newId(),
          project_id: project.id,
          label: step.label,
          detail: step.detail,
          status: step.status || (i === 0 ? "current" : "pending"),
          sort_order: i,
        });
      });
      return project;
    });
  },
  updateAskPathStep(
    id: string,
    patch: Partial<Pick<AskPathStep, "label" | "detail" | "status" | "sort_order">>
  ) {
    return mutate((store) => {
      const step = store.ask_path_steps.find((s) => s.id === id);
      if (!step) return null;
      Object.assign(step, patch);
      const project = store.ask_projects.find((p) => p.id === step.project_id);
      if (project) project.updated_at = now();
      return step;
    });
  },
  deleteAskPathStep(id: string) {
    return mutate((store) => {
      const step = store.ask_path_steps.find((s) => s.id === id);
      if (!step) return false;
      store.ask_path_steps = store.ask_path_steps.filter((s) => s.id !== id);
      const project = store.ask_projects.find((p) => p.id === step.project_id);
      if (project) project.updated_at = now();
      return true;
    });
  },
  listAskTasks(projectId: string) {
    return readStore()
      .ask_tasks.filter((t) => t.project_id === projectId)
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
  },
  getAskTask(id: string) {
    return readStore().ask_tasks.find((t) => t.id === id) || null;
  },
  createAskTask(
    input: Omit<
      AskTask,
      "created_at" | "updated_at" | "status" | "notes" | "assignee_id" | "starts_on" | "ends_on"
    > & {
      status?: AskTask["status"];
      notes?: string;
      assignee_id?: string | null;
      starts_on?: string | null;
      ends_on?: string | null;
    }
  ) {
    return mutate((store) => {
      const task: AskTask = {
        ...input,
        notes: input.notes || "",
        status: input.status || "todo",
        assignee_id: input.assignee_id ?? null,
        starts_on: input.starts_on ?? null,
        ends_on: input.ends_on ?? null,
        created_at: now(),
        updated_at: now(),
      };
      store.ask_tasks.push(task);
      const project = store.ask_projects.find((p) => p.id === input.project_id);
      if (project) project.updated_at = now();
      return task;
    });
  },
  updateAskTask(
    id: string,
    patch: Partial<
      Pick<
        AskTask,
        | "title"
        | "notes"
        | "status"
        | "assignee_id"
        | "sort_order"
        | "starts_on"
        | "ends_on"
      >
    >
  ) {
    return mutate((store) => {
      const task = store.ask_tasks.find((t) => t.id === id);
      if (!task) return null;
      for (const [key, value] of Object.entries(patch)) {
        if (value !== undefined) {
          (task as Record<string, unknown>)[key] = value;
        }
      }
      task.updated_at = now();
      const project = store.ask_projects.find((p) => p.id === task.project_id);
      if (project) project.updated_at = now();
      return task;
    });
  },
  deleteAskTask(id: string) {
    return mutate((store) => {
      const task = store.ask_tasks.find((t) => t.id === id);
      if (!task) return false;
      store.ask_tasks = store.ask_tasks.filter((t) => t.id !== id);
      store.ask_checklist = store.ask_checklist.filter((c) => c.task_id !== id);
      store.ask_comments = store.ask_comments.filter((c) => c.task_id !== id);
      const project = store.ask_projects.find((p) => p.id === task.project_id);
      if (project) project.updated_at = now();
      return true;
    });
  },
  listAskChecklist(projectId: string, taskId?: string | null) {
    return readStore()
      .ask_checklist.filter((c) => {
        if (c.project_id !== projectId) return false;
        if (taskId === undefined) return true;
        return (c.task_id || null) === (taskId || null);
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  },
  createAskChecklistItem(
    input: Omit<AskChecklistItem, "done"> & { done?: boolean }
  ) {
    return mutate((store) => {
      const item: AskChecklistItem = {
        ...input,
        title: input.title.trim() || "To-do",
        done: input.done ?? false,
        task_id: input.task_id ?? null,
      };
      store.ask_checklist.push(item);
      const project = store.ask_projects.find((p) => p.id === input.project_id);
      if (project) project.updated_at = now();
      return item;
    });
  },
  updateAskChecklistItem(
    id: string,
    patch: Partial<Pick<AskChecklistItem, "title" | "done" | "sort_order">>
  ) {
    return mutate((store) => {
      const item = store.ask_checklist.find((c) => c.id === id);
      if (!item) return null;
      Object.assign(item, patch);
      const project = store.ask_projects.find((p) => p.id === item.project_id);
      if (project) project.updated_at = now();
      return item;
    });
  },
  deleteAskChecklistItem(id: string) {
    return mutate((store) => {
      const item = store.ask_checklist.find((c) => c.id === id);
      if (!item) return false;
      store.ask_checklist = store.ask_checklist.filter((c) => c.id !== id);
      return true;
    });
  },
  listAskComments(projectId: string) {
    return readStore()
      .ask_comments.filter((c) => c.project_id === projectId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },
  createAskComment(
    input: Omit<AskComment, "created_at"> & { created_at?: string }
  ) {
    return mutate((store) => {
      const comment: AskComment = {
        ...input,
        task_id: input.task_id ?? null,
        created_at: input.created_at || now(),
      };
      store.ask_comments.push(comment);
      const project = store.ask_projects.find((p) => p.id === input.project_id);
      if (project) project.updated_at = now();
      return comment;
    });
  },
  deleteAskComment(id: string) {
    return mutate((store) => {
      const n = store.ask_comments.length;
      store.ask_comments = store.ask_comments.filter((c) => c.id !== id);
      return store.ask_comments.length < n;
    });
  },
  listAskFiles(projectId: string) {
    return readStore()
      .ask_files.filter((f) => f.project_id === projectId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getAskFile(id: string) {
    return readStore().ask_files.find((f) => f.id === id) || null;
  },
  createAskFile(input: Omit<AskFile, "created_at"> & { created_at?: string }) {
    return mutate((store) => {
      const file: AskFile = {
        ...input,
        task_id: input.task_id ?? null,
        created_at: input.created_at || now(),
      };
      store.ask_files.push(file);
      const project = store.ask_projects.find((p) => p.id === input.project_id);
      if (project) project.updated_at = now();
      return file;
    });
  },
  deleteAskFile(id: string) {
    return mutate((store) => {
      const file = store.ask_files.find((f) => f.id === id);
      if (!file) return null;
      store.ask_files = store.ask_files.filter((f) => f.id !== id);
      return file;
    });
  },
  listAskCostLines(projectId: string) {
    return readStore()
      .ask_cost_lines.filter((c) => c.project_id === projectId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },
  createAskCostLine(
    input: Omit<AskCostLine, "created_at"> & { created_at?: string }
  ) {
    return mutate((store) => {
      const line: AskCostLine = {
        ...input,
        label: input.label.trim() || "Cost line",
        category: input.category || "General",
        amount: Number(input.amount) || 0,
        created_at: input.created_at || now(),
      };
      store.ask_cost_lines.push(line);
      const project = store.ask_projects.find((p) => p.id === input.project_id);
      if (project) project.updated_at = now();
      return line;
    });
  },
  updateAskCostLine(
    id: string,
    patch: Partial<Pick<AskCostLine, "label" | "category" | "amount">>
  ) {
    return mutate((store) => {
      const line = store.ask_cost_lines.find((c) => c.id === id);
      if (!line) return null;
      Object.assign(line, patch);
      if (patch.amount !== undefined) line.amount = Number(patch.amount) || 0;
      const project = store.ask_projects.find((p) => p.id === line.project_id);
      if (project) project.updated_at = now();
      return line;
    });
  },
  deleteAskCostLine(id: string) {
    return mutate((store) => {
      const n = store.ask_cost_lines.length;
      store.ask_cost_lines = store.ask_cost_lines.filter((c) => c.id !== id);
      return store.ask_cost_lines.length < n;
    });
  },
  listAskBomItems(projectId: string) {
    return readStore()
      .ask_bom_items.filter((b) => b.project_id === projectId)
      .sort((a, b) => a.sort_order - b.sort_order);
  },
  createAskBomItem(
    input: Omit<AskBomItem, "part_number" | "unit" | "notes" | "qty" | "unit_cost"> & {
      part_number?: string;
      unit?: string;
      notes?: string;
      qty?: number;
      unit_cost?: number;
    }
  ) {
    return mutate((store) => {
      const item: AskBomItem = {
        ...input,
        part_number: input.part_number || "",
        name: input.name.trim() || "Part",
        qty: Number(input.qty) || 1,
        unit: input.unit || "ea",
        unit_cost: Number(input.unit_cost) || 0,
        notes: input.notes || "",
      };
      store.ask_bom_items.push(item);
      const project = store.ask_projects.find((p) => p.id === input.project_id);
      if (project) project.updated_at = now();
      return item;
    });
  },
  updateAskBomItem(
    id: string,
    patch: Partial<
      Pick<
        AskBomItem,
        "part_number" | "name" | "qty" | "unit" | "unit_cost" | "notes" | "sort_order"
      >
    >
  ) {
    return mutate((store) => {
      const item = store.ask_bom_items.find((b) => b.id === id);
      if (!item) return null;
      Object.assign(item, patch);
      if (patch.qty !== undefined) item.qty = Number(patch.qty) || 0;
      if (patch.unit_cost !== undefined)
        item.unit_cost = Number(patch.unit_cost) || 0;
      const project = store.ask_projects.find((p) => p.id === item.project_id);
      if (project) project.updated_at = now();
      return item;
    });
  },
  deleteAskBomItem(id: string) {
    return mutate((store) => {
      const n = store.ask_bom_items.length;
      store.ask_bom_items = store.ask_bom_items.filter((b) => b.id !== id);
      return store.ask_bom_items.length < n;
    });
  },

  listInvites(workspaceId: string) {
    return readStore()
      .workspace_invites.filter((i) => i.workspace_id === workspaceId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  createInvite(input: {
    workspaceId: string;
    createdBy: string;
    role?: string;
    code?: string;
    expiresAt?: string | null;
    maxUses?: number | null;
  }) {
    return mutate((store) => {
      const stamp = now();
      const code =
        input.code?.trim().toUpperCase() ||
        `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const invite: WorkspaceInvite = {
        id: newId(),
        workspace_id: input.workspaceId,
        code,
        role: input.role || "member",
        created_by: input.createdBy,
        created_at: stamp,
        expires_at: input.expiresAt ?? null,
        max_uses: input.maxUses ?? null,
        use_count: 0,
        revoked: false,
      };
      store.workspace_invites.push(invite);
      return invite;
    });
  },
  getInviteByCode(code: string) {
    const normalized = code.trim().toUpperCase();
    return (
      readStore().workspace_invites.find((i) => i.code === normalized) || null
    );
  },
  getInvite(id: string) {
    return readStore().workspace_invites.find((i) => i.id === id) || null;
  },
  revokeInvite(id: string) {
    return mutate((store) => {
      const invite = store.workspace_invites.find((i) => i.id === id);
      if (!invite) return null;
      invite.revoked = true;
      return invite;
    });
  },
  consumeInvite(id: string) {
    return mutate((store) => {
      const invite = store.workspace_invites.find((i) => i.id === id);
      if (!invite) return null;
      invite.use_count += 1;
      return invite;
    });
  },

  listDrafts(workspaceId: string, userId?: string) {
    return readStore()
      .agent_drafts.filter(
        (d) =>
          d.workspace_id === workspaceId &&
          (!userId || d.user_id === userId)
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getDraft(id: string) {
    return readStore().agent_drafts.find((d) => d.id === id) || null;
  },
  createDraft(input: {
    workspaceId: string;
    userId: string;
    agentId: string;
    agentName: string;
    title: string;
    body: string;
    chatId?: string | null;
    messageId?: string | null;
  }) {
    return mutate((store) => {
      const stamp = now();
      const draft: AgentDraft = {
        id: newId(),
        workspace_id: input.workspaceId,
        user_id: input.userId,
        agent_id: input.agentId,
        agent_name: input.agentName,
        title: input.title.trim() || "Draft",
        body: input.body,
        status: "pending",
        chat_id: input.chatId ?? null,
        message_id: input.messageId ?? null,
        created_at: stamp,
        updated_at: stamp,
        decided_at: null,
      };
      store.agent_drafts.push(draft);
      return draft;
    });
  },
  updateDraftStatus(id: string, status: "approved" | "rejected") {
    return mutate((store) => {
      const draft = store.agent_drafts.find((d) => d.id === id);
      if (!draft) return null;
      const stamp = now();
      draft.status = status;
      draft.updated_at = stamp;
      draft.decided_at = stamp;
      return draft;
    });
  },
  deleteDraft(id: string) {
    return mutate((store) => {
      const n = store.agent_drafts.length;
      store.agent_drafts = store.agent_drafts.filter((d) => d.id !== id);
      return store.agent_drafts.length < n;
    });
  },
};

/** @deprecated use `db` — kept for gradual migration naming */
export function getDb() {
  return db;
}
