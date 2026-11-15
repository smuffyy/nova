import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createMeetupForUser, roomPayload } from "@/lib/meetup";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rooms = db.listMeetupRooms(session.workspace.id).map((room) => {
    const members = db.listMeetupMembers(room.id);
    return {
      id: room.id,
      title: room.title,
      inviteCode: room.invite_code,
      status: room.status,
      kind: room.kind || "company",
      folderLabel: room.folder_label,
      memberCount: members.length,
      updatedAt: room.updated_at,
      isHost: room.host_user_id === session.user.id,
    };
  });

  return NextResponse.json({ rooms });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: string;
    folderLabel?: string;
    inviteCode?: string;
    kind?: "company" | "sidekick";
    action?: "create" | "join";
  };

  const action = body.action || (body.inviteCode ? "join" : "create");

  if (action === "join") {
    const code = body.inviteCode?.trim();
    if (!code) {
      return NextResponse.json({ error: "inviteCode required" }, { status: 400 });
    }
    const room = db.getMeetupRoomByInvite(session.workspace.id, code);
    if (!room) {
      return NextResponse.json({ error: "No open Meetup for that code" }, { status: 404 });
    }
    const existing = db.listMeetupMembers(room.id);
    if (existing.length >= 5 && !db.getMeetupMember(room.id, session.user.id)) {
      return NextResponse.json(
        { error: "Meetup is full (max 5 people)" },
        { status: 400 }
      );
    }
    const already = db.getMeetupMember(room.id, session.user.id);
    if (!already) {
      const defaultShare =
        (room.kind || "company") === "sidekick"
          ? db.ensureDefaultSidekick(session.workspace.id, session.user.id).id
          : null;
      db.addMeetupMember({
        room_id: room.id,
        user_id: session.user.id,
        role: room.host_user_id === session.user.id ? "host" : "contributor",
        joined_at: new Date().toISOString(),
        share_sidekick_id: defaultShare,
      });
    }
    return NextResponse.json({ room: roomPayload(room, session.user.id) });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const room = createMeetupForUser({
    workspaceId: session.workspace.id,
    user: session.user,
    title,
    folderLabel: body.folderLabel || null,
    kind: body.kind === "sidekick" ? "sidekick" : "company",
  });

  return NextResponse.json({ room: roomPayload(room, session.user.id) });
}
