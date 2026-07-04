import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/sidebar";

const items: NavItem[] = [
  { href: "/student", label: "Bosh sahifa", icon: "🏠", exact: true },
  { href: "/student/homework", label: "Vazifalarim", icon: "📚" },
  { href: "/student/rating", label: "Reyting", icon: "🏆" },
  { href: "/student/quiz", label: "Quiz o'ynash", icon: "⚡" },
  { href: "/student/shop", label: "Magazin", icon: "🛍️" },
  { href: "/student/achievements", label: "Yutuqlar", icon: "🏅" },
  { href: "/student/notifications", label: "Bildirishnomalar", icon: "🔔" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("STUDENT");
  return (
    <AppShell
      session={session}
      items={items}
      brand="O'quvchi kabineti"
      brandIcon="🚀"
      accent="text-violet-600 bg-violet-50"
    >
      {children}
    </AppShell>
  );
}
