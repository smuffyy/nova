import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { ingestSource } from "@/lib/ingest";
import { getPersonalSources } from "@/lib/retrieve";

const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/octet-stream",
]);

function resolveSidekick(
  workspaceId: string,
  userId: string,
  sidekickId?: string | null
) {
  if (sidekickId) {
    const sk = db.getSidekick(sidekickId);
    if (
      sk &&
      sk.workspace_id === workspaceId &&
      sk.user_id === userId
    ) {
      return sk;
    }
    return null;
  }
  return db.ensureDefaultSidekick(workspaceId, userId);
}

/** Personal Sidekick library — scoped to a Sidekick profile. */
export async function GET(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sidekickId = new URL(req.url).searchParams.get("sidekickId");
  const sk = resolveSidekick(
    access.workspace.id,
    access.user.id,
    sidekickId
  );
  if (!sk) {
    return NextResponse.json({ error: "Sidekick not found" }, { status: 404 });
  }

  return NextResponse.json({
    sidekickId: sk.id,
    sources: getPersonalSources(access.workspace.id, access.user.id, sk.id),
  });
}

export async function POST(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const sidekickIdRaw = String(form.get("sidekickId") || "");
  const sk = resolveSidekick(
    access.workspace.id,
    access.user.id,
    sidekickIdRaw || null
  );
  if (!sk) {
    return NextResponse.json({ error: "Sidekick not found" }, { status: 404 });
  }

  const ext = path.extname(file.name).toLowerCase();
  const allowedExt = [".pdf", ".docx", ".txt", ".csv", ".md", ".xlsx", ".xls"];
  if (!allowedExt.includes(ext) && !ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Supported: PDF, DOCX, TXT, CSV, MD, XLSX" },
      { status: 400 }
    );
  }

  const sourceId = uuid();
  const dir = path.join(
    process.cwd(),
    "uploads",
    access.workspace.id,
    "personal",
    access.user.id,
    sk.id
  );
  fs.mkdirSync(dir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const rel = path.join(
    "uploads",
    access.workspace.id,
    "personal",
    access.user.id,
    sk.id,
    `${sourceId}-${safeName}`
  );
  const abs = path.join(process.cwd(), rel);
  fs.writeFileSync(abs, Buffer.from(await file.arrayBuffer()));

  const mime =
    file.type ||
    (ext === ".csv"
      ? "text/csv"
      : ext === ".pdf"
        ? "application/pdf"
        : "text/plain");

  db.createSource({
    id: sourceId,
    workspace_id: access.workspace.id,
    filename: file.name,
    mime_type: mime,
    storage_path: rel,
    status: "pending",
    scope: "personal",
    user_id: access.user.id,
    sidekick_id: sk.id,
  });

  await ingestSource(sourceId);
  return NextResponse.json({ source: db.getSource(sourceId), sidekickId: sk.id });
}

export async function DELETE(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const source = db.getSource(id);
  if (
    !source ||
    source.workspace_id !== access.workspace.id ||
    source.scope !== "personal" ||
    source.user_id !== access.user.id
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.deleteSource(id);
  const abs = path.join(process.cwd(), source.storage_path);
  if (fs.existsSync(abs)) fs.unlinkSync(abs);

  return NextResponse.json({ ok: true });
}
