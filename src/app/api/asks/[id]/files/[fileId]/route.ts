import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { assertAskInWorkspace } from "@/lib/asks";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string; fileId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, fileId } = await ctx.params;
  const project = assertAskInWorkspace(id, access.workspace.id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const file = db.getAskFile(fileId);
  if (!file || file.project_id !== id) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  const abs = path.join(process.cwd(), file.storage_path);
  if (!fs.existsSync(abs)) {
    return NextResponse.json({ error: "Missing on disk" }, { status: 404 });
  }
  const buf = fs.readFileSync(abs);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": file.mime_type || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
    },
  });
}
