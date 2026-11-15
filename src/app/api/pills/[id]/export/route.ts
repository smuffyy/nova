import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";
import {
  buildPortableMarkdown,
  parsePillDetail,
  pillDownloadName,
} from "@/lib/pills";

function ownPill(pillId: string, workspaceId: string, userId: string) {
  const pill = db.getPill(pillId);
  if (!pill) return null;
  if (pill.workspace_id !== workspaceId || pill.user_id !== userId) return null;
  return pill;
}

/** Download portable .pill.md for ChatGPT / Claude / Gemini / etc. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pill = ownPill(id, access.workspace.id, access.user.id);
  if (!pill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const detail = parsePillDetail(pill.detail_json);
  const markdown =
    pill.export_md?.trim() || buildPortableMarkdown(pill, detail);
  const filename = pillDownloadName(pill);

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
