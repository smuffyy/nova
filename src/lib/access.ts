import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  capabilitiesForRole,
  hasCapability,
  type Capability,
  type WorkspaceRolePolicy,
} from "@/lib/roles";

export type SessionAccess = {
  user: NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];
  workspace: NonNullable<Awaited<ReturnType<typeof getSession>>>["workspace"];
  membershipRole: string;
  policy: WorkspaceRolePolicy;
  capabilities: Capability[];
};

export async function getSessionAccess(): Promise<SessionAccess | null> {
  const session = await getSession();
  if (!session) return null;
  const membership = db.getMembership(session.user.id, session.workspace.id);
  const membershipRole = membership?.role || "member";
  const policy = db.getRolePolicy(session.workspace.id);
  const caps = capabilitiesForRole(policy, membershipRole);
  return {
    user: session.user,
    workspace: session.workspace,
    membershipRole,
    policy,
    capabilities: Array.from(caps),
  };
}

export function accessHas(
  access: SessionAccess,
  capability: Capability
): boolean {
  return hasCapability(access.policy, access.membershipRole, capability);
}
