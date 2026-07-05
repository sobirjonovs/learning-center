export const THEME_STORAGE_KEY = "educenter-theme";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* ignore */
  }
  return "system";
}

export function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}
