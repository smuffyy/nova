"use client";

/**
 * Faceless watcher bust — soft emerald, transparent, for MOAC white stage.
 */
export function MoacWatcher({ className = "" }: { className?: string }) {
  return (
    <div className={`axiom-watcher ${className}`} aria-hidden>
      <img
        className="axiom-watcher-img"
        src="/brand/moac-watcher.png?v=14"
        alt=""
        width={975}
        height={1191}
        draggable={false}
      />
    </div>
  );
}
