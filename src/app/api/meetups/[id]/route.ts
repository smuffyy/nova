import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  postMeetupUserMessage,
  roomPayload,
  summarizeMeetup,
} from "@/lib/meetup";

type Ctx = { params: Promise<{ id: string }> };

function requireMember(roomId: string, userId: string, workspaceId: string) {
  const room = db.getMeetupRoom(roomId);
  if (!room || room.workspace_id !== workspaceId) return null;
  const member = db.getMeetupMember(roomId, userId);
  if (!member) return null;
  return room;
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const room = requireMember(id, session.user.id, session.workspace.id);
  if (!room) {
    return NextResponse.json({ error: "Not found or not a member" }, { status: 404 });
  }
  return NextResponse.json({ room: roomPayload(room, session.user.id) });
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const room = requireMember(id, session.user.id, session.workspace.id);
  if (!room) {
    return NextResponse.json({ error: "Not found or not a member" }, { status: 404 });
  }

  const body = (await req.json()) as {
    action?: "message" | "summarize" | "close" | "export" | "share_sidekick";
    message?: string;
    shareSidekickId?: string | null;
  };
  const action = body.action || "message";

  if (action === "share_sidekick") {
    if ((room.kind || "company") !== "sidekick") {
      return NextResponse.json(
        { error: "Only Sidekick Meet rooms support sharing a Sidekick" },
        { status: 400 }
      );
    }
    const raw = body.shareSidekickId;
    let shareId: string | null = null;
    if (raw != null && String(raw).trim()) {
      const sk = db.getSidekick(String(raw).trim());
      if (
        !sk ||
        sk.workspace_id !== session.workspace.id ||
        sk.user_id !== session.user.id
      ) {
        return NextResponse.json(
          { error: "Sidekick not found" },
          { status: 404 }
        );
      }
      shareId = sk.id;
    }
    db.updateMeetupMember(id, session.user.id, {
      share_sidekick_id: shareId,
    });
    const fresh = db.getMeetupRoom(id)!;
    return NextResponse.json({ room: roomPayload(fresh, session.user.id) });
  }

  if (action === "message") {
    try {
      await postMeetupUserMessage({
        room,
        user: session.user,
        content: body.message || "",
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed" },
        { status: 400 }
      );
    }
    const fresh = db.getMeetupRoom(id)!;
    return NextResponse.json({ room: roomPayload(fresh, session.user.id) });
  }

  if (action === "summarize") {
    await summarizeMeetup({ room, user: session.user });
    const fresh = db.getMeetupRoom(id)!;
    return NextResponse.json({ room: roomPayload(fresh, session.user.id) });
  }

  if (action === "close") {
    if (room.host_user_id !== session.user.id) {
      return NextResponse.json({ error: "Only host can close" }, { status: 403 });
    }
    db.updateMeetupRoom(id, { status: "closed" });
    const fresh = db.getMeetupRoom(id)!;
    return NextResponse.json({ room: roomPayload(fresh, session.user.id) });
  }

  if (action === "export") {
    const fresh = db.getMeetupRoom(id)!;
    const md =
      fresh.artifact_md ||
      `# Meetup — ${fresh.title}\n\n_No handoff yet. Run Relay summarize first._\n`;
    return NextResponse.json({
      filename: `${fresh.title.replace(/[^\w.-]+/g, "_").slice(0, 40)}_handoff.md`,
      markdown: md,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
