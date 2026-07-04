// O'quvchilar reytingi (o'qituvchi guruhlari bo'yicha)
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, fmtNumber, startOfMonth, startOfWeek } from "@/lib/utils";
import { getRating } from "@/lib/gamification";
import {
  Avatar,
  Badge,
  Card,
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

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function TeacherRatingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole("TEACHER");
  const sp = await searchParams;

  const groups = await db.group.findMany({
    where: { teacherId: session.id },
    orderBy: { name: "asc" },
  });

  const guruhParam = typeof sp.guruh === "string" ? sp.guruh : "";
  const selectedGroup = groups.find((g) => g.id === guruhParam);

  const davrParam = typeof sp.davr === "string" ? sp.davr : "";
  const davr = ["haftalik", "oylik", "umumiy"].includes(davrParam) ? davrParam : "haftalik";
  const since =
    davr === "haftalik" ? startOfWeek() : davr === "oylik" ? startOfMonth() : undefined;

  const memberRows = await db.groupStudent.findMany({
    where: selectedGroup
      ? { groupId: selectedGroup.id }
      : { groupId: { in: groups.map((g) => g.id) } },
    select: { studentId: true },
  });
  const studentIds = [...new Set(memberRows.map((r) => r.studentId))];
  const rating = await getRating(studentIds, since);

  const guruhQs = selectedGroup ? `&guruh=${selectedGroup.id}` : "";
  const tabs = [
    { key: "haftalik", label: "Haftalik", href: `/teacher/rating?davr=haftalik${guruhQs}` },
    { key: "oylik", label: "Oylik", href: `/teacher/rating?davr=oylik${guruhQs}` },
    { key: "umumiy", label: "Umumiy", href: `/teacher/rating?davr=umumiy${guruhQs}` },
  ];

  return (
    <div>
      <PageHeader title="O'quvchilar reytingi" subtitle="Guruhlaringiz bo'yicha faollik reytingi" />

      {groups.length === 0 ? (
        <EmptyState icon="🏆" title="Sizga hali guruh biriktirilmagan" />
      ) : (
        <>
          <Card className="mb-6">
            <form method="get" className="flex flex-wrap items-end gap-3">
              <Field label="Guruh" className="w-full sm:w-64">
                <select name="guruh" defaultValue={selectedGroup?.id ?? ""} className={inputCls}>
                  <option value="">Barcha guruhlarim</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </Field>
              <input type="hidden" name="davr" value={davr} />
              <button type="submit" className={btn.secondary}>
                Ko'rsatish
              </button>
            </form>
          </Card>

          <LinkTabs tabs={tabs} current={davr} />

          {rating.length === 0 ? (
            <EmptyState icon="🏆" title="Reyting uchun ma'lumot yo'q" />
          ) : (
            <>
              <Table
                head={
                  <>
                    <Th className="w-16 text-center">O'rin</Th>
                    <Th>O'quvchi</Th>
                    <Th className="text-center">Level</Th>
                    <Th className="text-right">XP</Th>
                    <Th className="text-right">Ball</Th>
                  </>
                }
              >
                {rating.map((r) => (
                  <tr
                    key={r.studentId}
                    className={cn(
                      "hover:bg-slate-50/60",
                      r.place === 1 && "bg-amber-50/70",
                      r.place === 2 && "bg-slate-50/80",
                      r.place === 3 && "bg-orange-50/60"
                    )}
                  >
                    <Td className="text-center text-base font-bold text-slate-500">
                      {r.place <= 3 ? MEDALS[r.place - 1] : r.place}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} image={r.image} size="sm" />
                        <span className="font-medium text-slate-700">{r.name}</span>
                      </div>
                    </Td>
                    <Td className="text-center">
                      <Badge className="bg-violet-100 text-violet-700">Lv {r.level}</Badge>
                    </Td>
                    <Td className="text-right font-semibold text-indigo-600">
                      {fmtNumber(r.xp)}
                    </Td>
                    <Td className="text-right font-semibold text-amber-600">
                      {fmtNumber(r.points)}
                    </Td>
                  </tr>
                ))}
              </Table>
              <p className="mt-3 text-xs text-slate-400">
                Reyting uyga vazifa, imtihon, davomat, quiz, faollik va bonus ballari asosida
                shakllanadi.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
