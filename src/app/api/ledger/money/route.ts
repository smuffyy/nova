import { NextResponse } from "next/server";
import { accessHas, getSessionAccess } from "@/lib/access";
import { getDemoLedgerMoney } from "@/lib/ledger/money";
import { rolesWithMoneyAccess } from "@/lib/roles";

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!accessHas(access, "finance.money")) {
    return NextResponse.json(
      {
        error: "Forbidden",
        code: "FINANCE_MONEY_REQUIRED",
        message:
          "Ledger money is limited to admin roles your workspace configured.",
        allowedRoles: rolesWithMoneyAccess(access.policy).map((r) => ({
          id: r.id,
          label: r.label,
        })),
        yourRole: access.membershipRole,
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    snapshot: getDemoLedgerMoney(),
    role: access.membershipRole,
  });
}
