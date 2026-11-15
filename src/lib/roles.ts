/**
 * Workspace roles → capabilities.
 * Admin-configured roles decide who trains company memory and who sees Ledger money.
 */

export type Capability = "finance.money" | "roles.manage" | "dojo.company";

export type WorkspaceRoleDef = {
  id: string;
  label: string;
  description: string;
  capabilities: Capability[];
  /** System roles cannot be deleted */
  system?: boolean;
};

export type WorkspaceRolePolicy = {
  roles: WorkspaceRoleDef[];
};

export const CAPABILITY_LABELS: Record<Capability, string> = {
  "finance.money": "Ledger money dashboard (cash, P&L, payables)",
  "roles.manage": "Assign roles and edit role capabilities",
  "dojo.company": "Train the company brain (upload/delete shared sources)",
};

export const ALL_CAPABILITIES: Capability[] = [
  "finance.money",
  "roles.manage",
  "dojo.company",
];

export const DEFAULT_ROLE_POLICY: WorkspaceRolePolicy = {
  roles: [
    {
      id: "owner",
      label: "Owner",
      description: "Full control: company train, finance, and roles.",
      capabilities: ["finance.money", "roles.manage", "dojo.company"],
      system: true,
    },
    {
      id: "admin",
      label: "Admin",
      description: "Train company memory, see money, manage roles.",
      capabilities: ["finance.money", "roles.manage", "dojo.company"],
      system: true,
    },
    {
      id: "finance",
      label: "Finance admin",
      description: "Sees Ledger money; cannot train company or edit roles.",
      capabilities: ["finance.money"],
      system: true,
    },
    {
      id: "member",
      label: "Member",
      description: "Uses company brain + trains a personal Sidekick only.",
      capabilities: [],
      system: true,
    },
  ],
};

export function normalizeRolePolicy(
  raw: WorkspaceRolePolicy | null | undefined
): WorkspaceRolePolicy {
  if (!raw?.roles?.length) return structuredClone(DEFAULT_ROLE_POLICY);
  const byId = new Map(raw.roles.map((r) => [r.id, r]));
  for (const def of DEFAULT_ROLE_POLICY.roles) {
    if (!byId.has(def.id)) byId.set(def.id, structuredClone(def));
  }
  // Merge newly introduced capabilities onto system admin/owner if missing from old stores
  for (const id of ["owner", "admin"] as const) {
    const row = byId.get(id);
    if (!row) continue;
    const caps = new Set(row.capabilities);
    for (const c of DEFAULT_ROLE_POLICY.roles.find((r) => r.id === id)!
      .capabilities) {
      caps.add(c);
    }
    byId.set(id, { ...row, capabilities: Array.from(caps) as Capability[] });
  }
  return { roles: Array.from(byId.values()) };
}

export function getRoleDef(
  policy: WorkspaceRolePolicy,
  roleId: string
): WorkspaceRoleDef {
  const found = policy.roles.find((r) => r.id === roleId);
  if (found) return found;
  return (
    policy.roles.find((r) => r.id === "member") ||
    DEFAULT_ROLE_POLICY.roles.find((r) => r.id === "member")!
  );
}

export function capabilitiesForRole(
  policy: WorkspaceRolePolicy,
  roleId: string
): Set<Capability> {
  return new Set(getRoleDef(policy, roleId).capabilities);
}

export function hasCapability(
  policy: WorkspaceRolePolicy,
  roleId: string,
  cap: Capability
): boolean {
  return capabilitiesForRole(policy, roleId).has(cap);
}

export function rolesWithMoneyAccess(policy: WorkspaceRolePolicy): WorkspaceRoleDef[] {
  return policy.roles.filter((r) => r.capabilities.includes("finance.money"));
}

export function rolesWithCompanyDojo(policy: WorkspaceRolePolicy): WorkspaceRoleDef[] {
  return policy.roles.filter((r) => r.capabilities.includes("dojo.company"));
}
