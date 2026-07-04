// Kelmagan o'quvchilar — qo'ng'iroqlar nazorati
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { todayStr, fmtDate, fmtDateTime } from "@/lib/utils";
import { CALL_STATUS, type CallStatus } from "@/lib/constants";
import {
  PageHeader,
  StatCard,
  Table,
  Th,
  Td,
  Badge,
  Avatar,
  Field,
  EmptyState,
  inputCls,
  btn,
} from "@/components/ui";
import { Modal } from "@/components/modal";
import { DateFilter } from "./date-filter";
import { addCallLog } from "./actions";

export default async function AbsentPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "calls.manage");

  const { date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr();
  const isToday = date === todayStr();

  const absents = await db.attendance.findMany({
    where: { date, status: "ABSENT" },
    include: {
      student: true,
      group: { include: { teacher: { select: { name: true } } } },
    },
    orderBy: [{ group: { name: "asc" } }, { student: { name: "asc" } }],
  });

  const studentIds = [...new Set(absents.map((a) => a.studentId))];
  const callLogs = studentIds.length
    ? await db.callLog.findMany({
        where: { date, studentId: { in: studentIds } },
        include: { calledBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const logsByStudent = new Map<string, typeof callLogs>();
  for (const log of callLogs) {
    const list = logsByStudent.get(log.studentId) ?? [];
    list.push(log);
    logsByStudent.set(log.studentId, list);
  }

  const latestStatus = (studentId: string): CallStatus => {
    const latest = logsByStudent.get(studentId)?.[0];
    return latest && latest.status in CALL_STATUS ? (latest.status as CallStatus) : "NOT_CALLED";
  };

  const talkedCount = studentIds.filter((id) => latestStatus(id) === "TALKED").length;
  const notCalledCount = studentIds.filter((id) => latestStatus(id) === "NOT_CALLED").length;

  return (
    <div>
      <PageHeader
        title="Kelmagan o'quvchilar"
        subtitle={`${fmtDate(date)} kungi davomat bo'yicha qo'ng'iroqlar nazorati`}
        action={<DateFilter date={date} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label={isToday ? "Bugun kelmaganlar" : "Kelmaganlar"}
          value={absents.length}
          icon="🙅"
          tone="rose"
        />
        <StatCard label="Gaplashildi" value={talkedCount} icon="✅" tone="emerald" />
        <StatCard label="Qo'ng'iroq qilinmadi" value={notCalledCount} icon="📞" tone="amber" />
      </div>

      {absents.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="Bu kunda kelmagan o'quvchilar yo'q"
          hint="Boshqa sanani tanlab ko'rishingiz mumkin."
        />
      ) : (
        <Table
          head={
            <>
              <Th>O'quvchi</Th>
              <Th>Guruh</Th>
              <Th>O'qituvchi</Th>
              <Th>Dars vaqti</Th>
              <Th>O'quvchi tel.</Th>
              <Th>Ota-ona tel.</Th>
              <Th>Qo'ng'iroq holati</Th>
              <Th>Izoh</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {absents.map((a) => {
            const logs = logsByStudent.get(a.studentId) ?? [];
            const latest = logs[0];
            const st = CALL_STATUS[latestStatus(a.studentId)];
            return (
              <tr key={a.id} className="hover:bg-slate-50/60">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={a.student.name} image={a.student.image} size="sm" />
                    <div className="font-medium text-slate-800">{a.student.name}</div>
                  </div>
                </Td>
                <Td className="text-slate-700">{a.group.name}</Td>
                <Td className="text-slate-600">{a.group.teacher?.name ?? "—"}</Td>
                <Td className="whitespace-nowrap text-slate-600">{a.group.time}</Td>
                <Td className="whitespace-nowrap text-slate-600">{a.student.phone || "—"}</Td>
                <Td className="whitespace-nowrap text-slate-600">{a.student.parentPhone || "—"}</Td>
                <Td>
                  <Badge className={st.badge}>{st.label}</Badge>
                </Td>
                <Td className="max-w-[200px]">
                  <span className="line-clamp-2 text-slate-500">{latest?.note || "—"}</span>
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <Modal
                      title={`Qo'ng'iroq holati — ${a.student.name}`}
                      trigger={
                        <button className="inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50">
                          Yangilash
                        </button>
                      }
                    >
                      <form action={addCallLog} className="space-y-4">
                        <input type="hidden" name="studentId" value={a.studentId} />
                        <input type="hidden" name="groupId" value={a.groupId} />
                        <input type="hidden" name="date" value={date} />
                        <Field label="Holat" required>
                          <select
                            name="status"
                            defaultValue={latest?.status ?? "TALKED"}
                            className={inputCls}
                          >
                            {(Object.keys(CALL_STATUS) as CallStatus[]).map((k) => (
                              <option key={k} value={k}>
                                {CALL_STATUS[k].label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Izoh">
                          <textarea
                            name="note"
                            rows={3}
                            placeholder="Masalan: Ota-onasi bilan gaplashildi, ertaga keladi"
                            className={inputCls}
                          />
                        </Field>
                        <div className="flex justify-end">
                          <button type="submit" className={btn.primary}>
                            Saqlash
                          </button>
                        </div>
                      </form>
                    </Modal>
                    <Modal
                      title={`Qo'ng'iroqlar tarixi — ${a.student.name}`}
                      trigger={<button className={btn.small}>Tarix</button>}
                    >
                      {logs.length === 0 ? (
                        <p className="py-4 text-center text-sm text-slate-400">
                          Bu kun uchun qo&apos;ng&apos;iroq yozuvlari yo&apos;q.
                        </p>
                      ) : (
                        <div className="max-h-96 space-y-3 overflow-y-auto">
                          {logs.map((log) => {
                            const ls =
                              CALL_STATUS[log.status as CallStatus] ?? CALL_STATUS.NOT_CALLED;
                            return (
                              <div
                                key={log.id}
                                className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <Badge className={ls.badge}>{ls.label}</Badge>
                                  <span className="text-xs text-slate-400">
                                    {fmtDateTime(log.createdAt)}
                                  </span>
                                </div>
                                {log.note && (
                                  <p className="mt-2 text-sm text-slate-600">{log.note}</p>
                                )}
                                <p className="mt-1.5 text-xs text-slate-400">
                                  Qo&apos;ng&apos;iroq qildi: {log.calledBy?.name ?? "—"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Modal>
                  </div>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
