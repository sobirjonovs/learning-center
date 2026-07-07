import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/sidebar";

const items: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: "bar-chart3", exact: true },
  { href: "/teacher/groups", label: "Guruhlarim", icon: "users" },
  { href: "/teacher/attendance", label: "Davomat", icon: "check-circle2" },
  { href: "/teacher/homework", label: "Uyga vazifalar", icon: "book-open" },
  { href: "/teacher/exams", label: "Imtihonlar", icon: "clipboard-list" },
  { href: "/teacher/quizzes", label: "Quiz Battle", icon: "zap" },
  { href: "/teacher/rating", label: "Reyting", icon: "trophy" },
  { href: "/teacher/profile", label: "Mening profilim", icon: "user-cog" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("TEACHER");
  return (
    <AppShell session={session} items={items} brand="O'qituvchi kabineti" brandIcon="user-cog" variant="classic">
      {children}
    </AppShell>
  );
}
