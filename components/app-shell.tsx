import type { SessionUser } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/constants";
import { Avatar } from "./ui";
import { Sidebar, type NavItem } from "./sidebar";
import { LogoutButton } from "./logout-button";

export function AppShell({
  session,
  items,
  brand,
  brandIcon,
  accent,
  headerExtra,
  children,
}: {
  session: SessionUser;
  items: NavItem[];
  brand: string;
  brandIcon: string;
  accent?: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar items={items} brand={brand} brandIcon={brandIcon} accent={accent} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 hidden items-center justify-end gap-4 border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur lg:flex">
          {headerExtra}
          <div className="flex items-center gap-3">
            <Avatar name={session.name} image={session.image} size="sm" />
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800">{session.name}</div>
              <div className="text-xs text-slate-400">{ROLE_LABELS[session.role]}</div>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
