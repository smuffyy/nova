import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { generateSkillToken, serializeSkillToken } from "@/lib/skills";

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

  const skills = db
    .listSkillTokens(access.workspace.id, access.user.id)
    .map(serializeSkillToken);

  return NextResponse.json({ skills });
}

export async function POST(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    topic?: string;
    body?: string;
    bullets?: string[];
    chatId?: string;
    equipToSidekickId?: string;
    activate?: boolean;
  };

  if (body.chatId) {
    const chat = ownChat(body.chatId, access.workspace.id, access.user.id);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
  }

  const name = body.name?.trim();
  if (!name && !body.chatId) {
    return NextResponse.json(
      { error: "name or chatId required to mint a skill token" },
      { status: 400 }
    );
  }

  const draft = await generateSkillToken({
    name,
    chatId: body.chatId,
  });

  const token = db.createSkillToken({
    workspaceId: access.workspace.id,
    userId: access.user.id,
    name: name || draft.name,
    topic: body.topic?.trim() || draft.topic,
    body: body.body?.trim() || draft.body,
    bullets: body.bullets?.length ? body.bullets : draft.bullets,
    proficiency: draft.proficiency,
    sourceChatId: body.chatId || null,
  });

  const equipId = body.equipToSidekickId?.trim();
  if (equipId) {
    const sk = db.getSidekick(equipId);
    if (
      sk &&
      sk.workspace_id === access.workspace.id &&
      sk.user_id === access.user.id
    ) {
      const skillIds = [...new Set([...sk.skill_ids, token.id])];
      const active = body.activate
        ? [...new Set([...sk.active_skill_ids, token.id])]
        : sk.active_skill_ids;
      db.updateSidekick(equipId, {
        skill_ids: skillIds,
        active_skill_ids: active,
      });
    }
  }

  return NextResponse.json(
    { skill: serializeSkillToken(token) },
    { status: 201 }
  );
}
