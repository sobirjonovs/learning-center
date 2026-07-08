// Guruh sahifasi — ma'lumotlar, o'quvchilar, davomat, vazifalar, imtihonlar, reyting
import Link from "next/link";
import { notFound } from "next/navigation";
import { can, requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ATTENDANCE_STATUS, type AttendanceStatus } from "@/lib/constants";
import { getRating } from "@/lib/gamification";
import {
  buildPriceMap,
  currentMonth,
  expectedMonthlyFee,
  PAYMENT_STATUS,
  paymentStatus,
} from "@/lib/payments";
import { fmtDate, fmtDateTime, fmtNumber, parseJsonArray, pct } from "@/lib/utils";
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
  inputCls,
} from "@/components/ui";
import { SegmentBar } from "@/components/charts";
import { Modal } from "@/components/modal";
import { ActionForm } from "@/components/action-form";
import { InlineActionForm } from "@/components/inline-action-form";
import { RankMedal } from "@/components/rank-medal";
import { addStudentToGroup, removeStudentFromGroup } from "../actions";

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "#10b981",
  LATE: "#f59e0b",
  ABSENT: "#f43f5e",
  EXCUSED: "#0ea5e9",
};

const isPresent = (s: string) => s === "PRESENT" || s === "LATE";

/** "YYYY-MM-DD" -> "DD.MM.YYYY" (mahalliy vaqt zonasiga bog'liq emas) */
const fmtDay = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "groups.manage");
  const canPayments = can(session, "payments.manage");
  const activeMonth = currentMonth();

  const { id } = await params;
  const group = await db.group.findUnique({
    where: { id },
    include: {
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, image: true, teacherType: true } },
      students: {
        orderBy: { joinedAt: "asc" },
        include: {
          student: { select: { id: true, name: true, image: true, points: true, xp: true, active: true, studentType: true } },
        },
      },
      homeworks: {
        orderBy: { dueAt: "desc" },
        include: { _count: { select: { submissions: true } } },
      },
      exams: {
        orderBy: { endAt: "desc" },
        include: { results: { where: { status: "ACCEPTED" }, select: { score: true } } },
      },
    },
  });
  if (!group) notFound();

  const memberIds = group.students.map((m) => m.student.id);

  const [attendanceRows, availableStudents, rating, prices, monthPayments] = await Promise.all([
    db.attendance.findMany({
      where: { groupId: id },
      select: { studentId: true, status: true, date: true },
    }),
    db.user.findMany({
      where: { role: "STUDENT", active: true, id: { notIn: memberIds } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getRating(memberIds),
    canPayments
      ? db.subjectPrice.findMany({ select: { subjectId: true, groupType: true, monthlyFee: true } })
      : Promise.resolve([]),
    canPayments
      ? db.studentPayment.findMany({
          where: { groupId: id, month: activeMonth },
          select: { studentId: true, amount: true },
        })
      : Promise.resolve([]),
  ]);

  const priceMap = buildPriceMap(prices);
  const payMap = new Map(monthPayments.map((p) => [p.studentId, p.amount]));

  // Umumiy davomat segmentlari
  const statusKeys = Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[];
  const segments = statusKeys.map((key) => ({
    label: ATTENDANCE_STATUS[key].label,
    value: attendanceRows.filter((r) => r.status === key).length,
    color: STATUS_COLORS[key],
  }));

  // O'quvchi kesimida guruh ichidagi davomat foizi
  const memberPercent = (studentId: string) => {
    const rows = attendanceRows.filter((r) => r.studentId === studentId);
    return pct(rows.filter((r) => isPresent(r.status)).length, rows.length);
  };

  // So'nggi 10 dars sanasi va har birining davomat foizi
  const lessonDates = Array.from(new Set(attendanceRows.map((r) => r.date)))
    .sort()
    .reverse()
    .slice(0, 10)
    .map((date) => {
      const rows = attendanceRows.filter((r) => r.date === date);
      return {
        date,
        total: rows.length,
        present: rows.filter((r) => isPresent(r.status)).length,
        percent: pct(rows.filter((r) => isPresent(r.status)).length, rows.length),
      };
    });

  const days = parseJsonArray(group.days);

  return (
    <div>
      <PageHeader
        title={group.name}
        subtitle="Guruh sahifasi"
        backHref="/admin/groups"
        action={
          <Link href={`/admin/groups/${group.id}/edit`} className={btn.primary}>
            Tahrirlash
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardTitle>Guruh ma'lumotlari</CardTitle>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Fan kategoriyasi</dt>
              <dd>
                {group.subject ? (
                  <Badge className="bg-violet-500/15 text-violet-400">{group.subject.name}</Badge>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Turi</dt>
              <dd>
                <Badge className="bg-cyan-500/15 text-cyan-400">{group.type ?? "—"}</Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">O'qituvchi</dt>
              <dd className="font-medium text-slate-200">
                {group.teacher ? (
                  <Link href={`/admin/teachers/${group.teacher.id}`} className="hover:text-blue-400">
                    {group.teacher.name}
                  </Link>
                ) : (
                  "Biriktirilmagan"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">O'quvchilar soni</dt>
              <dd className="font-medium text-slate-200">{group.students.length} ta</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Boshlanish sanasi</dt>
              <dd className="font-medium text-slate-200">{fmtDate(group.startDate)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Tugash sanasi</dt>
              <dd className="font-medium text-slate-200">{fmtDate(group.endDate)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Holat</dt>
              <dd>
                <ActiveBadge active={group.active} />
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle>Dars jadvali</CardTitle>
          <div className="space-y-3 text-sm">
            <div>
              <div className="mb-1.5 text-xs font-medium text-slate-400">Dars kunlari</div>
              <div className="flex flex-wrap gap-1.5">
                {days.length > 0 ? (
                  days.map((d) => (
                    <Badge key={d} className="bg-blue-500/15 text-blue-400">
                      {d}
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-400">Dars vaqti</span>
              <span className="font-medium text-slate-200">{group.time}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-400">Xona</span>
              <span className="font-medium text-slate-200">{group.room ?? "—"}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Umumiy davomat</CardTitle>
          <SegmentBar segments={segments} />
        </Card>
      </div>

      {/* O'quvchilar */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-200">O'quvchilar ro'yxati</h2>
          <div className="flex flex-wrap items-center gap-2">
            {canPayments && (
              <Link
                href={`/admin/payments?groupId=${group.id}&month=${activeMonth}`}
                className={btn.secondary}
              >
                To'lovlar ({activeMonth})
              </Link>
            )}
            <Modal
              trigger={<button className={btn.primary}>+ O'quvchi qo'shish</button>}
              title="Guruhga o'quvchi qo'shish"
            >
            {availableStudents.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                Qo'shish uchun faol o'quvchi qolmadi — barchasi allaqachon guruhda.
              </p>
            ) : (
              <ActionForm action={addStudentToGroup} className="space-y-4">
                <input type="hidden" name="groupId" value={group.id} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-200">
                    O'quvchini tanlang
                  </label>
                  <select name="studentId" required className={inputCls}>
                    {availableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className={btn.primary}>
                  Qo'shish
                </button>
              </ActionForm>
            )}
          </Modal>
          </div>
        </div>

        {group.students.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-slate-400">Guruhda hali o'quvchi yo'q</p>
          </Card>
        ) : (
          <Table
            head={
              <>
                <Th>O'quvchi</Th>
                <Th>Ball</Th>
                <Th>XP</Th>
                <Th>Davomat</Th>
                {canPayments && <Th>To'lov ({activeMonth})</Th>}
                <Th>Qo'shilgan sana</Th>
                <Th>Holat</Th>
                <Th className="text-right">Amallar</Th>
              </>
            }
          >
            {group.students.map((m) => {
              const p = memberPercent(m.student.id);
              const paid = payMap.get(m.student.id) ?? 0;
              const fee = expectedMonthlyFee(priceMap, group.subject?.id, group.type, m.student.studentType);
              const paySt = PAYMENT_STATUS[paymentStatus(paid, fee, m.student.studentType)];
              return (
                <tr key={m.id} className="hover:bg-white/[0.04]">
                  <Td>
                    <Link href={`/admin/students/${m.student.id}`} className="flex items-center gap-3">
                      <Avatar name={m.student.name} image={m.student.image} size="sm" />
                      <span className="font-medium text-slate-100 hover:text-blue-400">
                        {m.student.name}
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-slate-600">{fmtNumber(m.student.points)}</Td>
                  <Td className="text-slate-600">{fmtNumber(m.student.xp)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-16">
                        <ProgressBar value={p} barClassName="bg-emerald-500" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{p}%</span>
                    </div>
                  </Td>
                  {canPayments && (
                    <Td>
                      <div className="space-y-0.5">
                        <Badge tone={paySt.tone}>{paySt.label}</Badge>
                        <div className="text-xs text-slate-500">{fmtNumber(paid)} so'm</div>
                      </div>
                    </Td>
                  )}
                  <Td className="text-slate-500">{fmtDate(m.joinedAt)}</Td>
                  <Td>
                    <ActiveBadge active={m.student.active} />
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <InlineActionForm
                        action={removeStudentFromGroup}
                        hidden={{ groupId: group.id, studentId: m.student.id }}
                        confirmMessage={`${m.student.name} guruhdan chiqarilsinmi?`}
                      >
                        <button type="button" className={btn.dangerSmall}>
                          Chiqarish
                        </button>
                      </InlineActionForm>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>So'nggi darslar davomati</CardTitle>
          {lessonDates.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Davomat yozuvlari yo'q</p>
          ) : (
            <div className="space-y-3">
              {lessonDates.map((l) => (
                <div key={l.date} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm text-slate-600">{fmtDay(l.date)}</span>
                  <div className="flex-1">
                    <ProgressBar value={l.percent} barClassName="bg-emerald-500" />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs text-slate-500">
                    {l.present}/{l.total} —{" "}
                    <span className="font-semibold text-slate-200">{l.percent}%</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Guruh reytingi</CardTitle>
          {rating.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Reyting uchun o'quvchilar yo'q</p>
          ) : (
            <div className="space-y-3">
              {rating.map((r) => (
                <div key={r.studentId} className="flex items-center gap-3">
                  <span className="flex w-8 justify-center">
                    <RankMedal place={r.place} size="sm" showBadge />
                  </span>
                  <Avatar name={r.name} image={r.image} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/students/${r.studentId}`}
                      className="block truncate text-sm font-medium text-slate-100 hover:text-blue-400"
                    >
                      {r.name}
                    </Link>
                    <div className="text-xs text-slate-400">{r.level}-daraja</div>
                  </div>
                  <Badge className="bg-violet-500/15 text-violet-400">{fmtNumber(r.xp)} XP</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Uyga vazifalar</CardTitle>
          {group.homeworks.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Uyga vazifalar yo'q</p>
          ) : (
            <div className="divide-y divide-white/5">
              {group.homeworks.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-100">{h.title}</div>
                    <div className="text-xs text-slate-400">Muddat: {fmtDateTime(h.dueAt)}</div>
                  </div>
                  <Badge className="bg-blue-500/15 text-blue-400">
                    {h._count.submissions}/{group.students.length} topshirdi
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Imtihon natijalari</CardTitle>
          {group.exams.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Imtihonlar yo'q</p>
          ) : (
            <div className="divide-y divide-white/5">
              {group.exams.map((e) => {
                const graded = e.results.filter((r) => r.score !== null);
                const avg =
                  graded.length > 0
                    ? Math.round(graded.reduce((s, r) => s + (r.score ?? 0), 0) / graded.length)
                    : null;
                return (
                  <div key={e.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-100">{e.title}</div>
                      <div className="text-xs text-slate-400">
                        {fmtDate(e.endAt)} · {graded.length} ta tekshirilgan
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-400">
                      O'rtacha: {avg !== null ? `${avg} / ${e.maxScore}` : "—"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
