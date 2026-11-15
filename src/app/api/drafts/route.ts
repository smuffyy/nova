import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";

function serializeDraft(
  draft: NonNullable<ReturnType<typeof db.getDraft>>
) {
  return {
    id: draft.id,
    workspaceId: draft.workspace_id,
    userId: draft.user_id,
    agentId: draft.agent_id,
    agentName: draft.agent_name,
    title: draft.title,
    body: draft.body,
    status: draft.status,
    chatId: draft.chat_id,
    messageId: draft.message_id,
    createdAt: draft.created_at,
    updatedAt: draft.updated_at,
    decidedAt: draft.decided_at,
  };
}

export async function GET(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");
  // Default: all drafts in workspace for this session user list;
  // scope=mine filters to current user only.
  const userId = scope === "mine" ? access.user.id : undefined;
  const drafts = db
    .listDrafts(access.workspace.id, userId)
    .map(serializeDraft);

  return NextResponse.json({ drafts });
}

export async function POST(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    agentId?: string;
    agentName?: string;
    title?: string;
    body?: string;
    chatId?: string;
    messageId?: string;
  };

  const agentId = body.agentId?.trim();
  const agentName = body.agentName?.trim();
  const draftBody = body.body?.trim();
  if (!agentId || !agentName || !draftBody) {
    return NextResponse.json(
      { error: "agentId, agentName, and body required" },
      { status: 400 }
    );
  }

  const title =
    body.title?.trim() ||
    draftBody.split("\n")[0]?.replace(/\s+/g, " ").trim().slice(0, 72) ||
    "Draft";

  const draft = db.createDraft({
    workspaceId: access.workspace.id,
    userId: access.user.id,
    agentId,
    agentName,
    title,
    body: draftBody,
    chatId: body.chatId || null,
    messageId: body.messageId || null,
  });

  return NextResponse.json({ draft: serializeDraft(draft) });
}
