import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/sidebar";

const items: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: "📊", exact: true },
  { href: "/teacher/groups", label: "Guruhlarim", icon: "👥" },
  { href: "/teacher/attendance", label: "Davomat", icon: "✅" },
  { href: "/teacher/homework", label: "Uyga vazifalar", icon: "📚" },
  { href: "/teacher/exams", label: "Imtihonlar", icon: "📝" },
  { href: "/teacher/quizzes", label: "Quiz Battle", icon: "⚡" },
  { href: "/teacher/rating", label: "Reyting", icon: "🏆" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("TEACHER");
  return (
    <AppShell session={session} items={items} brand="O'qituvchi kabineti" brandIcon="👨‍🏫">
      {children}
    </AppShell>
  );
}
