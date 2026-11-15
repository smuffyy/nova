"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type SkillTokenRow = {
  id: string;
  name: string;
  topic: string;
  body: string;
  bullets: string[];
  proficiency: number;
  proficiencyLabel: string;
};

type SidekickSkillsProps = {
  sidekickId: string | null;
  sidekickName?: string;
  equippedIds: string[];
  activeIds: string[];
  onEquippedChange: (skillIds: string[], activeSkillIds: string[]) => void;
};

function levelClass(n: number) {
  if (n >= 3) return "is-sme";
  if (n === 2) return "is-working";
  return "is-emerging";
}

export function SidekickSkills({
  sidekickId,
  sidekickName,
  equippedIds,
  activeIds,
  onEquippedChange,
}: SidekickSkillsProps) {
  const [skills, setSkills] = useState<SkillTokenRow[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/skills");
    const data = await res.json();
    if (res.ok) setSkills(data.skills || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const equipped = useMemo(
    () => skills.filter((s) => equippedIds.includes(s.id)),
    [skills, equippedIds]
  );
  const pool = useMemo(
    () => skills.filter((s) => !equippedIds.includes(s.id)),
    [skills, equippedIds]
  );

  async function mintToken(e: React.FormEvent) {
    e.preventDefault();
    const label = name.trim();
    if (!label || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: label,
          equipToSidekickId: sidekickId || undefined,
          activate: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not mint skill");
      setName("");
      await load();
      if (sidekickId && data.skill?.id) {
        const nextEquipped = [...new Set([...equippedIds, data.skill.id])];
        const nextActive = [...new Set([...activeIds, data.skill.id])];
        onEquippedChange(nextEquipped, nextActive);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mint skill");
    } finally {
      setBusy(false);
    }
  }

  function equip(id: string) {
    if (!sidekickId) return;
    const nextEquipped = [...new Set([...equippedIds, id])];
    const nextActive =
      activeIds.length === 0
        ? [id]
        : activeIds.includes(id)
          ? activeIds
          : [...activeIds, id];
    onEquippedChange(nextEquipped, nextActive);
  }

  function unequip(id: string) {
    onEquippedChange(
      equippedIds.filter((x) => x !== id),
      activeIds.filter((x) => x !== id)
    );
  }

  function toggleActive(id: string) {
    if (!equippedIds.includes(id)) return;
    if (activeIds.includes(id)) {
      onEquippedChange(
        equippedIds,
        activeIds.filter((x) => x !== id)
      );
    } else {
      onEquippedChange(equippedIds, [...activeIds, id]);
    }
  }

  async function bumpProficiency(id: string, proficiency: 1 | 2 | 3) {
    const res = await fetch(`/api/skills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proficiency }),
    });
    if (res.ok) await load();
  }

  async function removeToken(id: string) {
    const res = await fetch(`/api/skills/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    unequip(id);
    await load();
  }

  return (
    <section className="sk-skills">
      <div className="sk-skills__head">
        <div>
          <p className="sk-skills__eyebrow">Skills</p>
          <h2 className="sk-skills__title">Skill tokens</h2>
          <p className="sk-skills__sub">
            Mint any topic (robots, python, PLC…). Drag a token onto{" "}
            {sidekickName || "your Sidekick"} to equip it as an SME lane. Toggle
            active for “now working.” General questions still work.
          </p>
        </div>
      </div>

      {error ? <p className="sk-skills__error">{error}</p> : null}

      <form className="sk-skills__mint" onSubmit={(e) => void mintToken(e)}>
        <input
          className="input"
          placeholder="Mint a skill — e.g. Robots, Python, PLC…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || !name.trim()}
        >
          {busy ? "Minting…" : "Mint token"}
        </button>
      </form>

      <div
        className={`sk-skills__dock ${dragOver ? "is-over" : ""} ${
          !sidekickId ? "is-locked" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (sidekickId) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const id = e.dataTransfer.getData("text/skill-token");
          if (id) equip(id);
        }}
      >
        <div className="sk-skills__dock-label">
          Equipped on {sidekickName || "Sidekick"} — drop tokens here
        </div>
        {equipped.length === 0 ? (
          <p className="sk-skills__empty">
            No skills equipped yet. Mint one or drag from the pool below.
          </p>
        ) : (
          <div className="sk-skills__tokens">
            {equipped.map((s) => {
              const active = activeIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  className={`sk-token sk-token--equipped ${levelClass(
                    s.proficiency
                  )} ${active ? "is-active" : ""}`}
                  title={s.body}
                >
                  <button
                    type="button"
                    className="sk-token__main"
                    onClick={() => toggleActive(s.id)}
                  >
                    <span className="sk-token__name">{s.name}</span>
                    <span className="sk-token__meta">
                      {active ? "Now working · " : ""}
                      {s.proficiencyLabel}
                    </span>
                  </button>
                  <div className="sk-token__actions">
                    <button
                      type="button"
                      className="sk-token__btn"
                      onClick={() => {
                        const next = Math.min(3, s.proficiency + 1) as 1 | 2 | 3;
                        void bumpProficiency(s.id, next);
                      }}
                      title="Grow proficiency"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="sk-token__btn"
                      onClick={() => unequip(s.id)}
                      title="Unequip"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="sk-skills__pool">
        <div className="sk-skills__dock-label">Token pool — drag onto Sidekick</div>
        {pool.length === 0 ? (
          <p className="sk-skills__empty">
            {skills.length === 0
              ? "No tokens yet — mint your first skill above."
              : "All tokens are equipped."}
          </p>
        ) : (
          <div className="sk-skills__tokens">
            {pool.map((s) => (
              <div
                key={s.id}
                className={`sk-token ${levelClass(s.proficiency)}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/skill-token", s.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                title={s.body}
              >
                <span className="sk-token__name">{s.name}</span>
                <span className="sk-token__meta">{s.proficiencyLabel}</span>
                <div className="sk-token__actions">
                  <button
                    type="button"
                    className="sk-token__btn"
                    onClick={() => equip(s.id)}
                    disabled={!sidekickId}
                  >
                    Equip
                  </button>
                  <button
                    type="button"
                    className="sk-token__btn"
                    onClick={() => void removeToken(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
