// Davomat — belgilash paneli va statistika
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ATTENDANCE_STATUS, type AttendanceStatus } from "@/lib/constants";
import { cn, dateStr, fmtDate, pct, startOfMonth, startOfWeek, todayStr } from "@/lib/utils";
import { BarChart, SegmentBar } from "@/components/charts";
import {
  Avatar,
  Card,
  CardTitle,
  EmptyState,
  Field,
  LinkTabs,
  PageHeader,
  Table,
  Td,
  Th,
  btn,
  inputCls,
} from "@/components/ui";
import { markAttendance } from "./actions";

// SegmentBar uchun status ranglari
const ATT_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "#10b981",
  LATE: "#f59e0b",
  ABSENT: "#f43f5e",
  EXCUSED: "#0ea5e9",
};

const STATUS_KEYS = Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[];

type Counts = Record<AttendanceStatus, number> & { total: number };

function emptyCounts(): Counts {
  return { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0, total: 0 };
}

function countRows(rows: Array<{ status: string }>): Counts {
  const c = emptyCounts();
  for (const r of rows) {
    if (r.status in ATT_COLORS) {
      c[r.status as AttendanceStatus] += 1;
      c.total += 1;
    }
  }
  return c;
}

function segmentsFor(c: Counts) {
  return STATUS_KEYS.map((k) => ({
    label: ATTENDANCE_STATUS[k].label,
    value: c[k],
    color: ATT_COLORS[k],
  }));
}

function shortDate(d: string): string {
  return `${d.slice(8, 10)}.${d.slice(5, 7)}`;
}

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole("TEACHER");
  const sp = await searchParams;

  const groups = await db.group.findMany({
    where: { teacherId: session.id },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  if (groups.length === 0) {
    return (
      <div>
        <PageHeader title="Davomat" subtitle="Guruh davomatini belgilash va tahlil qilish" />
        <EmptyState icon="✅" title="Sizga hali guruh biriktirilmagan" />
      </div>
    );
  }

  const guruhParam = typeof sp.guruh === "string" ? sp.guruh : "";
  const group = groups.find((g) => g.id === guruhParam) ?? groups[0];

  const sana =
    typeof sp.sana === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.sana) ? sp.sana : todayStr();
  const davrParam = typeof sp.davr === "string" ? sp.davr : "";
  const davr = ["kunlik", "haftalik", "oylik"].includes(davrParam) ? davrParam : "kunlik";

  const [members, allAtt] = await Promise.all([
    db.groupStudent.findMany({
      where: { groupId: group.id },
      include: { student: { select: { id: true, name: true, image: true } } },
      orderBy: { student: { name: "asc" } },
    }),
    db.attendance.findMany({
      where: { groupId: group.id },
      select: { studentId: true, date: true, status: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const dayStatus = new Map(
    allAtt.filter((a) => a.date === sana).map((a) => [a.studentId, a.status])
  );

  // Sana bo'yicha guruhlangan yozuvlar
  const byDate = new Map<string, Array<{ status: string }>>();
  for (const a of allAtt) {
    const arr = byDate.get(a.date) ?? [];
    arr.push(a);
    byDate.set(a.date, arr);
  }

  const weekStart = dateStr(startOfWeek());
  const monthStart = dateStr(startOfMonth());
  const rangeStart = davr === "haftalik" ? weekStart : monthStart;
  const rangeDates = [...byDate.keys()].filter((d) => d >= rangeStart && d <= todayStr()).sort();
  const rangeChart = rangeDates.map((d) => {
    const c = countRows(byDate.get(d)!);
    return { label: shortDate(d), value: pct(c.PRESENT + c.LATE, c.total) };
  });
  const rangeCounts = countRows(rangeDates.flatMap((d) => byDate.get(d)!));
  const dayCounts = countRows(byDate.get(sana) ?? []);

  const historyDates = [...byDate.keys()].sort().reverse().slice(0, 10);

  const baseQs = `guruh=${group.id}&sana=${sana}`;
  const tabs = [
    { key: "kunlik", label: "Kunlik", href: `/teacher/attendance?${baseQs}&davr=kunlik` },
    { key: "haftalik", label: "Haftalik", href: `/teacher/attendance?${baseQs}&davr=haftalik` },
    { key: "oylik", label: "Oylik", href: `/teacher/attendance?${baseQs}&davr=oylik` },
  ];

  return (
    <div>
      <PageHeader title="Davomat" subtitle="Guruh davomatini belgilash va tahlil qilish" />

      <Card className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <Field label="Guruh" className="w-full sm:w-64">
            <select name="guruh" defaultValue={group.id} className={inputCls}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                  {g.active ? "" : " (faol emas)"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sana" className="w-full sm:w-48">
            <input type="date" name="sana" defaultValue={sana} className={inputCls} />
          </Field>
          <input type="hidden" name="davr" value={davr} />
          <button type="submit" className={btn.primary}>
            Ko'rsatish
          </button>
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>
            Davomat belgilash — {group.name}, {fmtDate(sana)}
          </CardTitle>
          {members.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Guruhda o'quvchilar yo'q
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((m) => {
                const current = dayStatus.get(m.student.id);
                return (
                  <form
                    key={m.student.id}
                    action={markAttendance}
                    className="flex flex-wrap items-center gap-3 py-3"
                  >
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="studentId" value={m.student.id} />
                    <input type="hidden" name="date" value={sana} />
                    <Avatar name={m.student.name} image={m.student.image} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                      {m.student.name}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_KEYS.map((key) => (
                        <button
                          key={key}
                          type="submit"
                          name="status"
                          value={key}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-[0.97]",
                            current === key
                              ? cn(ATTENDANCE_STATUS[key].badge, "ring-1 ring-inset ring-black/10")
                              : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {ATTENDANCE_STATUS[key].label}
                        </button>
                      ))}
                    </div>
                  </form>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Statistika — {group.name}</CardTitle>
          <LinkTabs tabs={tabs} current={davr} />
          {davr === "kunlik" ? (
            <div>
              <div className="mb-3 text-xs font-medium text-slate-500">
                {fmtDate(sana)} — davomat: {pct(dayCounts.PRESENT + dayCounts.LATE, dayCounts.total)}%
              </div>
              <SegmentBar segments={segmentsFor(dayCounts)} />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="mb-2 text-xs font-medium text-slate-500">
                  {davr === "haftalik" ? "Shu hafta" : "Shu oy"} — kunlik davomat foizi
                </div>
                <BarChart data={rangeChart} suffix="%" maxValue={100} height={190} />
              </div>
              <SegmentBar segments={segmentsFor(rangeCounts)} />
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          Davomat tarixi (so'nggi {historyDates.length} dars)
        </h3>
        {historyDates.length === 0 ? (
          <EmptyState icon="🗓️" title="Davomat yozuvlari hali yo'q" />
        ) : (
          <Table
            head={
              <>
                <Th>Sana</Th>
                <Th className="text-center">Keldi</Th>
                <Th className="text-center">Kechikdi</Th>
                <Th className="text-center">Kelmadi</Th>
                <Th className="text-center">Sababli</Th>
                <Th>Davomat</Th>
              </>
            }
          >
            {historyDates.map((d) => {
              const c = countRows(byDate.get(d)!);
              const percent = pct(c.PRESENT + c.LATE, c.total);
              return (
                <tr key={d} className="hover:bg-slate-50/60">
                  <Td className="font-medium text-slate-700">{fmtDate(d)}</Td>
                  <Td className="text-center font-semibold text-emerald-600">{c.PRESENT}</Td>
                  <Td className="text-center font-semibold text-amber-600">{c.LATE}</Td>
                  <Td className="text-center font-semibold text-rose-600">{c.ABSENT}</Td>
                  <Td className="text-center font-semibold text-sky-600">{c.EXCUSED}</Td>
                  <Td className="font-semibold text-slate-700">{percent}%</Td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>
    </div>
  );
}
