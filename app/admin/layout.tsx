import { requireRole, can } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/sidebar";
import type { PermissionKey } from "@/lib/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");

  const allItems: Array<NavItem & { permission?: PermissionKey; superOnly?: boolean }> = [
    { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
    { href: "/admin/teachers", label: "O'qituvchilar", icon: "👨‍🏫", permission: "teachers.manage" },
    { href: "/admin/groups", label: "Guruhlar", icon: "👥", permission: "groups.manage" },
    { href: "/admin/students", label: "O'quvchilar", icon: "🎓", permission: "students.view" },
    { href: "/admin/attendance", label: "Davomat nazorati", icon: "✅", permission: "attendance.manage" },
    { href: "/admin/absent", label: "Kelmaganlar", icon: "📞", permission: "calls.manage" },
    { href: "/admin/shop", label: "Magazin", icon: "🛍️", permission: "shop.manage" },
    { href: "/admin/notifications", label: "Bildirishnomalar", icon: "🔔", permission: "notifications.send" },
    { href: "/admin/admins", label: "Administratorlar", icon: "🛡️", superOnly: true },
    { href: "/admin/settings", label: "Sozlamalar", icon: "⚙️", superOnly: true },
  ];

  const items = allItems.filter((item) => {
    if (item.superOnly) return session.role === "SUPER_ADMIN";
    if (item.permission) return can(session, item.permission);
    return true;
  });

  return (
    <AppShell
      session={session}
      items={items}
      brand={session.role === "SUPER_ADMIN" ? "Super Admin" : "Administratsiya"}
      brandIcon="🎓"
    >
      {children}
    </AppShell>
  );
}
