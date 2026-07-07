// O'quvchi bosh sahifasi — gamifikatsiyalangan dashboard
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelFromXp, getRating, attendancePercent } from "@/lib/gamification";
import { fmtNumber, fmtDateTime, timeAgo, pct } from "@/lib/utils";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Flame,
  Hourglass,
  Medal,
  PartyPopper,
  Trophy,
} from "lucide-react";
import { Badge, Card, CardTitle, EmptyState } from "@/components/ui";
import {
  GameHero,
  GameStat,
  QuestCard,
} from "@/components/gamification";

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
  if (p >= 90) return "bg-emerald-500/15 text-emerald-400";
  if (p >= 70) return "bg-cyan-500/15 text-cyan-400";
  if (p >= 50) return "bg-amber-500/15 text-amber-400";
  return "bg-rose-500/15 text-rose-400";
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
        where: { studentId: session.id, status: "ACCEPTED", score: { not: null } },
        include: { exam: { select: { title: true, maxScore: true, endAt: true, passPercent: true } } },
        orderBy: { gradedAt: "desc" },
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
      <GameHero
        name={user.name}
        image={user.image}
        level={lvl.level}
        streak={user.streak}
        points={fmtNumber(user.points)}
        xpProgress={lvl.progress * 100}
        xpLabel={`Level ${lvl.level} — ${fmtNumber(lvl.intoLevel)}/${fmtNumber(lvl.needed)} XP keyingi levelgacha`}
      />

      <div className="grid animate-fade-in gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GameStat
          label="Guruhdagi reyting o'rnim"
          value={best ? `#${best.place}` : "—"}
          hint={best?.group}
          icon={Trophy}
          tone="gold"
        />
        <GameStat label="Davomat" value={`${attendance}%`} icon={Calendar} tone="emerald" />
        <GameStat label="Bajarilgan vazifalar" value={fmtNumber(acceptedCount)} icon={CheckCircle2} tone="cyan" />
        <GameStat label="Bajarilmagan vazifalar" value={fmtNumber(missedCount)} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-slide-up" glow="blue">
          <CardTitle
            action={
              <Link href="/student/homework" className="text-xs font-medium text-cyan-400 classic:text-blue-600 hover:underline">
                Barchasi →
              </Link>
            }
          >
            <span className="font-display inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400 classic:text-blue-600" strokeWidth={1.75} />
              Faol missiyalar
            </span>
          </CardTitle>
          {deadlines.length === 0 ? (
            <EmptyState icon={PartyPopper} title="Hozircha deadline yo'q" hint="Barcha vazifalar bajarilgan — zo'r ketyapsiz!" />
          ) : (
            <div className="space-y-2">
              {deadlines.map((hw) => {
                const left = timeLeft(hw.dueAt, now);
                return (
                  <QuestCard
                    key={hw.id}
                    href={`/student/homework/${hw.id}`}
                    title={hw.title}
                    subtitle={`${hw.group.name} · Muddat: ${fmtDateTime(hw.dueAt)}`}
                    urgent={left.urgent}
                    badge={
                      <span className="inline-flex items-center gap-1">
                        {left.urgent ? (
                          <Flame className="h-3 w-3" strokeWidth={1.75} />
                        ) : (
                          <Hourglass className="h-3 w-3" strokeWidth={1.75} />
                        )}
                        {left.text}
                      </span>
                    }
                    badgeClass={
                      left.urgent
                        ? "bg-rose-500/15 text-rose-400"
                        : "bg-blue-500/15 text-blue-400"
                    }
                  />
                );
              })}
            </div>
          )}
        </Card>

        <Card className="animate-slide-up">
          <CardTitle
            action={
              <Link href="/student/exams" className="text-xs font-medium text-cyan-400 classic:text-blue-600 hover:underline">
                Barchasi →
              </Link>
            }
          >
            <span className="font-display inline-flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" strokeWidth={1.75} />
              So&apos;nggi imtihon natijalari
            </span>
          </CardTitle>
          {examResults.length === 0 ? (
            <EmptyState icon={FileText} title="Hozircha imtihon natijalari yo'q" />
          ) : (
            <div className="space-y-2">
              {examResults.map((r) => {
                const score = r.score ?? 0;
                const p = pct(score, r.exam.maxScore);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 classic:border-slate-200 classic:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-100 classic:text-slate-800">{r.exam.title}</div>
                      <div className="text-xs text-slate-500">{fmtDateTime(r.exam.endAt)}</div>
                    </div>
                    <Badge className={r.passed ? "bg-emerald-500/15 text-emerald-400" : examBadge(p)}>
                      {score}/{r.exam.maxScore} · {r.passed ? "O'tdi" : "Yiqildi"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="animate-slide-up" glow="orange">
          <CardTitle
            action={
              <Link href="/student/achievements" className="text-xs font-medium text-blue-400 hover:underline">
                Barchasi →
              </Link>
            }
          >
            <span className="font-display inline-flex items-center gap-2">
              <Medal className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
              Yutuqlarim
            </span>
          </CardTitle>
          {earned.length === 0 ? (
            <EmptyState icon={Medal} title="Hozircha yutuq yo'q" hint="Faol bo'ling — birinchi yutuq uzoq emas!" />
          ) : (
            <div className="flex flex-wrap gap-3">
              {earned.map((e) => (
                <Link
                  key={e.id}
                  href="/student/achievements"
                  title={e.achievement.name}
                  className="achievement-earned flex h-16 w-16 animate-pop items-center justify-center rounded-2xl text-3xl transition hover:scale-110"
                >
                  {e.achievement.icon}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="animate-slide-up">
          <CardTitle>
            <span className="font-display inline-flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
              Ball tarixi
            </span>
          </CardTitle>
          {txs.length === 0 ? (
            <EmptyState icon={Coins} title="Hozircha tranzaksiyalar yo'q" />
          ) : (
            <div className="space-y-2">
              {txs.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 classic:border-slate-200 classic:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-100 classic:text-slate-800">{t.reason}</div>
                    <div className="text-xs text-slate-400 classic:text-slate-500">{timeAgo(t.createdAt)}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs font-semibold">
                    {t.xp !== 0 && (
                      <span className={t.xp > 0 ? "text-emerald-400" : "text-rose-400"}>
                        {t.xp > 0 ? "+" : ""}
                        {fmtNumber(t.xp)} XP
                      </span>
                    )}
                    {t.points !== 0 && (
                      <span className={t.points > 0 ? "text-amber-400" : "text-rose-400"}>
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
