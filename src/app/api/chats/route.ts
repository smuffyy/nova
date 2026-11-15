import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { serializeChatListItem } from "@/lib/chatSummary";
import { db } from "@/lib/db";

function serializeChat(chat: NonNullable<ReturnType<typeof db.getChat>>) {
  return serializeChatListItem(chat, db.listMessages(chat.id));
}

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chats = db
    .listChats(access.workspace.id, access.user.id)
    .map(serializeChat);

  return NextResponse.json({ chats });
}

export async function POST(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const chat = db.createChat({
    workspaceId: access.workspace.id,
    userId: access.user.id,
    title: body.title,
  });

  return NextResponse.json({ chat: serializeChat(chat) });
}
