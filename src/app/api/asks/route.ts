import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import {
  createAskProjectForUser,
  listAskProjectSummaries,
  serializeAskProjectSummary,
} from "@/lib/asks";
import { db } from "@/lib/db";

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = listAskProjectSummaries(access.workspace.id);

  const members = db.listMemberships(access.workspace.id).map((m) => {
    const user = db.getUserById(m.user_id);
    return {
      userId: m.user_id,
      name: user?.name || "Unknown",
      email: user?.email || "",
      role: m.role,
    };
  });

  return NextResponse.json({ projects, members });
}

export async function POST(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    aim?: string;
    objective?: string;
  };
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const project = createAskProjectForUser({
    workspaceId: access.workspace.id,
    userId: access.user.id,
    title,
    aim: body.aim,
    objective: body.objective,
  });

  return NextResponse.json({
    project: serializeAskProjectSummary(project),
  });
}
