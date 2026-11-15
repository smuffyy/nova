import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { parseAgentMentions } from "@/lib/agents";
import { accessHas, getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { runRagPipeline } from "@/lib/rag";

const MONEY_QUERY_RE =
  /(\$|usd|amount|expense|expenses|revenue|income|profit|payable|receivable|invoice|p&l|cash|owe|owed|balance|q[1-4]\b|vendor spend)/i;

function ownChat(chatId: string, workspaceId: string, userId: string) {
  const chat = db.getChat(chatId);
  if (!chat) return null;
  if (chat.workspace_id !== workspaceId || chat.user_id !== userId) return null;
  return chat;
}

function ensureChat(
  chatId: string | undefined,
  workspaceId: string,
  userId: string
) {
  if (chatId) {
    const existing = ownChat(chatId, workspaceId, userId);
    if (existing) return existing;
  }
  return db.createChat({ workspaceId, userId });
}

export async function GET(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  let chatId = url.searchParams.get("chatId") || undefined;

  if (!chatId) {
    const chats = db.listChats(access.workspace.id, access.user.id);
    if (chats[0]) {
      chatId = chats[0].id;
    } else {
      const created = db.createChat({
        workspaceId: access.workspace.id,
        userId: access.user.id,
      });
      chatId = created.id;
    }
  }

  const chat = ownChat(chatId, access.workspace.id, access.user.id);
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const messages = db.listMessages(chat.id).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    citations: row.citations_json ? JSON.parse(row.citations_json) : [],
    createdAt: row.created_at,
  }));

  return NextResponse.json({
    chatId: chat.id,
    chat: {
      id: chat.id,
      title: chat.title,
      importedChatIds: chat.imported_chat_ids,
      pillIds: chat.pill_ids,
      updatedAt: chat.updated_at,
    },
    messages,
    pills: db.getPillsByIds(chat.pill_ids).map((p) => {
      let detail = null;
      if (p.detail_json) {
        try {
          detail = JSON.parse(p.detail_json);
        } catch {
          detail = null;
        }
      }
      return {
        id: p.id,
        title: p.title,
        body: p.body,
        bullets: p.bullets,
        detail,
        exportMd: p.export_md,
        sourceChatId: p.source_chat_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    }),
  });
}

export async function POST(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    message?: string;
    chatId?: string;
    agentId?: string;
    surface?: "chat" | "sidekick";
    sidekickId?: string;
  };
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const workspaceId = access.workspace.id;
  const chat = ensureChat(body.chatId, workspaceId, access.user.id);
  const parsed = parseAgentMentions(message);
  const agentId = body.agentId || parsed.agent?.id;
  const surface =
    body.surface === "sidekick" && !agentId
      ? "sidekick"
      : agentId
        ? "agent"
        : "chat";

  let sidekickId: string | undefined;
  if (surface === "sidekick") {
    const requested = body.sidekickId?.trim();
    if (requested) {
      const sk = db.getSidekick(requested);
      if (
        !sk ||
        sk.workspace_id !== workspaceId ||
        sk.user_id !== access.user.id
      ) {
        return NextResponse.json(
          { error: "Sidekick not found" },
          { status: 404 }
        );
      }
      sidekickId = sk.id;
    } else {
      sidekickId = db.ensureDefaultSidekick(
        workspaceId,
        access.user.id
      ).id;
    }
  }

  if (
    agentId === "ledger" &&
    MONEY_QUERY_RE.test(parsed.query) &&
    !accessHas(access, "finance.money")
  ) {
    const refusal =
      "Money figures are limited to admin roles your workspace configured (finance.money). Your role cannot see cash, P&L, or payable amounts here.\n\nAsk an owner to grant access, or open non-monetary questions (e.g. payment-term policy wording).";
    db.addMessage({
      id: uuid(),
      workspace_id: workspaceId,
      chat_id: chat.id,
      role: "user",
      content: message,
      citations_json: null,
    });
    const assistant = db.addMessage({
      id: uuid(),
      workspace_id: workspaceId,
      chat_id: chat.id,
      role: "assistant",
      content: refusal,
      citations_json: "[]",
    });
    return NextResponse.json({
      chatId: chat.id,
      message: {
        id: assistant.id,
        role: "assistant",
        content: refusal,
        citations: [],
        agentId: "ledger",
        agentName: "Ledger",
      },
      meta: {
        refused: true,
        gateBand: "role",
        llmUsed: false,
        evidenceCount: 0,
        layersUsed: ["role_gate"],
        surface: "agent",
        agentId: "ledger",
        agentName: "Ledger",
      },
    });
  }

  db.addMessage({
    id: uuid(),
    workspace_id: workspaceId,
    chat_id: chat.id,
    role: "user",
    content: message,
    citations_json: null,
  });

  // Exclude the just-added user turn from history — query is passed separately.
  const history = db
    .getConversationContext(chat.id)
    .slice(0, -1);

  const knowledgePills = db.getPillsByIds(chat.pill_ids).map((p) => ({
    title: p.title,
    body: p.export_md?.trim() || p.body,
    bullets: p.bullets,
  }));

  let skillTokens:
    | {
        name: string;
        topic: string;
        body: string;
        bullets: string[];
        proficiency: number;
        active?: boolean;
      }[]
    | undefined;

  if (surface === "sidekick" && sidekickId) {
    const sk = db.getSidekick(sidekickId);
    if (sk) {
      const active = new Set(sk.active_skill_ids || []);
      skillTokens = db.getSkillTokensByIds(sk.skill_ids || []).map((t) => ({
        name: t.name,
        topic: t.topic,
        body: t.body,
        bullets: t.bullets,
        proficiency: t.proficiency,
        active: active.has(t.id),
      }));
    }
  }

  const result = await runRagPipeline({
    surface: surface === "sidekick" ? "sidekick" : agentId ? "agent" : "chat",
    workspaceId,
    userId: access.user.id,
    sidekickId,
    agentId,
    query: parsed.query,
    topK: 8,
    conversationHistory: history,
    knowledgePills,
    skillTokens,
  });

  const assistant = db.addMessage({
    id: uuid(),
    workspace_id: workspaceId,
    chat_id: chat.id,
    role: "assistant",
    content: result.answer,
    citations_json: JSON.stringify(result.citations),
  });

  const fresh = db.getChat(chat.id);

  return NextResponse.json({
    chatId: chat.id,
    chat: fresh
      ? {
          id: fresh.id,
          title: fresh.title,
          importedChatIds: fresh.imported_chat_ids,
          pillIds: fresh.pill_ids,
          updatedAt: fresh.updated_at,
        }
      : undefined,
    message: {
      id: assistant.id,
      role: "assistant",
      content: result.answer,
      citations: result.citations,
      agentId: result.agentId ?? null,
      agentName: result.agentName ?? null,
    },
    meta: {
      refused: result.refused,
      gateBand: result.gateBand,
      llmUsed: result.llmUsed,
      evidenceCount: result.evidenceCount,
      layersUsed: result.layersUsed,
      surface: result.surface,
      sidekickId: sidekickId ?? null,
      agentId: result.agentId ?? null,
      agentName: result.agentName ?? null,
    },
  });
}

export async function DELETE(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const chatId = url.searchParams.get("chatId");
  if (!chatId) {
    return NextResponse.json({ error: "chatId required" }, { status: 400 });
  }

  const chat = ownChat(chatId, access.workspace.id, access.user.id);
  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.clearMessages(chatId);
  return NextResponse.json({ ok: true, chatId });
}
