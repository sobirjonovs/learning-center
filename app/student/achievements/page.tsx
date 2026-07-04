// Yutuqlar — olingan va hali ochilmagan yutuqlar
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACHIEVEMENT_CODES } from "@/lib/constants";
import { fmtDate, pct } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";

type Hint = { text: string; value: number; target: number };

export default async function StudentAchievementsPage() {
  const session = await requireRole("STUDENT");

  const [user, achievements, earnedRows, onTimeCount, earlyCount] = await Promise.all([
    db.user.findUnique({ where: { id: session.id }, select: { streak: true } }),
    db.achievement.findMany({ orderBy: { xpReward: "asc" } }),
    db.studentAchievement.findMany({
      where: { studentId: session.id },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    }),
    db.submission.count({ where: { studentId: session.id, status: "ACCEPTED", penalty: 0 } }),
    db.submission.count({
      where: { studentId: session.id, status: "ACCEPTED", bonus: { gt: 0 } },
    }),
  ]);

  const streak = user?.streak ?? 0;
  const earnedIds = new Set(earnedRows.map((r) => r.achievementId));
  const locked = achievements.filter((a) => !earnedIds.has(a.id));

  // Arzon hisoblanadigan progress ko'rsatkichlari
  const hints: Record<string, Hint> = {
    [ACHIEVEMENT_CODES.STREAK_7]: {
      text: `Joriy streak: ${Math.min(streak, 7)}/7`,
      value: streak,
      target: 7,
    },
    [ACHIEVEMENT_CODES.HOMEWORK_10_ONTIME]: {
      text: `${Math.min(onTimeCount, 10)}/10 vazifa`,
      value: onTimeCount,
      target: 10,
    },
    [ACHIEVEMENT_CODES.EARLY_5]: {
      text: `${Math.min(earlyCount, 5)}/5 vazifa`,
      value: earlyCount,
      target: 5,
    },
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Yutuqlar 🏅"
        subtitle={`${earnedRows.length} / ${achievements.length} ta yutuq ochilgan`}
      />

      {/* Olingan yutuqlar */}
      <div className="mb-3 text-sm font-semibold text-slate-700">✨ Olingan yutuqlar</div>
      {earnedRows.length === 0 ? (
        <EmptyState
          icon="🏅"
          title="Hozircha yutuq yo'q"
          hint="Vazifalarni o'z vaqtida bajaring, quizlarda qatnashing — yutuqlar o'zi keladi!"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {earnedRows.map((row) => (
            <Card
              key={row.id}
              className="relative animate-pop overflow-hidden border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50"
            >
              <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-fuchsia-100/60" />
              <div className="relative">
                <div className="text-4xl">{row.achievement.icon}</div>
                <div className="mt-2 font-bold text-slate-900">{row.achievement.name}</div>
                <div className="mt-0.5 text-xs text-slate-500">{row.achievement.description}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {row.achievement.xpReward > 0 && (
                    <Badge className="bg-violet-100 text-violet-700">
                      +{row.achievement.xpReward} XP
                    </Badge>
                  )}
                  {row.achievement.pointsReward > 0 && (
                    <Badge className="bg-amber-100 text-amber-700">
                      +{row.achievement.pointsReward} ball
                    </Badge>
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-400">🗓️ Olingan: {fmtDate(row.earnedAt)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Hali ochilmagan */}
      {locked.length > 0 && (
        <>
          <div className="mb-3 mt-10 text-sm font-semibold text-slate-700">🔒 Hali ochilmagan</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {locked.map((a) => {
              const hint = hints[a.code];
              return (
                <Card key={a.id} className="relative animate-fade-in opacity-50">
                  <div className="absolute right-3 top-3 text-lg">🔒</div>
                  <div className="text-4xl grayscale">{a.icon}</div>
                  <div className="mt-2 font-bold text-slate-700">{a.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{a.description}</div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.xpReward > 0 && (
                      <Badge className="bg-slate-100 text-slate-500">+{a.xpReward} XP</Badge>
                    )}
                    {a.pointsReward > 0 && (
                      <Badge className="bg-slate-100 text-slate-500">+{a.pointsReward} ball</Badge>
                    )}
                  </div>
                  {hint && (
                    <div className="mt-3">
                      <div className="mb-1 text-xs font-medium text-slate-500">{hint.text}</div>
                      <ProgressBar
                        value={pct(Math.min(hint.value, hint.target), hint.target)}
                        barClassName="bg-violet-400"
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
