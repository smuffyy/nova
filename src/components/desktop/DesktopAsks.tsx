"use client";

import { AsksDetailClient } from "@/components/asks/AsksDetailClient";

export function DesktopAsks({
  selectedId,
  onSelect,
  onChanged,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChanged?: () => void;
}) {
  if (!selectedId) {
    return (
      <div className="desk-asks">
        <header className="desk-asks__hero">
          <h1>Asks</h1>
          <p>
            Pick an ask from history, or create a new one. Active and pending
            tasks show in the side rail.
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="desk-asks desk-asks--detail">
      <AsksDetailClient
        projectId={selectedId}
        onBack={() => {
          onSelect(null);
          onChanged?.();
        }}
        onMutate={onChanged}
        onDeleted={() => {
          onSelect(null);
          onChanged?.();
        }}
      />
    </div>
  );
}
