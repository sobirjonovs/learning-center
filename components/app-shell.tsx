"use client";

import type { SessionUser } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { NavIconName } from "@/components/nav-icons";
import { Avatar } from "./ui";
import { Sidebar, type NavItem } from "./sidebar";
import { LogoutButton } from "./logout-button";
import { ThemedCanvas } from "./themed-canvas";
import { ThemeToggle } from "./theme-toggle";
import { useTheme } from "./theme-provider";

function AppHeader({
  session,
  brand,
  variant,
  headerExtra,
}: {
  session: SessionUser;
  brand: string;
  variant: "default" | "game" | "classic";
  headerExtra?: React.ReactNode;
}) {
  const { resolved } = useTheme();
  const isLight = resolved === "light";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 hidden items-center justify-between gap-4 border-b px-6 py-3 lg:flex",
        isLight ? "border-slate-200 bg-white/95 shadow-sm" : "border-white/10 bg-surface/80 backdrop-blur-xl"
      )}
    >
      <div
        className={cn(
          "text-sm font-medium",
          variant === "game" && !isLight
            ? "font-display text-violet-300/80"
            : isLight
              ? "text-slate-600"
              : "text-slate-400"
        )}
      >
        {brand}
      </div>
      <div className="flex items-center gap-3">
        {headerExtra}
        <ThemeToggle />
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border py-1.5 pl-1.5 pr-3",
            isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5 backdrop-blur"
          )}
        >
          <Avatar name={session.name} image={session.image} size="sm" />
          <div className="text-right">
            <div className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>
              {session.name}
            </div>
            <div className="text-xs text-slate-500">{ROLE_LABELS[session.role]}</div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  session,
  items,
  brand,
  brandIcon,
  accent,
  headerExtra,
  variant = "default",
  children,
}: {
  session: SessionUser;
  items: NavItem[];
  brand: string;
  brandIcon: NavIconName;
  accent?: string;
  headerExtra?: React.ReactNode;
  variant?: "default" | "game" | "classic";
  children: React.ReactNode;
}) {
  return (
    <ThemedCanvas variant={variant} data-app-shell>
      <Sidebar items={items} brand={brand} brandIcon={brandIcon} accent={accent} variant={variant} />
      <div className="relative z-10 lg:pl-64" data-app-shell-content>
        <div data-app-shell-header>
          <AppHeader session={session} brand={brand} variant={variant} headerExtra={headerExtra} />
        </div>
        <main className="p-4 md:p-6 lg:p-8" data-app-shell-main>
          <div className="mx-auto max-w-7xl animate-fade-in" data-app-shell-inner>
            {children}
          </div>
        </main>
      </div>
    </ThemedCanvas>
  );
}
