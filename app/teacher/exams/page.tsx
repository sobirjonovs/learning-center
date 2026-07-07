// Imtihonlar ro'yxati (o'qituvchi)
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/utils";
import { InlineActionForm } from "@/components/inline-action-form";
import { ClipboardList } from "lucide-react";
import {
  Badge,
  EmptyState,
  Field,
  PageHeader,
  Table,
  Td,
  Th,
  btn,
  inputCls,
} from "@/components/ui";
import { deleteExam } from "./actions";

export default async function TeacherExamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole("TEACHER");
  const sp = await searchParams;

  const groups = await db.group.findMany({
    where: { teacherId: session.id },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { students: true } } },
  });
  const guruhParam = typeof sp.guruh === "string" ? sp.guruh : "";
  const selectedGroup = groups.find((g) => g.id === guruhParam);

  const exams = await db.exam.findMany({
    where: {
      group: { teacherId: session.id },
      ...(selectedGroup ? { groupId: selectedGroup.id } : {}),
    },
    orderBy: { endAt: "desc" },
    include: { group: { select: { id: true, name: true } } },
  });

  const resultStats = await db.examResult.groupBy({
    by: ["examId", "status"],
    where: { exam: { group: { teacherId: session.id } } },
    _count: { _all: true },
  });
  const examStats = new Map<string, { submitted: number; ungraded: number }>();
  for (const row of resultStats) {
    const cur = examStats.get(row.examId) ?? { submitted: 0, ungraded: 0 };
    cur.submitted += row._count._all;
    if (row.status === "SUBMITTED") cur.ungraded += row._count._all;
    examStats.set(row.examId, cur);
  }
  const studentCount = new Map(groups.map((g) => [g.id, g._count.students]));

  return (
    <div>
      <PageHeader
        title="Imtihonlar"
        subtitle="Imtihonlar yaratish, topshiriqlarni tekshirish va baholash"
        action={
          <Link href="/teacher/exams/new" className={btn.primary}>
            + Yangi imtihon
          </Link>
        }
      />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <Field label="Guruh" className="w-full sm:w-64">
          <select name="guruh" defaultValue={selectedGroup?.id ?? ""} className={inputCls}>
            <option value="">Barcha guruhlar</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
        <button type="submit" className={btn.secondary}>
          Filtrlash
        </button>
      </form>

      {exams.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Imtihonlar hali yaratilmagan"
          hint="Yangi imtihon yaratish uchun yuqoridagi tugmani bosing."
          action={
            <Link href="/teacher/exams/new" className={btn.primary}>
              + Yangi imtihon
            </Link>
          }
        />
      ) : (
        <Table
          head={
            <>
              <Th>Imtihon</Th>
              <Th>Guruh</Th>
              <Th>Boshlanish</Th>
              <Th>Tugash</Th>
              <Th className="text-center">Ball oralig'i</Th>
              <Th className="text-center">Topshirdi</Th>
              <Th className="text-center">Tekshirilmagan</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {exams.map((exam) => {
            const st = examStats.get(exam.id) ?? { submitted: 0, ungraded: 0 };
            const total = studentCount.get(exam.groupId) ?? 0;
            return (
              <tr key={exam.id} className="hover:bg-white/[0.04]">
                <Td>
                  <Link
                    href={`/teacher/exams/${exam.id}`}
                    className="font-medium text-slate-200 hover:text-blue-400"
                  >
                    {exam.title}
                  </Link>
                </Td>
                <Td className="text-slate-500">{exam.group.name}</Td>
                <Td className="text-slate-500">{fmtDateTime(exam.startAt)}</Td>
                <Td className="text-slate-500">{fmtDateTime(exam.endAt)}</Td>
                <Td className="text-center font-semibold text-slate-200">
                  {exam.minScore}–{exam.maxScore}
                </Td>
                <Td className="text-center text-slate-600">
                  {st.submitted}/{total}
                </Td>
                <Td className="text-center">
                  {st.ungraded > 0 ? (
                    <Badge className="bg-amber-500/15 text-amber-400">{st.ungraded}</Badge>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/teacher/exams/${exam.id}`} className={btn.small}>
                      Tekshirish
                    </Link>
                    <Link href={`/teacher/exams/${exam.id}/edit`} className={btn.small}>
                      Tahrirlash
                    </Link>
                    <InlineActionForm
                      action={deleteExam}
                      hidden={{ id: exam.id }}
                      confirmMessage={`"${exam.title}" imtihonini o'chirmoqchimisiz? Barcha topshiriqlar ham o'chadi.`}
                    >
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20"
                      >
                        O&apos;chirish
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
  );
}
