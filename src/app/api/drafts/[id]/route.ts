import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const draft = db.getDraft(id);
  if (!draft || draft.workspace_id !== access.workspace.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as { status?: string };
  if (body.status !== "approved" && body.status !== "rejected") {
    return NextResponse.json(
      { error: "status must be approved or rejected" },
      { status: 400 }
    );
  }

  const updated = db.updateDraftStatus(id, body.status);
  return NextResponse.json({
    draft: updated
      ? {
          id: updated.id,
          workspaceId: updated.workspace_id,
          userId: updated.user_id,
          agentId: updated.agent_id,
          agentName: updated.agent_name,
          title: updated.title,
          body: updated.body,
          status: updated.status,
          chatId: updated.chat_id,
          messageId: updated.message_id,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
          decidedAt: updated.decided_at,
        }
      : null,
  });
}
