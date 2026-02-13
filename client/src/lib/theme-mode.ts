export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "fit-insights-theme-mode";

export function normalizeThemeMode(value: unknown): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return normalizeThemeMode(window.localStorage.getItem(STORAGE_KEY));
}

export function applyThemeMode(value: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", value === "dark");
}

export function setThemeMode(value: ThemeMode) {
  if (typeof window === "undefined") return;
  const normalized = normalizeThemeMode(value);
  window.localStorage.setItem(STORAGE_KEY, normalized);
  applyThemeMode(normalized);
}

export function initializeThemeMode() {
  if (typeof window === "undefined") return;
  applyThemeMode(getThemeMode());
}
