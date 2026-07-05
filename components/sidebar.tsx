"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Gamepad2, HelpCircle, Menu, X } from "lucide-react";
import { AppIcon } from "@/components/icon";
import { resolveNavIcon, type NavIconName } from "@/components/nav-icons";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export type NavItem = { href: string; label: string; icon: NavIconName; exact?: boolean };

const accentMap = {
  indigo: {
    active: "bg-brand-600 text-white shadow-lg shadow-blue-600/30",
    logo: "from-blue-500 to-blue-700",
    glow: "shadow-blue-500/40",
    border: "border-white/10",
  },
  classic: {
    active: "bg-brand-600 text-white shadow-sm",
    logo: "from-blue-600 to-blue-700",
    glow: "shadow-blue-500/20",
    border: "border-slate-200",
  },
  violet: {
    active: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/40",
    logo: "from-violet-500 to-fuchsia-600",
    glow: "shadow-violet-500/40",
    border: "border-violet-500/20",
  },
  game: {
    active: "bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/40",
    logo: "from-blue-600 to-cyan-500",
    glow: "shadow-blue-500/40",
    border: "border-blue-500/25",
  },
} as const;

export function Sidebar({
  items,
  brand,
  brandIcon,
  accent = "indigo",
  variant = "default",
}: {
  items: NavItem[];
  brand: string;
  brandIcon: NavIconName;
  accent?: keyof typeof accentMap | string;
  variant?: "default" | "game" | "classic";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { resolved } = useTheme();
  const isLight = resolved === "light";
  const resolvedAccent =
    isLight || variant === "classic"
      ? "classic"
      : variant === "game"
        ? "game"
        : accent;
  const theme = accentMap[resolvedAccent as keyof typeof accentMap] ?? accentMap.indigo;

  const BrandIcon = resolveNavIcon(brandIcon);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
              active
                ? theme.active
                : isLight
                  ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <AppIcon icon={resolveNavIcon(item.icon)} size="md" className="opacity-90" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobil sarlavha */}
      <div
        className={cn(
          "sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 lg:hidden",
          isLight ? "border-slate-200 bg-white" : "border-white/10 bg-surface/95 backdrop-blur-xl"
        )}
      >
        <div className={cn("flex items-center gap-2.5 font-bold", isLight ? "text-slate-900" : "text-white")}>
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-base text-white shadow-lg",
              theme.logo,
              theme.glow
            )}
          >
            <AppIcon icon={BrandIcon} size="md" />
          </span>
          EduCenter
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border transition",
              isLight
                ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            )}
            aria-label="Menyu"
          >
            {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
          </button>
        </div>
      </div>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-200 ease-out lg:translate-x-0",
          theme.border,
          variant === "game"
            ? "border-r bg-surface/95 bg-gradient-to-b from-blue-950/20 to-surface/95 backdrop-blur-xl"
            : isLight
              ? "border-r border-slate-200 bg-white shadow-sm"
              : "border-r border-white/10 bg-surface/95 backdrop-blur-xl",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 border-b px-5 py-5",
            isLight ? "border-slate-200" : "border-white/10"
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-lg text-white shadow-lg",
              theme.logo,
              theme.glow
            )}
          >
            <AppIcon icon={BrandIcon} size="lg" />
          </span>
          <div className="min-w-0">
            <div
              className={cn(
                "truncate text-sm font-bold",
                variant === "game" && !isLight
                  ? "font-display text-white"
                  : isLight
                    ? "text-slate-900"
                    : "text-white"
              )}
            >
              EduCenter
            </div>
            <div
              className={cn(
                "truncate text-xs",
                variant === "game" && !isLight ? "text-blue-400/70" : "text-slate-500"
              )}
            >
              {brand}
            </div>
          </div>
        </div>
        {nav}
        <div className="mt-auto p-4">
          <div
            className={cn(
              "rounded-2xl border p-4",
              variant === "game"
                ? "border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-400/5 backdrop-blur"
                : isLight
                  ? "border-slate-200 bg-slate-50"
                  : "border-white/10 bg-white/5 backdrop-blur"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg",
                  variant === "game" && !isLight
                    ? "bg-gradient-to-br from-blue-600 to-cyan-500 shadow-blue-500/30"
                    : isLight
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20"
                      : "bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/30"
                )}
              >
                {variant === "game" && !isLight ? (
                  <Gamepad2 className="h-5 w-5" strokeWidth={1.75} />
                ) : (
                  <HelpCircle className="h-5 w-5" strokeWidth={1.75} />
                )}
              </div>
              <div>
                <div className={cn("text-xs font-semibold", isLight ? "text-slate-800" : "text-white")}>
                  {variant === "game" && !isLight ? "O'yin rejimi" : "Yordam kerakmi?"}
                </div>
                <div className="text-[10px] text-slate-500">
                  {variant === "game" && !isLight
                    ? "XP to'plang, level oshiring!"
                    : "Administrator bilan bog'laning"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
