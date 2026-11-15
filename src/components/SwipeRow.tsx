"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export type SwipeAction = {
  id: string;
  label: string;
  tone?: "neutral" | "accent" | "danger";
  onClick: () => void;
};

type SwipeRowProps = {
  children: ReactNode;
  actions: SwipeAction[];
  className?: string;
  frontClassName?: string;
  active?: boolean;
  pinned?: boolean;
  onSelect?: () => void;
  /** Width reserved for action strip when open */
  actionWidth?: number;
};

const OPEN_THRESHOLD = 48;

export function SwipeRow({
  children,
  actions,
  className = "",
  frontClassName = "",
  active = false,
  pinned = false,
  onSelect,
  actionWidth = 148,
}: SwipeRowProps) {
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const moved = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  const max = Math.min(actionWidth, Math.max(72, actions.length * 72));

  const close = useCallback(() => {
    setOpen(false);
    setOffset(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: PointerEvent) {
      if (!rowRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open, close]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-swipe-action], [data-swipe-more]")) {
      return;
    }
    startX.current = e.clientX;
    startOffset.current = open ? -max : 0;
    moved.current = false;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 6) moved.current = true;
    const next = Math.min(0, Math.max(-max, startOffset.current + dx));
    setOffset(next);
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (!moved.current) {
      if (open) close();
      else onSelect?.();
      return;
    }
    const shouldOpen = offset < -OPEN_THRESHOLD;
    setOpen(shouldOpen);
    setOffset(shouldOpen ? -max : 0);
  }

  function toggleMore(e: MouseEvent) {
    e.stopPropagation();
    if (open) close();
    else {
      setOpen(true);
      setOffset(-max);
    }
  }

  return (
    <div
      ref={rowRef}
      className={`swipe-row ${active ? "is-active" : ""} ${
        pinned ? "is-pinned" : ""
      } ${open ? "is-open" : ""} ${dragging ? "is-dragging" : ""} ${className}`}
      aria-labelledby={labelId}
    >
      <div className="swipe-row__actions" aria-hidden={!open}>
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            data-swipe-action
            className={`swipe-row__action swipe-row__action--${a.tone || "neutral"}`}
            onClick={(e) => {
              e.stopPropagation();
              close();
              a.onClick();
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div
        id={labelId}
        className={`swipe-row__front ${frontClassName}`}
        style={{
          transform: `translate3d(${offset}px,0,0)`,
          transition: dragging ? "none" : "transform 180ms ease",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.();
          }
        }}
      >
        <div className="swipe-row__body">{children}</div>
        <button
          type="button"
          data-swipe-more
          className="swipe-row__more"
          aria-label={open ? "Hide actions" : "More actions"}
          aria-expanded={open}
          onClick={toggleMore}
        >
          <span aria-hidden>···</span>
        </button>
      </div>
    </div>
  );
}
