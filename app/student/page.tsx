// O'quvchi bosh sahifasi — gamifikatsiyalangan dashboard
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelFromXp, getRating, attendancePercent } from "@/lib/gamification";
import { cn, fmtNumber, fmtDateTime, timeAgo, pct } from "@/lib/utils";
import { Avatar, Badge, Card, CardTitle, EmptyState, ProgressBar, StatCard } from "@/components/ui";

/** Muddatgacha qolgan vaqt (o'zbekcha) */
function timeLeft(due: Date, now: Date): { text: string; urgent: boolean } {
  const ms = due.getTime() - now.getTime();
  if (ms <= 0) return { text: "Muddat tugadi", urgent: true };
  const urgent = ms < 24 * 60 * 60 * 1000;
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return { text: `${days} kun qoldi`, urgent };
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return { text: `${hours} soat qoldi`, urgent };
  const mins = Math.max(1, Math.floor(ms / 60_000));
  return { text: `${mins} daqiqa qoldi`, urgent };
}

function examBadge(p: number): string {
  if (p >= 90) return "bg-emerald-100 text-emerald-700";
  if (p >= 70) return "bg-sky-100 text-sky-700";
  if (p >= 50) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

export default async function StudentDashboard() {
  const session = await requireRole("STUDENT");
  const now = new Date();

  const [user, memberships] = await Promise.all([
    db.user.findUnique({ where: { id: session.id } }),
    db.groupStudent.findMany({
      where: { studentId: session.id },
      include: { group: { select: { id: true, name: true } } },
    }),
  ]);
  if (!user) return null;
  const groupIds = memberships.map((m) => m.groupId);

  const [attendance, acceptedCount, missedCount, deadlines, examResults, earned, txs] =
    await Promise.all([
      attendancePercent(session.id),
      db.submission.count({ where: { studentId: session.id, status: "ACCEPTED" } }),
      db.homework.count({
        where: {
          groupId: { in: groupIds },
          dueAt: { lt: now },
          submissions: { none: { studentId: session.id } },
        },
      }),
      db.homework.findMany({
        where: {
          groupId: { in: groupIds },
          startAt: { lte: now },
          dueAt: { gt: now },
          submissions: { none: { studentId: session.id } },
        },
        include: { group: { select: { name: true } } },
        orderBy: { dueAt: "asc" },
        take: 6,
      }),
      db.examResult.findMany({
        where: { studentId: session.id },
        include: { exam: { select: { title: true, maxScore: true, date: true } } },
        orderBy: { exam: { date: "desc" } },
        take: 5,
      }),
      db.studentAchievement.findMany({
        where: { studentId: session.id },
        include: { achievement: true },
        orderBy: { earnedAt: "desc" },
        take: 6,
      }),
      db.scoreTransaction.findMany({
        where: { studentId: session.id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  // Guruhlar bo'ylab eng yaxshi reyting o'rni
  let best: { place: number; group: string } | null = null;
  for (const m of memberships) {
    const memberIds = (
      await db.groupStudent.findMany({
        where: { groupId: m.groupId },
        select: { studentId: true },
      })
    ).map((x) => x.studentId);
    const rating = await getRating(memberIds);
    const mine = rating.find((r) => r.studentId === session.id);
    if (mine && (!best || mine.place < best.place)) {
      best = { place: mine.place, group: m.group.name };
    }
  }

  const lvl = levelFromXp(user.xp);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative animate-slide-up overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 right-28 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center gap-5">
          <Avatar name={user.name} image={user.image} size="xl" className="ring-4 ring-white/30" />
          <div className="min-w-0 flex-1">
            <div className="text-sm text-violet-100">Xush kelibsiz! 👋</div>
            <h1 className="truncate text-2xl font-bold">{user.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className="bg-white/20 text-white">🎖️ Level {lvl.level}</Badge>
              <Badge className="bg-white/20 text-white">🔥 {user.streak} kun</Badge>
              <Badge className="bg-white/20 text-white">⭐ {fmtNumber(user.points)} ball</Badge>
            </div>
            <div className="mt-3 max-w-md">
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-violet-100">
                <span>
                  Level {lvl.level} — {fmtNumber(lvl.intoLevel)}/{fmtNumber(lvl.needed)} XP keyingi
                  levelgacha
                </span>
                <span className="font-semibold">{Math.round(lvl.progress * 100)}%</span>
              </div>
              <ProgressBar value={lvl.progress * 100} className="bg-white/20" barClassName="bg-white" />
            </div>
          </div>
          <div className="hidden animate-float text-6xl sm:block">🚀</div>
        </div>
      </div>

      {/* Stat kartalar */}
      <div className="grid animate-fade-in gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Guruhdagi reyting o'rnim"
          value={best ? `#${best.place}` : "—"}
          hint={best?.group}
          icon="🏆"
          tone="violet"
        />
        <StatCard label="Davomat" value={`${attendance}%`} icon="📅" tone="emerald" />
        <StatCard label="Bajarilgan vazifalar" value={fmtNumber(acceptedCount)} icon="✅" tone="sky" />
        <StatCard label="Bajarilmagan vazifalar" value={fmtNumber(missedCount)} icon="⚠️" tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Yaqinlashayotgan deadlinelar */}
        <Card className="animate-slide-up">
          <CardTitle
            action={
              <Link href="/student/homework" className="text-xs font-medium text-violet-600 hover:underline">
                Barchasi →
              </Link>
            }
          >
            ⏰ Yaqinlashayotgan deadlinelar
          </CardTitle>
          {deadlines.length === 0 ? (
            <EmptyState icon="🎉" title="Hozircha deadline yo'q" hint="Barcha vazifalar bajarilgan — zo'r ketyapsiz!" />
          ) : (
            <div className="space-y-2">
              {deadlines.map((hw) => {
                const left = timeLeft(hw.dueAt, now);
                return (
                  <Link
                    key={hw.id}
                    href={`/student/homework/${hw.id}`}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border p-3 transition hover:shadow-sm",
                      left.urgent
                        ? "border-rose-200 bg-rose-50 hover:bg-rose-100"
                        : "border-slate-100 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800">{hw.title}</div>
                      <div className="text-xs text-slate-500">
                        {hw.group.name} · Muddat: {fmtDateTime(hw.dueAt)}
                      </div>
                    </div>
                    <Badge className={left.urgent ? "bg-rose-100 text-rose-700" : "bg-violet-100 text-violet-700"}>
                      {left.urgent ? "🔥" : "⏳"} {left.text}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* So'nggi imtihon natijalari */}
        <Card className="animate-slide-up">
          <CardTitle>📝 So&apos;nggi imtihon natijalari</CardTitle>
          {examResults.length === 0 ? (
            <EmptyState icon="📝" title="Hozircha imtihon natijalari yo'q" />
          ) : (
            <div className="space-y-2">
              {examResults.map((r) => {
                const p = pct(r.score, r.exam.maxScore);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800">{r.exam.title}</div>
                      <div className="text-xs text-slate-500">{fmtDateTime(r.exam.date)}</div>
                    </div>
                    <Badge className={examBadge(p)}>
                      {r.score}/{r.exam.maxScore} · {p}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Yutuqlarim */}
        <Card className="animate-slide-up">
          <CardTitle
            action={
              <Link href="/student/achievements" className="text-xs font-medium text-violet-600 hover:underline">
                Barchasi →
              </Link>
            }
          >
            🏅 Yutuqlarim
          </CardTitle>
          {earned.length === 0 ? (
            <EmptyState icon="🏅" title="Hozircha yutuq yo'q" hint="Faol bo'ling — birinchi yutuq uzoq emas!" />
          ) : (
            <div className="flex flex-wrap gap-3">
              {earned.map((e) => (
                <Link
                  key={e.id}
                  href="/student/achievements"
                  title={e.achievement.name}
                  className="flex h-16 w-16 animate-pop items-center justify-center rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 text-3xl shadow-sm transition hover:scale-105"
                >
                  {e.achievement.icon}
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Ball tarixi */}
        <Card className="animate-slide-up">
          <CardTitle>💰 Ball tarixi</CardTitle>
          {txs.length === 0 ? (
            <EmptyState icon="💰" title="Hozircha tranzaksiyalar yo'q" />
          ) : (
            <div className="space-y-2">
              {txs.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800">{t.reason}</div>
                    <div className="text-xs text-slate-400">{timeAgo(t.createdAt)}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs font-semibold">
                    {t.xp !== 0 && (
                      <span className={t.xp > 0 ? "text-emerald-600" : "text-rose-600"}>
                        {t.xp > 0 ? "+" : ""}
                        {fmtNumber(t.xp)} XP
                      </span>
                    )}
                    {t.points !== 0 && (
                      <span className={t.points > 0 ? "text-emerald-600" : "text-rose-600"}>
                        {t.points > 0 ? "+" : ""}
                        {fmtNumber(t.points)} ball
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
