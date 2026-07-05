// Guruh tafsilotlari — o'quvchilar, reyting, davomat, vazifalar, imtihonlar
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, fmtDateTime, parseJsonArray, pct } from "@/lib/utils";
import { getRating, levelFromXp } from "@/lib/gamification";
import { ATTENDANCE_STATUS } from "@/lib/constants";
import { CheckCircle2, Clock, FileText, X } from "lucide-react";
import {
  ActiveBadge,
  Avatar,
  Badge,
  Card,
  CardTitle,
  PageHeader,
  ProgressBar,
  Table,
  Td,
  Th,
  btn,
} from "@/components/ui";
import { RankMedal } from "@/components/rank-medal";

export default async function TeacherGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;

  const group = await db.group.findUnique({
    where: { id },
    include: {
      students: {
        include: {
          student: { select: { id: true, name: true, image: true, points: true, xp: true } },
        },
        orderBy: { student: { name: "asc" } },
      },
      homeworks: {
        orderBy: { dueAt: "desc" },
        select: { id: true, title: true, dueAt: true, maxScore: true },
      },
      exams: {
        orderBy: { date: "desc" },
        include: { results: { select: { score: true } } },
      },
    },
  });
  if (!group || group.teacherId !== session.id) redirect("/teacher/groups");

  const memberIds = group.students.map((m) => m.student.id);

  const [attRows, subStats, rating] = await Promise.all([
    db.attendance.findMany({
      where: { groupId: group.id },
      select: { studentId: true, date: true, status: true },
    }),
    db.submission.groupBy({
      by: ["homeworkId", "status"],
      where: { homework: { groupId: group.id } },
      _count: { _all: true },
    }),
    getRating(memberIds),
  ]);

  // O'quvchi bo'yicha (shu guruhdagi) davomat foizi
  const studentAtt = new Map<string, { present: number; total: number }>();
  for (const a of attRows) {
    const cur = studentAtt.get(a.studentId) ?? { present: 0, total: 0 };
    cur.total += 1;
    if (a.status === "PRESENT" || a.status === "LATE") cur.present += 1;
    studentAtt.set(a.studentId, cur);
  }

  // So'nggi 5 dars sanasi bo'yicha davomat
  const byDate = new Map<string, { PRESENT: number; LATE: number; ABSENT: number; EXCUSED: number; total: number }>();
  for (const a of attRows) {
    const cur = byDate.get(a.date) ?? { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0, total: 0 };
    if (a.status in cur) cur[a.status as keyof typeof ATTENDANCE_STATUS] += 1;
    cur.total += 1;
    byDate.set(a.date, cur);
  }
  const lastDates = [...byDate.keys()].sort().reverse().slice(0, 5);

  // Vazifa bo'yicha topshirgan / tekshirilmagan sonlar
  const hwStats = new Map<string, { submitted: number; ungraded: number }>();
  for (const row of subStats) {
    const cur = hwStats.get(row.homeworkId) ?? { submitted: 0, ungraded: 0 };
    cur.submitted += row._count._all;
    if (row.status === "SUBMITTED") cur.ungraded += row._count._all;
    hwStats.set(row.homeworkId, cur);
  }

  const days = parseJsonArray(group.days);

  return (
    <div>
      <PageHeader
        title={group.name}
        subtitle={
          <>
            {group.type ? `${group.type} · ` : ""}
            {days.join(", ")} · {group.time}
            {group.room ? ` · ${group.room}-xona` : ""}
          </>
        }
        backHref="/teacher/groups"
        action={<ActiveBadge active={group.active} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              O'quvchilar ({group.students.length})
            </h3>
            <Table
              head={
                <>
                  <Th>O'quvchi</Th>
                  <Th className="text-right">Ball</Th>
                  <Th className="text-right">XP</Th>
                  <Th>Level</Th>
                  <Th>Davomat</Th>
                </>
              }
            >
              {group.students.length === 0 ? (
                <tr>
                  <Td className="py-8 text-center text-slate-400">O'quvchilar yo'q</Td>
                  <Td /><Td /><Td /><Td />
                </tr>
              ) : (
                group.students.map((m) => {
                  const att = studentAtt.get(m.student.id);
                  const percent = att ? pct(att.present, att.total) : 0;
                  return (
                    <tr key={m.student.id} className="hover:bg-white/[0.04]">
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={m.student.name} image={m.student.image} size="sm" />
                          <span className="font-medium text-slate-200">{m.student.name}</span>
                        </div>
                      </Td>
                      <Td className="text-right font-semibold text-amber-600">
                        {m.student.points}
                      </Td>
                      <Td className="text-right font-semibold text-blue-400">{m.student.xp}</Td>
                      <Td>
                        <Badge className="bg-violet-500/15 text-violet-400">
                          Lv {levelFromXp(m.student.xp).level}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={percent} className="w-20" />
                          <span className="text-xs font-medium text-slate-500">{percent}%</span>
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </Table>
          </div>

          <Card>
            <CardTitle
              action={
                <Link href="/teacher/homework/new" className={btn.small}>
                  + Yangi vazifa
                </Link>
              }
            >
              Uyga vazifalar
            </CardTitle>
            {group.homeworks.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">Vazifalar yo'q</div>
            ) : (
              <div className="divide-y divide-white/5">
                {group.homeworks.map((hw) => {
                  const st = hwStats.get(hw.id) ?? { submitted: 0, ungraded: 0 };
                  return (
                    <div key={hw.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/teacher/homework/${hw.id}`}
                          className="text-sm font-medium text-slate-200 hover:text-blue-400"
                        >
                          {hw.title}
                        </Link>
                        <div className="text-xs text-slate-400">
                          Muddat: {fmtDateTime(hw.dueAt)} · Topshirdi: {st.submitted}/{group.students.length}
                        </div>
                      </div>
                      {st.ungraded > 0 && (
                        <Badge className="bg-amber-500/15 text-amber-400">
                          {st.ungraded} ta tekshirilmagan
                        </Badge>
                      )}
                      <Link href={`/teacher/homework/${hw.id}`} className={btn.small}>
                        Tekshirish
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardTitle
              action={
                <Link href="/teacher/exams" className={btn.small}>
                  Imtihonlar
                </Link>
              }
            >
              Imtihonlar
            </CardTitle>
            {group.exams.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">Imtihonlar yo'q</div>
            ) : (
              <div className="divide-y divide-white/5">
                {group.exams.map((exam) => {
                  const avg =
                    exam.results.length > 0
                      ? Math.round(
                          exam.results.reduce((s, r) => s + r.score, 0) / exam.results.length
                        )
                      : null;
                  return (
                    <div key={exam.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/teacher/exams/${exam.id}`}
                          className="text-sm font-medium text-slate-200 hover:text-blue-400"
                        >
                          {exam.title}
                        </Link>
                        <div className="text-xs text-slate-400">
                          {fmtDate(exam.date)} · {exam.results.length} ta natija
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-400">
                        O'rtacha: {avg !== null ? `${avg} / ${exam.maxScore}` : "—"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle>Guruh reytingi</CardTitle>
            {rating.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">O'quvchilar yo'q</div>
            ) : (
              <div className="divide-y divide-white/5">
                {rating.map((r) => (
                  <div key={r.studentId} className="flex items-center gap-3 py-2.5">
                    <span className="flex w-7 justify-center">
                      <RankMedal place={r.place} size="sm" showBadge />
                    </span>
                    <Avatar name={r.name} image={r.image} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                      {r.name}
                    </span>
                    <span className="text-sm font-semibold text-blue-400">{r.xp} XP</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardTitle
              action={
                <Link href={`/teacher/attendance?guruh=${group.id}`} className={btn.small}>
                  Davomat olish
                </Link>
              }
            >
              So'nggi davomat
            </CardTitle>
            {lastDates.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">Davomat yozuvlari yo'q</div>
            ) : (
              <div className="space-y-3">
                {lastDates.map((date) => {
                  const c = byDate.get(date)!;
                  const percent = pct(c.PRESENT + c.LATE, c.total);
                  return (
                    <div key={date}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-200">{fmtDate(date)}</span>
                        <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" strokeWidth={2} />
                            {c.PRESENT}
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <Clock className="h-3 w-3 text-amber-400" strokeWidth={2} />
                            {c.LATE}
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <X className="h-3 w-3 text-rose-400" strokeWidth={2} />
                            {c.ABSENT}
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <FileText className="h-3 w-3 text-blue-400" strokeWidth={2} />
                            {c.EXCUSED}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={percent} className="flex-1" />
                        <span className="w-9 text-right text-xs font-semibold text-slate-500">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
