"use client";

import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";

export function LoginShell() {
  const { resolved } = useTheme();
  const isLight = resolved === "light";

  return (
    <main
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden p-4",
        isLight ? "bg-slate-100" : "bg-canvas-deep"
      )}
    >
      {!isLight && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgb(59_130_246/0.25),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_100%,rgb(0_240_255/0.12),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgb(124_58_237/0.08),transparent_60%)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgb(255 255 255 / 0.03) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.03) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </>
      )}

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-violet-600 to-cyan-400 text-white shadow-xl ring-1 ring-white/20 glow-neon">
            <GraduationCap className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <h1
            className={cn(
              "font-display text-3xl font-bold tracking-tight",
              isLight ? "text-slate-900" : "text-white neon-text"
            )}
          >
            EduCenter
          </h1>
          <p className={cn("mt-2 text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
            O&apos;quv markaz boshqaruv platformasi
          </p>
        </div>
        <LoginForm isLight={isLight} />
        <p className={cn("mt-6 text-center text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
          Kirish uchun login va parolni administratsiyadan oling
        </p>
      </div>
    </main>
  );
}
