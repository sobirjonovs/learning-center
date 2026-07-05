// Quiz natijalari: o'tkazilgan sessiyalar (PIN) bo'yicha guruhlangan
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime, fmtNumber } from "@/lib/utils";
import { BarChart3, Flame } from "lucide-react";
import { Badge, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { RankMedal } from "@/components/rank-medal";

export default async function QuizResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;

  const quiz = await db.quiz.findUnique({ where: { id } });
  if (!quiz || quiz.teacherId !== session.id) redirect("/teacher/quizzes");

  const results = await db.quizResult.findMany({
    where: { quizId: id },
    include: { student: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  // PIN bo'yicha sessiyalarga guruhlash
  const sessions = new Map<string, typeof results>();
  for (const r of results) {
    const key = r.pin ?? "—";
    const list = sessions.get(key) ?? [];
    list.push(r);
    sessions.set(key, list);
  }
  const sessionList = [...sessions.entries()].map(([pin, rows]) => ({
    pin,
    rows: rows.slice().sort((a, b) => (a.place ?? 999) - (b.place ?? 999)),
    date: rows.reduce((min, r) => (r.createdAt < min ? r.createdAt : min), rows[0].createdAt),
  }));

  return (
    <div>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <BarChart3 className="h-5 w-5" strokeWidth={1.75} />
            Natijalar: {quiz.name}
          </span>
        }
        subtitle={`${sessionList.length} ta o'tkazilgan sessiya · ${results.length} ta natija`}
        backHref={`/teacher/quizzes/${quiz.id}`}
      />

      {sessionList.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Hali natijalar yo'q"
          hint="Quiz o'tkazilgach, o'quvchilar natijalari shu yerda ko'rinadi."
        />
      ) : (
        <div className="space-y-8">
          {sessionList.map((s) => (
            <div key={s.pin}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="bg-indigo-100 font-mono text-indigo-700">PIN: {s.pin}</Badge>
                <span className="text-sm text-slate-500">{fmtDateTime(s.date)}</span>
                <span className="text-xs text-slate-400">· {s.rows.length} ishtirokchi</span>
              </div>
              <Table
                head={
                  <>
                    <Th className="w-16">O&apos;rin</Th>
                    <Th>O&apos;quvchi</Th>
                    <Th className="text-right">Ball</Th>
                    <Th className="text-center">To&apos;g&apos;ri / Noto&apos;g&apos;ri</Th>
                    <Th className="text-center">
                      <span className="inline-flex items-center justify-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.75} />
                        Streak
                      </span>
                    </Th>
                    <Th className="text-right">XP / Bonus</Th>
                    <Th>Sana</Th>
                  </>
                }
              >
                {s.rows.map((r) => (
                  <tr key={r.id} className="transition hover:bg-white/[0.04]">
                    <Td>
                      {r.place ? (
                        <RankMedal place={r.place} size="sm" showBadge />
                      ) : (
                        <span className="text-sm font-semibold text-slate-500">—</span>
                      )}
                    </Td>
                    <Td className="font-semibold text-white">{r.student.name}</Td>
                    <Td className="text-right font-bold text-blue-400">
                      {fmtNumber(r.score)}
                    </Td>
                    <Td className="text-center">
                      <span className="font-semibold text-emerald-600">{r.correctCount}</span>
                      <span className="text-slate-300"> / </span>
                      <span className="font-semibold text-rose-500">{r.wrongCount}</span>
                    </Td>
                    <Td className="text-center font-semibold text-amber-600">{r.bestStreak}</Td>
                    <Td className="text-right text-slate-600">
                      +{fmtNumber(r.xpEarned)} XP{" "}
                      <span className="text-slate-300">·</span> +{fmtNumber(r.pointsEarned)} ball
                    </Td>
                    <Td className="text-slate-500">{fmtDateTime(r.createdAt)}</Td>
                  </tr>
                ))}
              </Table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
