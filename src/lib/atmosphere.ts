export const ATMOSPHERE_STORAGE_KEY = "moac-atmosphere-id";
export const ATMOSPHERE_LAST_KEY = "moac-atmosphere-last";

export type AtmosphereId = "white" | "soft-white" | "cool-white";

export type Atmosphere = {
  id: AtmosphereId;
  label: string;
  mood: "light" | "dark" | "any";
  wash: string;
  overlay: string;
};

/** Clean white surfaces — no tinted washes. */
export const ATMOSPHERES: Atmosphere[] = [
  {
    id: "white",
    label: "White",
    mood: "any",
    wash: "#ffffff",
    overlay: "transparent",
  },
  {
    id: "soft-white",
    label: "Soft white",
    mood: "any",
    wash: "#fafafa",
    overlay: "transparent",
  },
  {
    id: "cool-white",
    label: "Cool white",
    mood: "any",
    wash: "#f7f8fa",
    overlay: "transparent",
  },
];

export function atmosphereById(id: string | null | undefined): Atmosphere {
  return ATMOSPHERES.find((a) => a.id === id) || ATMOSPHERES[0];
}

/** Pick a different atmosphere than last time (close → open). */
export function nextAtmosphere(_theme: "light" | "dark" = "light"): Atmosphere {
  const pool = ATMOSPHERES;
  let last: string | null = null;
  try {
    last = window.localStorage.getItem(ATMOSPHERE_LAST_KEY);
  } catch {
    /* ignore */
  }
  const candidates = pool.filter((a) => a.id !== last);
  const pickFrom = candidates.length ? candidates : pool;
  const next = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  try {
    window.localStorage.setItem(ATMOSPHERE_LAST_KEY, next.id);
    window.sessionStorage.setItem(ATMOSPHERE_STORAGE_KEY, next.id);
  } catch {
    /* ignore */
  }
  return next;
}

export function applyAtmosphere(atm: Atmosphere) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--atmosphere-wash", atm.wash.trim());
  root.style.setProperty("--atmosphere-overlay", atm.overlay.trim());
  root.style.removeProperty("--atmosphere-image");
  root.dataset.atmosphere = atm.id;
}
