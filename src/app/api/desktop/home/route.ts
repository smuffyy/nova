import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { serializeChatListItem } from "@/lib/chatSummary";
import { db } from "@/lib/db";

function formatDay() {
  return new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function hoursAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60);
}

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = access.workspace.id;
  const userId = access.user.id;

  const chats = db.listChats(workspaceId, userId);
  const waitingChats = chats
    .map((chat) => {
      const messages = db.listMessages(chat.id);
      const last = messages[messages.length - 1];
      if (!last || last.role !== "assistant") return null;
      const item = serializeChatListItem(chat, messages);
      return {
        id: chat.id,
        title: item.title,
        preview: item.summary,
        updatedAt: chat.updated_at,
      };
    })
    .filter(Boolean)
    .slice(0, 5) as {
    id: string;
    title: string;
    preview: string;
    updatedAt: string;
  }[];

  const recentChats = chats.slice(0, 5).map((chat) => {
    const messages = db.listMessages(chat.id);
    const item = serializeChatListItem(chat, messages);
    return {
      id: chat.id,
      title: item.title,
      preview: item.summary,
      updatedAt: chat.updated_at,
    };
  });

  const rooms = db.listMeetupRooms(workspaceId);
  const meetings = rooms
    .filter((r) => r.status === "open")
    .map((r) => {
      const members = db.listMeetupMembers(r.id);
      const imIn = members.some((m) => m.user_id === userId);
      const hostIsYou = r.host_user_id === userId;
      return {
        id: r.id,
        title: r.title,
        inviteCode: r.invite_code,
        updatedAt: r.updated_at,
        memberCount: members.length,
        hostIsYou,
        imIn,
        relevance: hostIsYou ? 2 : imIn ? 1 : 0,
      };
    })
    .filter((m) => m.relevance > 0 || rooms.filter((r) => r.status === "open").length <= 3)
    .sort(
      (a, b) =>
        b.relevance - a.relevance || b.updatedAt.localeCompare(a.updatedAt)
    )
    .slice(0, 5);

  const sources = db
    .listSources(workspaceId)
    .filter((s) => s.scope === "company");
  const updates: {
    id: string;
    kind: "policy" | "team";
    title: string;
    detail: string;
    at: string;
  }[] = [];

  for (const s of sources
    .filter((s) => s.status === "ready" && hoursAgo(s.updated_at) < 168)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5)) {
    const name = s.filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
    updates.push({
      id: `src-${s.id}`,
      kind: "policy",
      title: name,
      detail: "New in company library — available when you ask Sentry.",
      at: s.updated_at,
    });
  }

  const needsYou: {
    id: string;
    kind: "chat" | "meeting";
    title: string;
    detail: string;
    at: string;
    chatId?: string;
  }[] = [];

  for (const c of waitingChats.slice(0, 4)) {
    needsYou.push({
      id: `chat-${c.id}`,
      kind: "chat",
      title: c.title,
      detail: c.preview || "Sentry replied — your turn.",
      at: c.updatedAt,
      chatId: c.id,
    });
  }
  for (const m of meetings.filter((m) => m.hostIsYou || m.imIn).slice(0, 3)) {
    needsYou.push({
      id: `meet-${m.id}`,
      kind: "meeting",
      title: m.title,
      detail: m.hostIsYou
        ? `You’re hosting · ${m.memberCount} joined`
        : `Open Meetup · code ${m.inviteCode}`,
      at: m.updatedAt,
    });
  }

  needsYou.sort((a, b) => b.at.localeCompare(a.at));

  const focusBits: string[] = [];
  if (waitingChats.length) {
    focusBits.push(
      `${waitingChats.length} chat${waitingChats.length === 1 ? "" : "s"} waiting on you`
    );
  }
  if (meetings.filter((m) => m.imIn || m.hostIsYou).length) {
    const n = meetings.filter((m) => m.imIn || m.hostIsYou).length;
    focusBits.push(`${n} Meetup${n === 1 ? "" : "s"} open`);
  }
  if (updates.length) {
    focusBits.push(
      `${updates.length} compan${updates.length === 1 ? "y update" : "y updates"} this week`
    );
  }

  const focus =
    focusBits.length > 0
      ? `Here’s your day: ${focusBits.slice(0, 3).join(", ")}.`
      : "Nothing urgent — a good time to catch up or ask Sentry anything.";

  return NextResponse.json({
    day: formatDay(),
    workspace: access.workspace.name,
    userName: access.user.name,
    role: access.membershipRole,
    focus,
    needsYou: needsYou.slice(0, 8),
    meetings,
    updates: updates.slice(0, 5),
    recentChats,
    counts: {
      meetings: meetings.filter((m) => m.imIn || m.hostIsYou).length,
      waitingChats: waitingChats.length,
      updates: updates.length,
    },
  });
}
