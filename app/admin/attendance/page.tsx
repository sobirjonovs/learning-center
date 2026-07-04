// Davomat nazorati — guruh va sana bo'yicha davomat belgilash
import { requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ATTENDANCE_STATUS, weekdayNameFor, type AttendanceStatus } from "@/lib/constants";
import { cn, parseJsonArray, pct, todayStr } from "@/lib/utils";
import {
  Avatar,
  Badge,
  Card,
  CardTitle,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
  btn,
  inputCls,
} from "@/components/ui";
import { SegmentBar, BarChart } from "@/components/charts";
import { setAttendance } from "./actions";

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "#10b981",
  LATE: "#f59e0b",
  ABSENT: "#f43f5e",
  EXCUSED: "#0ea5e9",
};

// Status tugmalari — tanlangan/tanlanmagan holatlar uchun statik klasslar
const STATUS_BTN: Record<AttendanceStatus, { on: string; off: string }> = {
  PRESENT: {
    on: "bg-emerald-600 text-white shadow-sm",
    off: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  },
  LATE: {
    on: "bg-amber-500 text-white shadow-sm",
    off: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  },
  ABSENT: {
    on: "bg-rose-600 text-white shadow-sm",
    off: "bg-rose-100 text-rose-700 hover:bg-rose-200",
  },
  EXCUSED: {
    on: "bg-sky-600 text-white shadow-sm",
    off: "bg-sky-100 text-sky-700 hover:bg-sky-200",
  },
};

const statusBtnBase = "rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-[0.97]";

const isPresent = (s: string) => s === "PRESENT" || s === "LATE";

/** "YYYY-MM-DD" -> "DD.MM" */
const fmtShort = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`;

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; date?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "attendance.manage");

  const sp = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : todayStr();

  const groups = await db.group.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, days: true, time: true },
  });

  const selectedGroup = groups.find((g) => g.id === sp.group) ?? groups[0];

  if (!selectedGroup) {
    return (
      <div>
        <PageHeader title="Davomat nazorati" subtitle="Guruh bo'yicha davomat belgilash" />
        <EmptyState icon="✅" title="Faol guruhlar yo'q" hint="Avval guruh yarating." />
      </div>
    );
  }

  const [members, dayRows, allRows] = await Promise.all([
    db.groupStudent.findMany({
      where: { groupId: selectedGroup.id },
      orderBy: { student: { name: "asc" } },
      include: {
        student: { select: { id: true, name: true, image: true, active: true } },
      },
    }),
    db.attendance.findMany({
      where: { groupId: selectedGroup.id, date },
      select: { studentId: true, status: true },
    }),
    db.attendance.findMany({
      where: { groupId: selectedGroup.id },
      select: { status: true, date: true },
    }),
  ]);

  const statusMap = new Map(dayRows.map((r) => [r.studentId, r.status as AttendanceStatus]));
  const statusKeys = Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[];

  // Tanlangan kun guruhning dars kuniga to'g'ri keladimi?
  const dateObj = new Date(`${date}T00:00:00`);
  const isLessonDay = parseJsonArray(selectedGroup.days).includes(weekdayNameFor(dateObj));

  // Umumiy statistika (barcha sanalar bo'yicha)
  const segments = statusKeys.map((key) => ({
    label: ATTENDANCE_STATUS[key].label,
    value: allRows.filter((r) => r.status === key).length,
    color: STATUS_COLORS[key],
  }));

  // Oxirgi 14 dars kunining kunlik davomat foizi
  const dailyData = Array.from(new Set(allRows.map((r) => r.date)))
    .sort()
    .slice(-14)
    .map((d) => {
      const rows = allRows.filter((r) => r.date === d);
      return {
        label: fmtShort(d),
        value: pct(rows.filter((r) => isPresent(r.status)).length, rows.length),
      };
    });

  return (
    <div>
      <PageHeader
        title="Davomat nazorati"
        subtitle={`${selectedGroup.name} · ${selectedGroup.time}`}
      />

      {/* Filtrlar */}
      <Card className="mb-4">
        <form action="/admin/attendance" className="flex flex-wrap items-end gap-3">
          <div className="min-w-56">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Guruh</label>
            <select name="group" defaultValue={selectedGroup.id} className={inputCls}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Sana</label>
            <input type="date" name="date" defaultValue={date} className={inputCls} />
          </div>
          <button type="submit" className={btn.primary}>
            Ko'rsatish
          </button>
        </form>
        {!isLessonDay && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            ⚠️ Tanlangan sana ({weekdayNameFor(dateObj)}) bu guruhning dars kunlariga kirmaydi:{" "}
            {parseJsonArray(selectedGroup.days).join(", ")}.
          </p>
        )}
      </Card>

      {/* Davomat jadvali */}
      {members.length === 0 ? (
        <EmptyState icon="🎓" title="Guruhda o'quvchilar yo'q" hint="Avval guruhga o'quvchi qo'shing." />
      ) : (
        <Table
          head={
            <>
              <Th>O'quvchi</Th>
              <Th>Joriy holat</Th>
              <Th>Belgilash</Th>
            </>
          }
        >
          {members.map((m) => {
            const current = statusMap.get(m.student.id);
            return (
              <tr key={m.id} className="hover:bg-slate-50/60">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={m.student.name} image={m.student.image} size="sm" />
                    <span className="font-medium text-slate-800">{m.student.name}</span>
                  </div>
                </Td>
                <Td>
                  {current ? (
                    <Badge className={ATTENDANCE_STATUS[current].badge}>
                      {ATTENDANCE_STATUS[current].label}
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-500">Belgilanmagan</Badge>
                  )}
                </Td>
                <Td>
                  <form action={setAttendance} className="flex flex-wrap gap-1.5">
                    <input type="hidden" name="groupId" value={selectedGroup.id} />
                    <input type="hidden" name="studentId" value={m.student.id} />
                    <input type="hidden" name="date" value={date} />
                    {statusKeys.map((key) => (
                      <button
                        key={key}
                        type="submit"
                        name="status"
                        value={key}
                        className={cn(
                          statusBtnBase,
                          current === key ? STATUS_BTN[key].on : STATUS_BTN[key].off
                        )}
                      >
                        {ATTENDANCE_STATUS[key].label}
                      </button>
                    ))}
                  </form>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* Statistika */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Umumiy statistika — {selectedGroup.name}</CardTitle>
          <SegmentBar segments={segments} />
        </Card>
        <Card>
          <CardTitle>Kunlik davomat (oxirgi 14 dars)</CardTitle>
          <BarChart data={dailyData} suffix="%" maxValue={100} color="#10b981" />
        </Card>
      </div>
    </div>
  );
}
