import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { accessHas, getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { ingestSource } from "@/lib/ingest";

const CONNECTOR_TYPES = new Set(["books", "calendar", "email"]);

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

export async function POST(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    !accessHas(access, "dojo.company") &&
    !accessHas(access, "finance.money")
  ) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message:
          "Connectors need Library (dojo.company) or Money (finance.money) access.",
      },
      { status: 403 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const typeRaw = form.get("type");
  const type =
    typeof typeRaw === "string" ? typeRaw.trim().toLowerCase() : "";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (!CONNECTOR_TYPES.has(type)) {
    return NextResponse.json(
      { error: "type must be books, calendar, or email" },
      { status: 400 }
    );
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
  const prefixedName = `[${type}] ${file.name}`;
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
    filename: prefixedName,
    mime_type: mime,
    storage_path: rel,
    status: "pending",
    scope: "company",
    user_id: null,
    folder_id: null,
  });

  await ingestSource(sourceId);
  return NextResponse.json({
    source: db.getSource(sourceId),
    connectorType: type,
  });
}
