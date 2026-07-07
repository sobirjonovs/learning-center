import { requireRole, can } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/sidebar";
import type { PermissionKey } from "@/lib/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");

  const allItems: Array<NavItem & { permission?: PermissionKey; superOnly?: boolean }> = [
    { href: "/admin", label: "Dashboard", icon: "bar-chart3", exact: true },
    { href: "/admin/teachers", label: "O'qituvchilar", icon: "user-cog", permission: "teachers.manage" },
    { href: "/admin/categories", label: "Fan kategoriyalari", icon: "book-open", permission: "categories.manage" },
    { href: "/admin/groups", label: "Guruhlar", icon: "users", permission: "groups.manage" },
    { href: "/admin/students", label: "O'quvchilar", icon: "graduation-cap", permission: "students.view" },
    { href: "/admin/attendance", label: "Davomat nazorati", icon: "check-circle2", permission: "attendance.manage" },
    { href: "/admin/absent", label: "Kelmaganlar", icon: "phone", permission: "calls.manage" },
    { href: "/admin/payments", label: "To'lovlar", icon: "credit-card", permission: "payments.manage" },
    { href: "/admin/shop", label: "Magazin", icon: "shopping-bag", permission: "shop.manage" },
    { href: "/admin/achievements", label: "Yutuqlar", icon: "medal", permission: "achievements.manage" },
    { href: "/admin/notifications", label: "Bildirishnomalar", icon: "bell", permission: "notifications.send" },
    { href: "/admin/admins", label: "Administratorlar", icon: "shield", superOnly: true },
    { href: "/admin/settings", label: "Ball sozlamalari", icon: "settings", superOnly: true },
    { href: "/admin/profile", label: "Mening profilim", icon: "user-cog" },
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
      brandIcon="graduation-cap"
      variant="classic"
    >
      {children}
    </AppShell>
  );
}
