import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { generatePillFromChat, serializePill } from "@/lib/pills";

function ownChat(chatId: string, workspaceId: string, userId: string) {
  const chat = db.getChat(chatId);
  if (!chat) return null;
  if (chat.workspace_id !== workspaceId || chat.user_id !== userId) return null;
  return chat;
}

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pills = db
    .listPills(access.workspace.id, access.user.id)
    .map(serializePill);

  return NextResponse.json({ pills });
}

export async function POST(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    chatId?: string;
    title?: string;
    body?: string;
    bullets?: string[];
    attachToChatId?: string;
  };

  const chatId = body.chatId?.trim();
  if (!chatId) {
    return NextResponse.json(
      { error: "chatId required to generate a pill" },
      { status: 400 }
    );
  }

  const source = ownChat(chatId, access.workspace.id, access.user.id);
  if (!source) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const messages = db.listMessages(chatId);
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "Chat has no messages to distill" },
      { status: 400 }
    );
  }

  const draft = await generatePillFromChat(chatId);
  const pill = db.createPill({
    workspaceId: access.workspace.id,
    userId: access.user.id,
    title: body.title?.trim() || draft.title,
    body: body.body?.trim() || draft.body,
    bullets: body.bullets?.length ? body.bullets : draft.bullets,
    detailJson: JSON.stringify(draft.detail),
    exportMd: draft.exportMd,
    sourceChatId: chatId,
  });

  const attachTo = body.attachToChatId?.trim();
  if (attachTo) {
    const target = ownChat(attachTo, access.workspace.id, access.user.id);
    if (target) {
      db.updateChat(attachTo, {
        pill_ids: [...new Set([...target.pill_ids, pill.id])],
      });
    }
  }

  return NextResponse.json({ pill: serializePill(pill) }, { status: 201 });
}
