import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { accessHas, getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { ingestSource } from "@/lib/ingest";
import { getWorkspaceSources } from "@/lib/retrieve";
import { rolesWithCompanyDojo } from "@/lib/roles";

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

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    sources: getWorkspaceSources(access.workspace.id),
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
    return NextResponse.json(
      {
        error: "Forbidden",
        code: "DOJO_COMPANY_REQUIRED",
        message:
          "Only admin roles can train the company brain. Train your personal Sidekick in Dojo → Mine.",
        allowedRoles: rolesWithCompanyDojo(access.policy).map((r) => r.label),
      },
      { status: 403 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const folderIdRaw = form.get("folderId");
  const folderId =
    typeof folderIdRaw === "string" && folderIdRaw.trim()
      ? folderIdRaw.trim()
      : null;
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
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
  const dir = path.join(process.cwd(), "uploads", access.workspace.id);
  fs.mkdirSync(dir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const rel = path.join(
    "uploads",
    access.workspace.id,
    `${sourceId}-${safeName}`
  );
  const abs = path.join(process.cwd(), rel);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(abs, buffer);

  const mime =
    file.type ||
    (ext === ".csv"
      ? "text/csv"
      : ext === ".xlsx" || ext === ".xls"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
    scope: "company",
    user_id: null,
    folder_id: folderId,
  });

  await ingestSource(sourceId);
  return NextResponse.json({ source: db.getSource(sourceId) });
}

export async function DELETE(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!accessHas(access, "dojo.company")) {
    return NextResponse.json(
      { error: "Forbidden", code: "DOJO_COMPANY_REQUIRED" },
      { status: 403 }
    );
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
    (source.scope || "company") !== "company"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.deleteSource(id);
  const abs = path.join(process.cwd(), source.storage_path);
  if (fs.existsSync(abs)) fs.unlinkSync(abs);

  return NextResponse.json({ ok: true });
}
