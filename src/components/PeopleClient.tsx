"use client";

import { useCallback, useEffect, useState } from "react";

type RolesPayload = {
  canManage: boolean;
  yourRole: string;
  policy: {
    roles: {
      id: string;
      label: string;
      description: string;
      capabilities: string[];
    }[];
  };
  members: {
    userId: string;
    name: string;
    email: string;
    role: string;
  }[];
};

type Invite = {
  id: string;
  code: string;
  role: string;
  createdAt: string;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  revoked: boolean;
  joinUrl: string;
};

export function PeopleClient() {
  const [roles, setRoles] = useState<RolesPayload | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteRole, setInviteRole] = useState("member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    const res = await fetch("/api/workspace/invites");
    if (!res.ok) return;
    const data = await res.json();
    setInvites(data.invites || []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/workspace/roles");
      const data = (await res.json()) as RolesPayload & { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not load roles");
      setRoles(data);
      if (data.canManage) await loadInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [loadInvites]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setMemberRole(userId: string, role: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/workspace/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setMemberRole", userId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function patchCaps(roleId: string, capabilities: string[]) {
    setSaving(true);
    try {
      const res = await fetch("/api/workspace/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setRoleCapabilities",
          roleId,
          capabilities,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  function toggleCap(roleId: string, cap: string, enabled: boolean) {
    if (!roles || roleId === "owner") return;
    const role = roles.policy.roles.find((r) => r.id === roleId);
    if (!role) return;
    const caps = new Set(role.capabilities);
    if (enabled) caps.add(cap);
    else caps.delete(cap);
    void patchCaps(roleId, Array.from(caps));
  }

  async function createInvite() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/workspace/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create invite");
      await loadInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite");
    } finally {
      setSaving(false);
    }
  }

  async function revokeInvite(id: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/workspace/invites/${id}/revoke`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not revoke");
      await loadInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke");
    } finally {
      setSaving(false);
    }
  }

  async function copyInvite(invite: Invite) {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${invite.joinUrl}`
        : invite.joinUrl;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  if (loading) {
    return <p className="text-[var(--muted)]">Loading people…</p>;
  }

  if (!roles?.canManage) {
    return (
      <section className="ledger-locked panel p-8">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
          Restricted
        </p>
        <h2 className="mt-3 text-2xl font-medium">People is admin-only</h2>
        <p className="mt-2 max-w-xl text-[var(--muted)]">
          Your role ({roles?.yourRole || "member"}) cannot manage roles. Ask a
          workspace owner for{" "}
          <span className="text-[var(--fg)]">roles.manage</span>.
        </p>
      </section>
    );
  }

  return (
    <div className="people-page space-y-6">
      <div>
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
          People
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight">
          Who can see what
        </h1>
        <p className="mt-2 max-w-xl text-[var(--muted)]">
          Assign a role to each person. Capability toggles live under Edit
          roles.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <section className="ledger-panel">
        <div className="ledger-panel__head">
          <div>
            <h2>Members</h2>
            <p>Assign a role to each person</p>
          </div>
          {saving ? (
            <span className="text-sm text-[var(--muted)]">Saving…</span>
          ) : null}
        </div>
        <div className="ledger-table-wrap">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {roles.members.map((m) => (
                <tr key={m.userId}>
                  <td>
                    <div>{m.name}</div>
                    <div className="ledger-table__sub">{m.email}</div>
                  </td>
                  <td>
                    <select
                      className="ledger-select"
                      value={m.role}
                      disabled={saving}
                      onChange={(e) =>
                        void setMemberRole(m.userId, e.target.value)
                      }
                    >
                      {roles.policy.roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ledger-panel">
        <div className="ledger-panel__head">
          <div>
            <h2>Invites</h2>
            <p>Share a join link — new or existing users</p>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">
              Role for invitees
            </label>
            <select
              className="ledger-select"
              value={inviteRole}
              disabled={saving}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              {roles.policy.roles
                .filter((r) => r.id !== "owner")
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-primary !px-4 !py-2 text-sm"
            disabled={saving}
            onClick={() => void createInvite()}
          >
            Create invite
          </button>
        </div>
        {invites.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No invites yet.</p>
        ) : (
          <div className="ledger-table-wrap">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Role</th>
                  <th>Uses</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div className="font-mono tracking-wider">{inv.code}</div>
                      <div className="ledger-table__sub">{inv.joinUrl}</div>
                    </td>
                    <td>{inv.role}</td>
                    <td>
                      {inv.useCount}
                      {inv.maxUses != null ? ` / ${inv.maxUses}` : ""}
                    </td>
                    <td>
                      {inv.revoked
                        ? "Revoked"
                        : inv.expiresAt &&
                            new Date(inv.expiresAt).getTime() < Date.now()
                          ? "Expired"
                          : "Active"}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost !px-2 !py-1 text-xs"
                          disabled={inv.revoked}
                          onClick={() => void copyInvite(inv)}
                        >
                          {copiedId === inv.id ? "Copied" : "Copy link"}
                        </button>
                        {!inv.revoked ? (
                          <button
                            type="button"
                            className="btn btn-ghost !px-2 !py-1 text-xs opacity-70 hover:opacity-100"
                            disabled={saving}
                            onClick={() => void revokeInvite(inv.id)}
                          >
                            Revoke
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <details className="people-roles-details">
        <summary>Edit roles</summary>
        <section className="ledger-panel mt-3">
          <div className="ledger-panel__head">
            <div>
              <h2>Role capabilities</h2>
              <p>Money and Company train per role. Owner always keeps full access.</p>
            </div>
            {saving ? (
              <span className="text-sm text-[var(--muted)]">Saving…</span>
            ) : null}
          </div>

          <div className="ledger-role-grid">
            {roles.policy.roles.map((role) => {
              const hasMoney = role.capabilities.includes("finance.money");
              const hasDojo = role.capabilities.includes("dojo.company");
              return (
                <div key={role.id} className="ledger-role-card">
                  <div>
                    <strong>{role.label}</strong>
                    <span>{role.description}</span>
                  </div>
                  <label className="ledger-role-card__cap">
                    <input
                      type="checkbox"
                      checked={hasMoney}
                      disabled={role.id === "owner" || saving}
                      onChange={(e) =>
                        toggleCap(role.id, "finance.money", e.target.checked)
                      }
                    />
                    Money
                  </label>
                  <label className="ledger-role-card__cap">
                    <input
                      type="checkbox"
                      checked={hasDojo || role.id === "owner"}
                      disabled={role.id === "owner" || saving}
                      onChange={(e) =>
                        toggleCap(role.id, "dojo.company", e.target.checked)
                      }
                    />
                    Company train
                  </label>
                </div>
              );
            })}
          </div>
        </section>
      </details>
    </div>
  );
}
