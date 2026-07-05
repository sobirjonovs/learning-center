"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

export function ThemedCanvas({
  variant = "default",
  children,
}: {
  variant?: "default" | "game" | "classic";
  children: React.ReactNode;
}) {
  const { resolved } = useTheme();
  const isLight = resolved === "light";

  const canvas = isLight
    ? "classic-canvas"
    : variant === "game"
      ? "game-canvas"
      : "app-canvas";

  return <div className={cn("min-h-screen", canvas)}>{children}</div>;
}
