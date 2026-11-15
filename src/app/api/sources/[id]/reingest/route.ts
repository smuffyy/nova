import { NextResponse } from "next/server";
import { accessHas, getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { ingestSource } from "@/lib/ingest";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const source = db.getSource(id);
  if (!source || source.workspace_id !== access.workspace.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPersonal =
    source.scope === "personal" && source.user_id === access.user.id;
  const isCompany =
    (source.scope || "company") === "company" &&
    accessHas(access, "dojo.company");

  if (!isPersonal && !isCompany) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ingestSource(id);
  return NextResponse.json({ source: db.getSource(id) });
}
