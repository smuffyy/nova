import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";

function ownChat(chatId: string, workspaceId: string, userId: string) {
  const chat = db.getChat(chatId);
  if (!chat) return null;
  if (chat.workspace_id !== workspaceId || chat.user_id !== userId) return null;
  return chat;
}

function serializeChat(chat: NonNullable<ReturnType<typeof db.getChat>>) {
  const messages = db.listMessages(chat.id);
  return {
    id: chat.id,
    title: chat.title,
    importedChatIds: chat.imported_chat_ids,
    pillIds: chat.pill_ids,
    pinnedAt: chat.pinned_at,
    createdAt: chat.created_at,
    updatedAt: chat.updated_at,
    messageCount: messages.length,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const chat = ownChat(id, access.workspace.id, access.user.id);
  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = db.listMessages(chat.id).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    citations: row.citations_json ? JSON.parse(row.citations_json) : [],
    createdAt: row.created_at,
  }));

  const imported = chat.imported_chat_ids
    .map((cid) => db.getChat(cid))
    .filter(Boolean)
    .map((c) => ({
      id: c!.id,
      title: c!.title,
      updatedAt: c!.updated_at,
      messageCount: db.listMessages(c!.id).length,
    }));

  const pills = db.getPillsByIds(chat.pill_ids).map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    bullets: p.bullets,
    sourceChatId: p.source_chat_id,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));

  return NextResponse.json({
    chat: serializeChat(chat),
    messages,
    imported,
    pills,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const chat = ownChat(id, access.workspace.id, access.user.id);
  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: string;
    importedChatIds?: string[];
    pillIds?: string[];
    pinned?: boolean;
  };

  if (body.importedChatIds) {
    const allowed = new Set(
      db.listChats(access.workspace.id, access.user.id).map((c) => c.id)
    );
    for (const cid of body.importedChatIds) {
      if (!allowed.has(cid)) {
        return NextResponse.json(
          { error: "Cannot import a chat you do not own" },
          { status: 400 }
        );
      }
    }
  }

  if (body.pillIds) {
    const allowed = new Set(
      db.listPills(access.workspace.id, access.user.id).map((p) => p.id)
    );
    for (const pid of body.pillIds) {
      if (!allowed.has(pid)) {
        return NextResponse.json(
          { error: "Cannot attach a pill you do not own" },
          { status: 400 }
        );
      }
    }
  }

  const updated = db.updateChat(id, {
    title: body.title,
    imported_chat_ids: body.importedChatIds,
    pill_ids: body.pillIds,
    pinned_at:
      body.pinned === undefined
        ? undefined
        : body.pinned
          ? new Date().toISOString()
          : null,
  });

  return NextResponse.json({ chat: serializeChat(updated!) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const chat = ownChat(id, access.workspace.id, access.user.id);
  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.deleteChat(id);
  return NextResponse.json({ ok: true });
}
