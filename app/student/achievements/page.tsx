// Yutuqlar — olingan va hali ochilmagan yutuqlar
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACHIEVEMENT_CODES } from "@/lib/constants";
import { fmtDate, pct } from "@/lib/utils";
import { Lock, Medal } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";
import { AchievementTile } from "@/components/gamification";

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
        title={
          <span className="font-display inline-flex items-center gap-2">
            <Medal className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
            Yutuqlar
          </span>
        }
        subtitle={`${earnedRows.length} / ${achievements.length} ta yutuq ochilgan`}
      />

      <div className="mb-3 font-display text-sm font-semibold text-blue-300">✨ Olingan yutuqlar</div>
      {earnedRows.length === 0 ? (
        <EmptyState
          icon={Medal}
          title="Hozircha yutuq yo'q"
          hint="Vazifalarni o'z vaqtida bajaring, quizlarda qatnashing — yutuqlar o'zi keladi!"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {earnedRows.map((row) => (
            <AchievementTile
              key={row.id}
              icon={row.achievement.icon}
              name={row.achievement.name}
              description={row.achievement.description}
              earned
              href="/student/achievements"
              xpReward={row.achievement.xpReward}
              pointsReward={row.achievement.pointsReward}
              earnedAt={`Olingan: ${fmtDate(row.earnedAt)}`}
            />
          ))}
        </div>
      )}

      {locked.length > 0 && (
        <>
          <div className="mb-3 mt-10 inline-flex items-center gap-2 font-display text-sm font-semibold text-slate-400">
            <Lock className="h-4 w-4" strokeWidth={1.75} />
            Hali ochilmagan
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {locked.map((a) => {
              const hint = hints[a.code];
              return (
                <AchievementTile
                  key={a.id}
                  icon={a.icon}
                  name={a.name}
                  description={a.description}
                  xpReward={a.xpReward}
                  pointsReward={a.pointsReward}
                  progress={hint ? pct(Math.min(hint.value, hint.target), hint.target) : undefined}
                  progressLabel={hint?.text}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
