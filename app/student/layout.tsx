import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelFromXp } from "@/lib/gamification";
import { fmtNumber } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { PlayerHud } from "@/components/gamification";
import type { NavItem } from "@/components/sidebar";

const items: NavItem[] = [
  { href: "/student", label: "Bosh sahifa", icon: "home", exact: true },
  { href: "/student/homework", label: "Vazifalarim", icon: "book-open" },
  { href: "/student/rating", label: "Reyting", icon: "trophy" },
  { href: "/student/quiz", label: "Quiz o'ynash", icon: "zap" },
  { href: "/student/shop", label: "Magazin", icon: "shopping-bag" },
  { href: "/student/achievements", label: "Yutuqlar", icon: "medal" },
  { href: "/student/notifications", label: "Bildirishnomalar", icon: "bell" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("STUDENT");
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { points: true, xp: true },
  });
  const lvl = levelFromXp(user?.xp ?? 0);

  return (
    <AppShell
      session={session}
      items={items}
      brand="O'quvchi kabineti"
      brandIcon="rocket"
      accent="game"
      variant="game"
      headerExtra={
        <PlayerHud
          level={lvl.level}
          points={fmtNumber(user?.points ?? 0)}
          xpProgress={lvl.progress * 100}
        />
      }
    >
      {children}
    </AppShell>
  );
}
