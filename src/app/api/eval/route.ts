import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { PILOT_EVAL_TEMPLATES } from "@/lib/eval/cases";
import { runEvalSuite } from "@/lib/eval/harness";

/** Admin/dev: run pilot eval suite against current workspace corpus. */
export async function POST() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cases = PILOT_EVAL_TEMPLATES.map((c) => ({
    ...c,
    workspaceId: access.workspace.id,
    userId: access.user.id,
  }));

  const report = await runEvalSuite(cases);
  return NextResponse.json(report);
}
