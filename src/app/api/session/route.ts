import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: access.user.id,
      name: access.user.name,
      email: access.user.email,
    },
    workspace: {
      id: access.workspace.id,
      name: access.workspace.name,
      slug: access.workspace.slug,
    },
    role: access.membershipRole,
    capabilities: access.capabilities,
    canFinanceMoney: access.capabilities.includes("finance.money"),
    canManageRoles: access.capabilities.includes("roles.manage"),
    canTrainCompany: access.capabilities.includes("dojo.company"),
  });
}
