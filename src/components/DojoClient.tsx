"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SidekickSkills } from "@/components/SidekickSkills";

type Scope = "company" | "mine";

type SourceRow = {
  id: string;
  filename: string;
  status: string;
  error_message: string | null;
  updated_at: string;
  mime_type?: string;
  folder_id?: string | null;
};

type Folder = { id: string; name: string };

type SidekickRow = {
  id: string;
  name: string;
  description: string;
  fileCount: number;
  readyCount: number;
  skillIds?: string[];
  activeSkillIds?: string[];
};

function fileKind(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ext || "file";
}

export function DojoClient({
  mode = "both",
}: {
  mode?: "both" | "company" | "mine";
}) {
  const [tab, setTab] = useState<Scope>(mode === "mine" ? "mine" : "company");
  const [company, setCompany] = useState<SourceRow[]>([]);
  const [personal, setPersonal] = useState<SourceRow[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [sidekicks, setSidekicks] = useState<SidekickRow[]>([]);
  const [sidekickId, setSidekickId] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [canTrain, setCanTrain] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "company") setTab("company");
    if (mode === "mine") setTab("mine");
  }, [mode]);

  const activeSidekick = useMemo(
    () => sidekicks.find((s) => s.id === sidekickId) || sidekicks[0] || null,
    [sidekicks, sidekickId]
  );

  const loadSidekicks = useCallback(async () => {
    const res = await fetch("/api/sidekicks");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load Sidekicks");
    const list = (data.sidekicks || []) as SidekickRow[];
    setSidekicks(list);
    setSidekickId((prev) => {
      if (prev && list.some((s) => s.id === prev)) return prev;
      return list[0]?.id || null;
    });
    return list;
  }, []);

  const loadCompany = useCallback(async () => {
    const [c, f] = await Promise.all([
      fetch("/api/sources").then((r) => r.json()),
      fetch("/api/dojo/folders").then((r) => r.json()),
    ]);
    setCompany(c.sources || []);
    setCanTrain(Boolean(c.canTrain));
    setFolders(f.folders || c.folders || []);
  }, []);

  const loadPersonal = useCallback(async (id: string | null) => {
    if (!id) {
      setPersonal([]);
      return;
    }
    const res = await fetch(
      `/api/personal/sources?sidekickId=${encodeURIComponent(id)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load files");
    setPersonal(data.sources || []);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([loadCompany(), loadSidekicks()]);
      } catch {
        setError("Could not load Dojo");
      }
    })();
  }, [loadCompany, loadSidekicks]);

  useEffect(() => {
    void loadPersonal(sidekickId).catch(() =>
      setError("Could not load Sidekick files")
    );
  }, [sidekickId, loadPersonal]);

  const refresh = useCallback(async () => {
    const list = await loadSidekicks();
    await loadCompany();
    const id =
      (sidekickId && list.some((s) => s.id === sidekickId)
        ? sidekickId
        : list[0]?.id) || null;
    await loadPersonal(id);
  }, [loadSidekicks, loadCompany, loadPersonal, sidekickId]);

  const rows = useMemo(() => {
    let list = tab === "company" ? company : personal;
    if (tab === "company" && folderFilter !== "all") {
      list =
        folderFilter === "unfiled"
          ? list.filter((s) => !s.folder_id)
          : list.filter((s) => s.folder_id === folderFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }
    if (typeFilter !== "all") {
      list = list.filter((s) => fileKind(s.filename) === typeFilter);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((s) => s.filename.toLowerCase().includes(q));
    }
    return list;
  }, [
    tab,
    company,
    personal,
    folderFilter,
    statusFilter,
    typeFilter,
    query,
  ]);

  const canUpload = tab === "mine" || canTrain;
  const types = useMemo(() => {
    const set = new Set(
      (tab === "company" ? company : personal).map((s) => fileKind(s.filename))
    );
    return Array.from(set).sort();
  }, [tab, company, personal]);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    if (!canUpload) {
      setError(
        "Only admin roles can train the company brain. Switch to Mine for your Sidekick."
      );
      return;
    }
    if (tab === "mine" && !activeSidekick) {
      setError("Create a Sidekick first, then upload files to train it.");
      return;
    }
    setUploading(true);
    setError("");
    const endpoint =
      tab === "company" ? "/api/sources" : "/api/personal/sources";
    try {
      for (const file of list) {
        const form = new FormData();
        form.append("file", file);
        if (
          tab === "company" &&
          folderFilter !== "all" &&
          folderFilter !== "unfiled"
        ) {
          form.append("folderId", folderFilter);
        }
        if (tab === "mine" && activeSidekick) {
          form.append("sidekickId", activeSidekick.id);
        }
        const res = await fetch(endpoint, { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || data.error || "Upload failed");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    const endpoint =
      tab === "company"
        ? `/api/sources?id=${id}`
        : `/api/personal/sources?id=${id}`;
    const res = await fetch(endpoint, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Delete failed");
      return;
    }
    await refresh();
  }

  async function reingest(id: string) {
    const res = await fetch(`/api/sources/${id}/reingest`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Re-ingest failed");
      return;
    }
    await refresh();
  }

  async function createFolder() {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    const res = await fetch("/api/dojo/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create folder");
      return;
    }
    await refresh();
  }

  async function moveToFolder(sourceId: string, folderId: string | null) {
    const res = await fetch("/api/dojo/folders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId, folderId }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Move failed");
      return;
    }
    await refresh();
  }

  async function createSidekick() {
    const name = window.prompt("Sidekick name (e.g. Coding, Manufacturing)");
    if (!name?.trim()) return;
    const description =
      window.prompt("Short description (optional)") || undefined;
    const res = await fetch("/api/sidekicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description?.trim() || "",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create Sidekick");
      return;
    }
    setSidekickId(data.sidekick.id);
    await refresh();
  }

  async function renameSidekick() {
    if (!activeSidekick) return;
    const name = window.prompt("Rename Sidekick", activeSidekick.name);
    if (!name?.trim() || name.trim() === activeSidekick.name) return;
    const res = await fetch("/api/sidekicks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activeSidekick.id, name: name.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not rename");
      return;
    }
    await refresh();
  }

  async function deleteSidekick() {
    if (!activeSidekick) return;
    if (sidekicks.length <= 1) {
      setError("Keep at least one Sidekick");
      return;
    }
    if (
      !window.confirm(
        `Delete “${activeSidekick.name}”? Files move to another Sidekick.`
      )
    ) {
      return;
    }
    const res = await fetch(
      `/api/sidekicks?id=${encodeURIComponent(activeSidekick.id)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete");
      return;
    }
    if (data.fallbackId) setSidekickId(data.fallbackId);
    await refresh();
  }

  const title =
    mode === "company"
      ? {
          eyebrow: "Library",
          heading: "Company knowledge",
          sub: "Train the shared brain. One drop zone — cite or refuse.",
        }
      : mode === "mine"
        ? {
            eyebrow: "My files",
            heading: "Your Sidekicks",
            sub: "Each Sidekick has its own private shelf. Chat in Sidekick mode picks which profile to ask.",
          }
        : {
            eyebrow: "Training Dojo",
            heading: "Train what the brain knows",
            sub: "Upload PDF, Word, Excel, CSV, text. Admins train the company brain; everyone trains personal Sidekick shelves.",
          };

  return (
    <div className="dojo-live space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--mineral)] uppercase">
            {title.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-wide sm:text-4xl">
            {title.heading}
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">{title.sub}</p>
        </div>
        {mode === "both" ? (
          <div className="dojo-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "company"}
              className={tab === "company" ? "is-active" : ""}
              onClick={() => setTab("company")}
            >
              Company
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "mine"}
              className={tab === "mine" ? "is-active" : ""}
              onClick={() => setTab("mine")}
            >
              Mine
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      {tab === "mine" ? (
        <div className="dojo-sidekick-bar flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--muted)]">Sidekick</span>
            <select
              className="ledger-select"
              value={activeSidekick?.id || ""}
              onChange={(e) => setSidekickId(e.target.value)}
            >
              {sidekicks.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.readyCount}/{s.fileCount} ready
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-ghost !py-1.5 text-sm"
            onClick={() => void createSidekick()}
          >
            New Sidekick
          </button>
          {activeSidekick ? (
            <>
              <button
                type="button"
                className="btn btn-ghost !py-1.5 text-sm"
                onClick={() => void renameSidekick()}
              >
                Rename
              </button>
              <button
                type="button"
                className="btn btn-ghost !py-1.5 text-sm"
                onClick={() => void deleteSidekick()}
                disabled={sidekicks.length <= 1}
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {tab === "mine" && activeSidekick ? (
        <SidekickSkills
          sidekickId={activeSidekick.id}
          sidekickName={activeSidekick.name}
          equippedIds={activeSidekick.skillIds || []}
          activeIds={activeSidekick.activeSkillIds || []}
          onEquippedChange={(skillIds, activeSkillIds) => {
            void (async () => {
              const res = await fetch("/api/sidekicks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: activeSidekick.id,
                  skillIds,
                  activeSkillIds,
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                setError(data.error || "Could not update skills");
                return;
              }
              await loadSidekicks();
            })();
          }}
        />
      ) : null}

      <div
        className={`dojo-dropzone ${dragOver ? "is-over" : ""} ${!canUpload ? "is-locked" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (canUpload) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => canUpload && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.docx,.txt,.csv,.md,.xlsx,.xls"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="dojo-dropzone__title">
          {uploading
            ? "Training…"
            : tab === "company"
              ? canTrain
                ? "Drop manuals to train the company"
                : "Company training is admin-only"
              : `Drop manuals to train ${activeSidekick?.name || "your Sidekick"}`}
        </p>
        <p className="dojo-dropzone__sub">
          PDF, DOCX, XLSX, CSV, TXT, MD · drag & drop or click
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input !max-w-xs"
          placeholder="Search filenames…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="ledger-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All status</option>
          <option value="ready">ready</option>
          <option value="processing">processing</option>
          <option value="pending">pending</option>
          <option value="error">error</option>
        </select>
        {mode !== "company" ? (
          <select
            className="ledger-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                .{t}
              </option>
            ))}
          </select>
        ) : null}
        {tab === "company" && mode !== "company" ? (
          <>
            <select
              className="ledger-select"
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
            >
              <option value="all">All folders</option>
              <option value="unfiled">Unfiled</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {canTrain ? (
              <button
                type="button"
                className="btn btn-ghost !py-1.5 text-sm"
                onClick={() => void createFolder()}
              >
                New folder
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      <section className="dojo-library panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-sm font-medium tracking-wide">
            {tab === "company"
              ? "Company library"
              : `${activeSidekick?.name || "Sidekick"} shelf`}
          </h2>
          <span className="text-xs text-[var(--muted)]">
            {rows.length} file{rows.length === 1 ? "" : "s"}
          </span>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-sm text-[var(--muted)]">
            Nothing matched — upload or clear filters.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {rows.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {s.filename}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    {s.status}
                    {s.error_message ? ` · ${s.error_message}` : ""}
                    {" · "}
                    {s.updated_at.slice(0, 10)}
                    {mode !== "company" && s.folder_id
                      ? ` · ${folders.find((f) => f.id === s.folder_id)?.name || "folder"}`
                      : ""}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {tab === "company" && canTrain && mode !== "company" ? (
                    <select
                      className="ledger-select"
                      value={s.folder_id || ""}
                      onChange={(e) =>
                        void moveToFolder(
                          s.id,
                          e.target.value ? e.target.value : null
                        )
                      }
                    >
                      <option value="">Unfiled</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {(tab === "mine" || canTrain) && (
                    <>
                      {mode !== "company" ? (
                        <button
                          type="button"
                          className="btn btn-ghost !px-2 !py-1 text-xs"
                          onClick={() => void reingest(s.id)}
                        >
                          Re-ingest
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn-ghost !px-2 !py-1 text-xs opacity-70 hover:opacity-100"
                        onClick={() => void remove(s.id)}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
