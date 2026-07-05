// Uyga vazifalar ro'yxati (o'qituvchi)
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/utils";
import { ConfirmButton } from "@/components/confirm-button";
import { BookOpen } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Table,
  Td,
  Th,
  btn,
  inputCls,
} from "@/components/ui";
import { deleteHomework } from "./actions";

export default async function TeacherHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole("TEACHER");
  const sp = await searchParams;

  const groups = await db.group.findMany({
    where: { teacherId: session.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  });
  const guruhParam = typeof sp.guruh === "string" ? sp.guruh : "";
  const selectedGroup = groups.find((g) => g.id === guruhParam);

  const homeworks = await db.homework.findMany({
    where: {
      group: { teacherId: session.id },
      ...(selectedGroup ? { groupId: selectedGroup.id } : {}),
    },
    orderBy: { dueAt: "desc" },
    include: { group: { select: { id: true, name: true } } },
  });

  const subStats = await db.submission.groupBy({
    by: ["homeworkId", "status"],
    where: { homework: { group: { teacherId: session.id } } },
    _count: { _all: true },
  });
  const hwStats = new Map<string, { submitted: number; ungraded: number }>();
  for (const row of subStats) {
    const cur = hwStats.get(row.homeworkId) ?? { submitted: 0, ungraded: 0 };
    cur.submitted += row._count._all;
    if (row.status === "SUBMITTED") cur.ungraded += row._count._all;
    hwStats.set(row.homeworkId, cur);
  }
  const studentCount = new Map(groups.map((g) => [g.id, g._count.students]));

  return (
    <div>
      <PageHeader
        title="Uyga vazifalar"
        subtitle="Vazifalarni yaratish, tahrirlash va tekshirish"
        action={
          <Link href="/teacher/homework/new" className={btn.primary}>
            + Yangi vazifa
          </Link>
        }
      />

      <Card className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
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
      </Card>

      {homeworks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Vazifalar topilmadi"
          hint="Yangi vazifa yaratish uchun yuqoridagi tugmani bosing."
          action={
            <Link href="/teacher/homework/new" className={btn.primary}>
              + Yangi vazifa
            </Link>
          }
        />
      ) : (
        <Table
          head={
            <>
              <Th>Sarlavha</Th>
              <Th>Guruh</Th>
              <Th>Boshlanish</Th>
              <Th>Muddat</Th>
              <Th className="text-center">Maks. ball</Th>
              <Th className="text-center">Topshirdi</Th>
              <Th className="text-center">Tekshirilmagan</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {homeworks.map((hw) => {
            const st = hwStats.get(hw.id) ?? { submitted: 0, ungraded: 0 };
            const total = studentCount.get(hw.groupId) ?? 0;
            return (
              <tr key={hw.id} className="hover:bg-white/[0.04]">
                <Td>
                  <Link
                    href={`/teacher/homework/${hw.id}`}
                    className="font-medium text-slate-200 hover:text-blue-400"
                  >
                    {hw.title}
                  </Link>
                </Td>
                <Td className="text-slate-500">{hw.group.name}</Td>
                <Td className="text-slate-500">{fmtDateTime(hw.startAt)}</Td>
                <Td className="text-slate-500">{fmtDateTime(hw.dueAt)}</Td>
                <Td className="text-center font-semibold text-slate-200">{hw.maxScore}</Td>
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
                    <Link href={`/teacher/homework/${hw.id}`} className={btn.small}>
                      Tekshirish
                    </Link>
                    <Link href={`/teacher/homework/${hw.id}/edit`} className={btn.small}>
                      Tahrirlash
                    </Link>
                    <form action={deleteHomework}>
                      <input type="hidden" name="id" value={hw.id} />
                      <ConfirmButton
                        message={`"${hw.title}" vazifasini o'chirmoqchimisiz? Barcha topshiriqlar ham o'chadi.`}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20"
                      >
                        O'chirish
                      </ConfirmButton>
                    </form>
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
