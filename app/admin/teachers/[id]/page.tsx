// O'qituvchi profili — ma'lumotlar, guruhlar, davomat statistikasi, reyting
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ATTENDANCE_STATUS, type AttendanceStatus } from "@/lib/constants";
import { fmtDate, fmtNumber, parseJsonArray, pct } from "@/lib/utils";
import { BookOpen, FileText, GraduationCap, Users } from "lucide-react";
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
  inputCls,
} from "@/components/ui";
import { SegmentBar } from "@/components/charts";
import { Modal } from "@/components/modal";
import { assignGroupToTeacher } from "../actions";

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "#10b981",
  LATE: "#f59e0b",
  ABSENT: "#f43f5e",
  EXCUSED: "#0ea5e9",
};

const isPresent = (s: string) => s === "PRESENT" || s === "LATE";

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "teachers.manage");

  const { id } = await params;
  const teacher = await db.user.findUnique({
    where: { id },
    include: {
      teacherSubjects: {
        include: { subject: { select: { id: true, name: true } } },
      },
      teachingGroups: {
        orderBy: { name: "asc" },
        include: {
          subject: { select: { id: true, name: true } },
          _count: { select: { students: true } },
        },
      },
    },
  });
  if (!teacher || teacher.role !== "TEACHER") notFound();

  const groupIds = teacher.teachingGroups.map((g) => g.id);

  const [memberRows, attendanceRows, hwAgg, examAgg, allActiveGroups] = await Promise.all([
    db.groupStudent.findMany({ where: { groupId: { in: groupIds } }, select: { studentId: true } }),
    db.attendance.findMany({ where: { groupId: { in: groupIds } }, select: { status: true, groupId: true } }),
    db.submission.aggregate({
      where: { status: "ACCEPTED", homework: { groupId: { in: groupIds } } },
      _avg: { score: true },
    }),
    db.examResult.aggregate({
      where: { exam: { groupId: { in: groupIds } } },
      _avg: { score: true },
    }),
    db.group.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, teacherId: true, teacher: { select: { name: true } } },
    }),
  ]);

  // Allaqachon shu o'qituvchiga tegishli guruhlarni chiqarib tashlaymiz
  const assignableGroups = allActiveGroups.filter((g) => g.teacherId !== id);

  const totalStudents = new Set(memberRows.map((m) => m.studentId)).size;

  // Davomat statistikasi segmentlari
  const statusKeys = Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[];
  const segments = statusKeys.map((key) => ({
    label: ATTENDANCE_STATUS[key].label,
    value: attendanceRows.filter((r) => r.status === key).length,
    color: STATUS_COLORS[key],
  }));

  // O'qituvchi reytingi — guruhlari davomat foizlarining o'rtachasi
  const groupPercents = groupIds
    .map((gid) => {
      const rows = attendanceRows.filter((r) => r.groupId === gid);
      if (rows.length === 0) return null;
      return pct(rows.filter((r) => isPresent(r.status)).length, rows.length);
    })
    .filter((p): p is number => p !== null);
  const rating =
    groupPercents.length > 0
      ? Math.round(groupPercents.reduce((s, p) => s + p, 0) / groupPercents.length)
      : 0;

  const avgHomework = hwAgg._avg.score !== null ? Math.round(hwAgg._avg.score) : null;
  const avgExam = examAgg._avg.score !== null ? Math.round(examAgg._avg.score) : null;

  return (
    <div>
      <PageHeader
        title={teacher.name}
        subtitle="O'qituvchi profili"
        backHref="/admin/teachers"
        action={
          <Link href={`/admin/teachers/${teacher.id}/edit`} className={btn.primary}>
            Tahrirlash
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chap ustun: ma'lumotlar va reyting */}
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col items-center text-center">
              <Avatar name={teacher.name} image={teacher.image} size="xl" />
              <div className="mt-3 text-lg font-bold text-white">{teacher.name}</div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                <Badge className="bg-blue-500/15 text-blue-400">
                  {teacher.teacherType ?? "O'qituvchi"}
                </Badge>
                <ActiveBadge active={teacher.active} />
              </div>
              {teacher.teacherSubjects.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {teacher.teacherSubjects.map((ts) => (
                    <Badge key={ts.subject.id} className="bg-violet-500/15 text-violet-400">
                      {ts.subject.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Login</dt>
                <dd className="font-medium text-slate-200">{teacher.login}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Telefon</dt>
                <dd className="font-medium text-slate-200">{teacher.phone ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Turi</dt>
                <dd className="font-medium text-slate-200">{teacher.teacherType ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Qo'shilgan sana</dt>
                <dd className="font-medium text-slate-200">{fmtDate(teacher.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardTitle>O'qituvchi reytingi</CardTitle>
            <div className="text-4xl font-bold text-blue-400">{rating}%</div>
            <div className="mt-3">
              <ProgressBar value={rating} />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Reyting o'qituvchi guruhlaridagi davomat foizlarining o'rtachasi asosida hisoblanadi.
            </p>
          </Card>
        </div>

        {/* O'ng ustun */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Guruhlari" value={fmtNumber(teacher.teachingGroups.length)} icon={Users} tone="sky" />
            <StatCard label="Jami o'quvchilari" value={fmtNumber(totalStudents)} icon={GraduationCap} tone="violet" />
            <StatCard
              label="O'rtacha vazifa bali"
              value={avgHomework !== null ? avgHomework : "—"}
              icon={BookOpen}
              tone="emerald"
              hint="Qabul qilingan vazifalar"
            />
            <StatCard
              label="O'rtacha imtihon bali"
              value={avgExam !== null ? avgExam : "—"}
              icon={FileText}
              tone="amber"
              hint="Barcha imtihonlar"
            />
          </div>

          <Card>
            <CardTitle
              action={
                <Modal
                  trigger={<button className={btn.small}>+ Guruh biriktirish</button>}
                  title="Guruh biriktirish"
                >
                  {assignableGroups.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">
                      Biriktirish uchun boshqa faol guruh yo'q.
                    </p>
                  ) : (
                    <form action={assignGroupToTeacher} className="space-y-4">
                      <input type="hidden" name="teacherId" value={teacher.id} />
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-200">
                          Guruhni tanlang
                        </label>
                        <select name="groupId" required className={inputCls}>
                          {assignableGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                              {g.teacher ? ` — hozirgi: ${g.teacher.name}` : " — o'qituvchisiz"}
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 text-xs text-slate-400">
                          Tanlangan guruh shu o'qituvchiga o'tkaziladi.
                        </p>
                      </div>
                      <button type="submit" className={btn.primary}>
                        Biriktirish
                      </button>
                    </form>
                  )}
                </Modal>
              }
            >
              Guruhlari va dars jadvali
            </CardTitle>
            {teacher.teachingGroups.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Hozircha guruh biriktirilmagan</p>
            ) : (
              <div className="-m-5 mt-0 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-slate-500">
                      <Th>Guruh</Th>
                      <Th>Kategoriya</Th>
                      <Th>Dars kunlari</Th>
                      <Th>Vaqti</Th>
                      <Th>Xona</Th>
                      <Th>O'quvchilar</Th>
                      <Th>Holat</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {teacher.teachingGroups.map((g) => (
                      <tr key={g.id} className="hover:bg-white/[0.04]">
                        <Td>
                          <Link
                            href={`/admin/groups/${g.id}`}
                            className="font-medium text-slate-100 hover:text-blue-400"
                          >
                            {g.name}
                          </Link>
                        </Td>
                        <Td>
                          {g.subject ? (
                            <Badge className="bg-violet-500/15 text-violet-400">{g.subject.name}</Badge>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </Td>
                        <Td className="text-slate-600">{parseJsonArray(g.days).join(", ")}</Td>
                        <Td className="text-slate-600">{g.time}</Td>
                        <Td className="text-slate-600">{g.room ?? "—"}</Td>
                        <Td className="text-slate-600">{g._count.students} ta</Td>
                        <Td>
                          <ActiveBadge active={g.active} />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <CardTitle>Davomat statistikasi (barcha guruhlari bo'yicha)</CardTitle>
            <SegmentBar segments={segments} />
          </Card>

          <Card>
            <CardTitle>O'quvchilarining umumiy natijalari</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="text-xs font-medium text-emerald-600">O'rtacha vazifa bali</div>
                <div className="mt-1 text-2xl font-bold text-emerald-700">
                  {avgHomework !== null ? avgHomework : "—"}
                </div>
                <div className="text-xs text-emerald-600/70">Qabul qilingan topshiriqlar bo'yicha</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <div className="text-xs font-medium text-amber-600">O'rtacha imtihon bali</div>
                <div className="mt-1 text-2xl font-bold text-amber-700">
                  {avgExam !== null ? avgExam : "—"}
                </div>
                <div className="text-xs text-amber-600/70">Guruhlaridagi barcha imtihonlar bo'yicha</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
