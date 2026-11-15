"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Source = {
  id: string;
  filename: string;
  mime_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export function SourcesClient() {
  const [sources, setSources] = useState<Source[]>([]);
  const [canTrain, setCanTrain] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/sources");
    const data = await res.json();
    setSources(data.sources || []);
    setCanTrain(Boolean(data.canTrain));
  }

  useEffect(() => {
    void load();
  }, []);

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/sources", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Upload failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/sources?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Delete failed");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-medium tracking-wide">Sources</h1>
          <p className="mt-2 text-[var(--muted)]">
            Company brain files. Prefer{" "}
            <Link href="/app/workspace/library" className="text-[var(--fg)] underline-offset-2 hover:underline">
              Workspace → Library
            </Link>{" "}
            for company training, or{" "}
            <Link href="/app/files" className="text-[var(--fg)] underline-offset-2 hover:underline">
              My files
            </Link>{" "}
            for personal Sidekicks.
          </p>
        </div>
        {canTrain ? (
          <label className="btn btn-primary cursor-pointer">
            {uploading ? "Uploading…" : "Upload source"}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,.csv,.md"
              disabled={uploading}
              onChange={(e) => void onUpload(e.target.files?.[0] || null)}
            />
          </label>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Read-only · admin trains in Workspace → Library · you train in My files
          </p>
        )}
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-[var(--muted)]">
                  No company sources yet.
                </td>
              </tr>
            ) : (
              sources.map((s) => (
                <tr key={s.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3">{s.filename}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        s.status === "ready"
                          ? "text-[var(--accent)]"
                          : s.status === "error"
                            ? "text-[var(--danger)]"
                            : "text-[var(--mineral)]"
                      }
                    >
                      {s.status}
                    </span>
                    {s.error_message ? (
                      <div className="mt-1 text-xs text-[var(--danger)]">
                        {s.error_message}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{s.updated_at}</td>
                  <td className="px-4 py-3 text-right">
                    {canTrain ? (
                      <button
                        onClick={() => void remove(s.id)}
                        className="text-[var(--muted)] hover:text-[var(--danger)]"
                      >
                        Delete
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
