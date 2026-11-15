import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { accessHas, getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    folders: db.listDojoFolders(access.workspace.id),
    canTrain: accessHas(access, "dojo.company"),
  });
}

export async function POST(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!accessHas(access, "dojo.company")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { name?: string };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const folder = db.createDojoFolder({
    id: uuid(),
    workspace_id: access.workspace.id,
    name,
  });
  return NextResponse.json({ folder });
}

export async function PATCH(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!accessHas(access, "dojo.company")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    id?: string;
    name?: string;
    sourceId?: string;
    folderId?: string | null;
  };

  if (body.sourceId) {
    const source = db.getSource(body.sourceId);
    if (!source || source.workspace_id !== access.workspace.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    db.updateSource(body.sourceId, {
      folder_id: body.folderId === undefined ? null : body.folderId,
    });
    return NextResponse.json({ ok: true });
  }

  if (!body.id || !body.name?.trim()) {
    return NextResponse.json({ error: "id and name required" }, { status: 400 });
  }
  const folder = db.renameDojoFolder(body.id, body.name);
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ folder });
}

export async function DELETE(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!accessHas(access, "dojo.company")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  db.deleteDojoFolder(id);
  return NextResponse.json({ ok: true });
}
