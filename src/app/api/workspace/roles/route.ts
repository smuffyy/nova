import { NextResponse } from "next/server";
import { accessHas, getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";
import {
  CAPABILITY_LABELS,
  normalizeRolePolicy,
  type Capability,
  type WorkspaceRoleDef,
  type WorkspaceRolePolicy,
} from "@/lib/roles";

function serializePolicy(policy: WorkspaceRolePolicy) {
  return {
    roles: policy.roles.map((r) => ({
      ...r,
      capabilityLabels: r.capabilities.map((c) => ({
        id: c,
        label: CAPABILITY_LABELS[c],
      })),
    })),
  };
}

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = db.listMemberships(access.workspace.id).map((m) => {
    const user = db.getUserById(m.user_id);
    return {
      userId: m.user_id,
      name: user?.name || "Unknown",
      email: user?.email || "",
      role: m.role,
    };
  });

  return NextResponse.json({
    policy: serializePolicy(access.policy),
    members,
    yourRole: access.membershipRole,
    canManage: accessHas(access, "roles.manage"),
    capabilities: Object.entries(CAPABILITY_LABELS).map(([id, label]) => ({
      id,
      label,
    })),
  });
}

export async function PATCH(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!accessHas(access, "roles.manage")) {
    return NextResponse.json(
      { error: "Forbidden", code: "ROLES_MANAGE_REQUIRED" },
      { status: 403 }
    );
  }

  const body = (await req.json()) as {
    action?: "setMemberRole" | "setRoleCapabilities";
    userId?: string;
    role?: string;
    roleId?: string;
    capabilities?: Capability[];
  };

  if (body.action === "setMemberRole") {
    if (!body.userId || !body.role) {
      return NextResponse.json(
        { error: "userId and role required" },
        { status: 400 }
      );
    }
    const policy = db.getRolePolicy(access.workspace.id);
    if (!policy.roles.some((r) => r.id === body.role)) {
      return NextResponse.json({ error: "Unknown role" }, { status: 400 });
    }
    // Prevent demoting the last owner
    if (body.role !== "owner") {
      const owners = db
        .listMemberships(access.workspace.id)
        .filter((m) => m.role === "owner");
      const target = db.getMembership(body.userId, access.workspace.id);
      if (target?.role === "owner" && owners.length <= 1) {
        return NextResponse.json(
          { error: "Keep at least one owner" },
          { status: 400 }
        );
      }
    }
    db.updateMembershipRole(body.userId, access.workspace.id, body.role);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "setRoleCapabilities") {
    if (!body.roleId || !Array.isArray(body.capabilities)) {
      return NextResponse.json(
        { error: "roleId and capabilities required" },
        { status: 400 }
      );
    }
    const allowed: Capability[] = [
      "finance.money",
      "roles.manage",
      "dojo.company",
    ];
    const caps = body.capabilities.filter((c): c is Capability =>
      allowed.includes(c)
    );
    const policy = db.getRolePolicy(access.workspace.id);
    const roles: WorkspaceRoleDef[] = policy.roles.map((r) => {
      if (r.id !== body.roleId) return r;
      if (r.id === "owner") {
        return {
          ...r,
          capabilities: ["finance.money", "roles.manage", "dojo.company"],
        };
      }
      return { ...r, capabilities: caps };
    });
    const next = normalizeRolePolicy({ roles });
    db.setRolePolicy(access.workspace.id, next);
    return NextResponse.json({ ok: true, policy: serializePolicy(next) });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
