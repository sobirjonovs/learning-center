"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

export function ThemeToggle({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { resolved, toggleTheme } = useTheme();
  const isLight = resolved === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "flex items-center justify-center rounded-xl border transition",
        compact ? "h-9 w-9" : "h-10 w-10",
        isLight
          ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
        className
      )}
      aria-label={isLight ? "Qorong'u rejim" : "Yorug' rejim"}
      title={isLight ? "Qorong'u rejim" : "Yorug' rejim"}
    >
      {isLight ? (
        <Moon className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Sun className="h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
