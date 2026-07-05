"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    const stored = readStoredTheme();
    const next = resolveTheme(stored);
    setThemeState(stored);
    setResolved(next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = resolveTheme("system");
      setResolved(next);
      applyTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    const resolvedNext = resolveTheme(next);
    setResolved(resolvedNext);
    applyTheme(resolvedNext);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolved === "light" ? "dark" : "light");
  }, [resolved, setTheme]);

  const value = useMemo(
    () => ({ theme, resolved, setTheme, toggleTheme }),
    [theme, resolved, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme ThemeProvider ichida ishlatilishi kerak");
  return ctx;
}
