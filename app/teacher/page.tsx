// O'qituvchi dashboardi — guruhlar, davomat, vazifalar bo'yicha umumiy manzara
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { weekdayNameFor } from "@/lib/constants";
import { fmtDateTime, fmtNumber, parseJsonArray, pct } from "@/lib/utils";
import { levelFromXp } from "@/lib/gamification";
import {
  Avatar,
  Badge,
  Card,
  CardTitle,
  EmptyState,
  PageHeader,
  ProgressBar,
  StatCard,
  btn,
} from "@/components/ui";

export default async function TeacherDashboardPage() {
  const session = await requireRole("TEACHER");

  const groups = await db.group.findMany({
    where: { teacherId: session.id },
    include: { _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });
  const groupIds = groups.map((g) => g.id);
  const activeGroups = groups.filter((g) => g.active);

  const memberRows = await db.groupStudent.findMany({
    where: { groupId: { in: groupIds } },
    select: { studentId: true },
  });
  const studentIds = [...new Set(memberRows.map((r) => r.studentId))];

  const todayName = weekdayNameFor(new Date());
  const todaysGroups = activeGroups
    .filter((g) => parseJsonArray(g.days).includes(todayName))
    .sort((a, b) => a.time.localeCompare(b.time));

  const [ungradedCount, attByGroup, attByStudent, students, pending] = await Promise.all([
    db.submission.count({
      where: { status: "SUBMITTED", homework: { group: { teacherId: session.id } } },
    }),
    db.attendance.groupBy({
      by: ["groupId", "status"],
      where: { groupId: { in: groupIds } },
      _count: { _all: true },
    }),
    db.attendance.groupBy({
      by: ["studentId", "status"],
      where: { groupId: { in: groupIds } },
      _count: { _all: true },
    }),
    db.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true, image: true, xp: true },
    }),
    db.submission.findMany({
      where: { status: "SUBMITTED", homework: { group: { teacherId: session.id } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: {
        student: { select: { name: true, image: true } },
        homework: { select: { id: true, title: true, group: { select: { name: true } } } },
      },
    }),
  ]);

  // Guruh bo'yicha davomat foizi
  const groupAtt = new Map<string, { present: number; total: number }>();
  for (const row of attByGroup) {
    const cur = groupAtt.get(row.groupId) ?? { present: 0, total: 0 };
    cur.total += row._count._all;
    if (row.status === "PRESENT" || row.status === "LATE") cur.present += row._count._all;
    groupAtt.set(row.groupId, cur);
  }
  const totalAtt = [...groupAtt.values()].reduce(
    (acc, v) => ({ present: acc.present + v.present, total: acc.total + v.total }),
    { present: 0, total: 0 }
  );
  const avgAttendance = pct(totalAtt.present, totalAtt.total);

  // O'quvchi bo'yicha davomat foizi (past natijalilar uchun)
  const studentAtt = new Map<string, { present: number; total: number }>();
  for (const row of attByStudent) {
    const cur = studentAtt.get(row.studentId) ?? { present: 0, total: 0 };
    cur.total += row._count._all;
    if (row.status === "PRESENT" || row.status === "LATE") cur.present += row._count._all;
    studentAtt.set(row.studentId, cur);
  }
  const studentById = new Map(students.map((s) => [s.id, s]));

  const topStudents = [...students].sort((a, b) => b.xp - a.xp).slice(0, 5);
  const lowStudents = [...studentAtt.entries()]
    .map(([id, v]) => ({ student: studentById.get(id), percent: pct(v.present, v.total) }))
    .filter((r) => r.student)
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 5);

  const ratingTone =
    avgAttendance >= 85
      ? "bg-emerald-100 text-emerald-700"
      : avgAttendance >= 70
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Xush kelibsiz, ${session.name}!`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Biriktirilgan guruhlar" value={activeGroups.length} icon="👥" tone="indigo" />
        <StatCard label="Jami o'quvchilar" value={studentIds.length} icon="🎓" tone="sky" />
        <StatCard label="Bugungi darslar" value={todaysGroups.length} icon="📅" tone="violet" hint={todayName} />
        <StatCard label="Tekshirilmagan vazifalar" value={ungradedCount} icon="📥" tone="amber" />
        <StatCard label="O'rtacha davomat" value={`${avgAttendance}%`} icon="✅" tone="emerald" />
        <StatCard
          label="O'qituvchi reytingi"
          value={<Badge className={ratingTone}>{avgAttendance}%</Badge>}
          icon="🏆"
          tone="rose"
          hint="Guruhlar davomati asosida"
        />
      </div>

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="👥"
            title="Sizga hali guruh biriktirilmagan"
            hint="Administrator guruh biriktirgach, bu yerda ma'lumotlar ko'rinadi."
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle action={<Link href="/teacher/attendance" className={btn.small}>Davomat olish</Link>}>
                Bugungi dars jadvali
              </CardTitle>
              {todaysGroups.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Bugun darslar yo'q</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {todaysGroups.map((g) => (
                    <div key={g.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <Link href={`/teacher/groups/${g.id}`} className="text-sm font-semibold text-slate-800 hover:text-indigo-600">
                          {g.name}
                        </Link>
                        <div className="text-xs text-slate-400">
                          {g._count.students} o'quvchi{g.room ? ` · ${g.room}-xona` : ""}
                        </div>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700">{g.time}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardTitle action={<Link href="/teacher/groups" className={btn.small}>Barchasi</Link>}>
                Guruhlar holati
              </CardTitle>
              <div className="space-y-4">
                {groups.map((g) => {
                  const att = groupAtt.get(g.id);
                  const percent = att ? pct(att.present, att.total) : 0;
                  return (
                    <div key={g.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <Link href={`/teacher/groups/${g.id}`} className="font-medium text-slate-700 hover:text-indigo-600">
                          {g.name}
                        </Link>
                        <span className="text-xs text-slate-400">
                          {g._count.students} o'quvchi · davomat {percent}%
                        </span>
                      </div>
                      <ProgressBar value={percent} />
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardTitle action={<Link href="/teacher/rating" className={btn.small}>Reyting</Link>}>
                Eng faol o'quvchilar
              </CardTitle>
              {topStudents.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">O'quvchilar yo'q</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {topStudents.map((s, i) => {
                    const level = levelFromXp(s.xp).level;
                    return (
                      <div key={s.id} className="flex items-center gap-3 py-2.5">
                        <span className="w-6 text-center text-sm font-semibold text-slate-400">{i + 1}</span>
                        <Avatar name={s.name} image={s.image} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{s.name}</span>
                        <Badge className="bg-violet-100 text-violet-700">Lv {level}</Badge>
                        <span className="text-sm font-semibold text-indigo-600">{fmtNumber(s.xp)} XP</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <CardTitle>Past natijali o'quvchilar</CardTitle>
              {lowStudents.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Davomat ma'lumotlari yo'q</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {lowStudents.map(({ student, percent }) => (
                    <div key={student!.id} className="flex items-center gap-3 py-2.5">
                      <Avatar name={student!.name} image={student!.image} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-700">{student!.name}</div>
                        <div className="text-xs text-slate-400">Sabab: davomat past</div>
                      </div>
                      <Badge
                        className={
                          percent >= 70 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                        }
                      >
                        {percent}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="mt-6">
            <CardTitle action={<Link href="/teacher/homework" className={btn.small}>Barcha vazifalar</Link>}>
              Tekshirish kutilayotgan vazifalar
            </CardTitle>
            {pending.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                Tekshirish kutilayotgan topshiriqlar yo'q 🎉
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pending.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Avatar name={s.student.name} image={s.student.image} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-700">{s.student.name}</div>
                      <div className="truncate text-xs text-slate-400">
                        {s.homework.title} · {s.homework.group.name}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{fmtDateTime(s.submittedAt)}</span>
                    <Link href={`/teacher/homework/${s.homework.id}`} className={btn.small}>
                      Tekshirish
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
