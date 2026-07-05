// O'quvchi profili — ballar, daraja, guruhlar, davomat, vazifalar, imtihonlar, yutuqlar
import Link from "next/link";
import { notFound } from "next/navigation";
import { can, requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ATTENDANCE_STATUS, SUBMISSION_STATUS, type AttendanceStatus, type SubmissionStatus } from "@/lib/constants";
import { levelFromXp } from "@/lib/gamification";
import { fmtDate, fmtDateTime, fmtNumber, parseJsonArray, pct } from "@/lib/utils";
import { CheckCircle2, Flame, Gem, Zap } from "lucide-react";
import {
  ActiveBadge,
  Avatar,
  Badge,
  Card,
  CardTitle,
  PageHeader,
  ProgressBar,
  StatCard,
  Table,
  Td,
  Th,
  btn,
} from "@/components/ui";
import { SegmentBar } from "@/components/charts";

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "#10b981",
  LATE: "#f59e0b",
  ABSENT: "#f43f5e",
  EXCUSED: "#0ea5e9",
};

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "students.view");
  const canEdit = can(session, "students.edit");

  const { id } = await params;
  const student = await db.user.findUnique({
    where: { id },
    include: {
      groupMemberships: {
        include: {
          group: {
            select: {
              id: true,
              name: true,
              days: true,
              time: true,
              room: true,
              active: true,
              teacher: { select: { id: true, name: true } },
            },
          },
        },
      },
      submissions: {
        orderBy: { submittedAt: "desc" },
        include: { homework: { select: { title: true, maxScore: true } } },
      },
      examResults: {
        include: {
          exam: { select: { title: true, date: true, maxScore: true, group: { select: { name: true } } } },
        },
      },
      achievements: {
        orderBy: { earnedAt: "desc" },
        include: { achievement: true },
      },
    },
  });
  if (!student || student.role !== "STUDENT") notFound();

  const groupIds = student.groupMemberships.map((m) => m.group.id);

  const [attendanceRows, missedCount] = await Promise.all([
    db.attendance.findMany({ where: { studentId: id }, select: { status: true } }),
    db.homework.count({
      where: {
        groupId: { in: groupIds },
        dueAt: { lt: new Date() },
        submissions: { none: { studentId: id } },
      },
    }),
  ]);

  const lvl = levelFromXp(student.xp);
  const presentCount = attendanceRows.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  const attendancePct = pct(presentCount, attendanceRows.length);
  const acceptedCount = student.submissions.filter((s) => s.status === "ACCEPTED").length;
  const recentSubmissions = student.submissions.slice(0, 6);

  const statusKeys = Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[];
  const segments = statusKeys.map((key) => ({
    label: ATTENDANCE_STATUS[key].label,
    value: attendanceRows.filter((r) => r.status === key).length,
    color: STATUS_COLORS[key],
  }));

  const examResults = [...student.examResults].sort(
    (a, b) => b.exam.date.getTime() - a.exam.date.getTime()
  );

  return (
    <div>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {student.name}
            <Badge className="bg-violet-500/15 text-violet-400">{student.studentType ?? "Oddiy"}</Badge>
            <ActiveBadge active={student.active} />
          </span>
        }
        subtitle="O'quvchi profili"
        backHref="/admin/students"
        action={
          canEdit ? (
            <Link href={`/admin/students/${student.id}/edit`} className={btn.primary}>
              Tahrirlash
            </Link>
          ) : undefined
        }
      />

      {/* Sarlavha karta */}
      <Card className="mb-4 flex flex-wrap items-center gap-4">
        <Avatar name={student.name} image={student.image} size="lg" />
        <div className="min-w-0">
          <div className="text-lg font-bold text-white">{student.name}</div>
          <div className="text-sm text-slate-500">
            {student.login} · {student.phone ?? "telefon kiritilmagan"}
            {student.parentPhone ? ` · Ota-ona: ${student.parentPhone}` : ""}
          </div>
        </div>
      </Card>

      {/* Stat kartalar */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Umumiy ball" value={fmtNumber(student.points)} icon={Gem} tone="indigo" hint="Magazin balli" />
        <StatCard label="XP" value={fmtNumber(student.xp)} icon={Zap} tone="violet" hint="Tajriba balli" />
        <Card>
          <div className="text-xs font-medium text-slate-500">Daraja</div>
          <div className="text-2xl font-bold text-white">{lvl.level}-daraja</div>
          <div className="mt-2">
            <ProgressBar value={lvl.progress * 100} />
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {fmtNumber(lvl.intoLevel)}/{fmtNumber(lvl.needed)} XP
          </div>
        </Card>
        <StatCard label="Streak" value={student.streak} icon={Flame} tone="amber" hint="Ketma-ket faol kunlar" />
        <StatCard
          label="Davomat"
          value={`${attendancePct}%`}
          icon={CheckCircle2}
          tone="emerald"
          hint={`${fmtNumber(attendanceRows.length)} ta yozuvdan`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Guruhlari va ustozlari</CardTitle>
          {student.groupMemberships.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Guruhga biriktirilmagan</p>
          ) : (
            <div className="space-y-3">
              {student.groupMemberships.map((m) => (
                <div key={m.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/admin/groups/${m.group.id}`}
                      className="text-sm font-semibold text-slate-100 hover:text-blue-400"
                    >
                      {m.group.name}
                    </Link>
                    <ActiveBadge active={m.group.active} />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Ustoz:{" "}
                    {m.group.teacher ? (
                      <Link href={`/admin/teachers/${m.group.teacher.id}`} className="font-medium hover:text-blue-400">
                        {m.group.teacher.name}
                      </Link>
                    ) : (
                      "biriktirilmagan"
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {parseJsonArray(m.group.days).join(", ")} · {m.group.time}
                    {m.group.room ? ` · ${m.group.room}-xona` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Davomat statistikasi</CardTitle>
          <SegmentBar segments={segments} />
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Uyga vazifalar</CardTitle>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <div className="text-2xl font-bold text-emerald-700">{acceptedCount}</div>
              <div className="text-xs font-medium text-emerald-600">Bajarilgan</div>
            </div>
            <div className="rounded-xl bg-rose-50 p-3 text-center">
              <div className="text-2xl font-bold text-rose-700">{missedCount}</div>
              <div className="text-xs font-medium text-rose-600">Bajarilmagan</div>
            </div>
          </div>
          {recentSubmissions.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">Topshiriqlar yo'q</p>
          ) : (
            <div className="divide-y divide-white/5">
              {recentSubmissions.map((s) => {
                const st = SUBMISSION_STATUS[s.status as SubmissionStatus];
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-100">{s.homework.title}</div>
                      <div className="text-xs text-slate-400">Topshirildi: {fmtDateTime(s.submittedAt)}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {s.score !== null && (
                        <span className="text-sm font-bold text-slate-700">
                          {s.score}/{s.homework.maxScore}
                        </span>
                      )}
                      <Badge className={st?.badge}>{st?.label ?? s.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Imtihon natijalari</CardTitle>
          {examResults.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Imtihon natijalari yo'q</p>
          ) : (
            <div className="-m-5 mt-0 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-slate-500">
                    <Th>Imtihon</Th>
                    <Th>Guruh</Th>
                    <Th>Sana</Th>
                    <Th className="text-right">Ball</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {examResults.map((r) => (
                    <tr key={r.id}>
                      <Td className="font-medium text-slate-100">{r.exam.title}</Td>
                      <Td className="text-slate-500">{r.exam.group.name}</Td>
                      <Td className="text-slate-500">{fmtDate(r.exam.date)}</Td>
                      <Td className="text-right font-bold text-slate-700">
                        {r.score}/{r.exam.maxScore}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardTitle>Yutuqlari</CardTitle>
          {student.achievements.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Hozircha yutuqlar yo'q</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {student.achievements.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-3xl">{a.achievement.icon}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-100">{a.achievement.name}</div>
                    <div className="text-xs text-slate-500">{a.achievement.description}</div>
                    <div className="mt-1 text-xs text-slate-400">{fmtDate(a.earnedAt)}</div>
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
