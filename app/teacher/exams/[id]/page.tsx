// Imtihon natijalarini kiritish
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, pct } from "@/lib/utils";
import { BadgeCheck, BarChart3, Receipt, Rocket, Users } from "lucide-react";
import {
  Avatar,
  Card,
  EmptyState,
  PageHeader,
  StatCard,
  btn,
  inputCls,
} from "@/components/ui";
import { saveExamResults } from "../actions";

export default async function ExamResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;

  const exam = await db.exam.findUnique({
    where: { id },
    include: {
      group: {
        include: {
          students: {
            include: { student: { select: { id: true, name: true, image: true } } },
            orderBy: { student: { name: "asc" } },
          },
        },
      },
      results: true,
    },
  });
  if (!exam || exam.group.teacherId !== session.id) redirect("/teacher/exams");

  const scoreByStudent = new Map(exam.results.map((r) => [r.studentId, r.score]));
  const scores = exam.results.map((r) => r.score);
  const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
  const max = scores.length > 0 ? Math.max(...scores) : null;
  const perfectCount = scores.filter((s) => s >= exam.maxScore).length;

  return (
    <div>
      <PageHeader
        title={exam.title}
        subtitle={`${exam.group.name} · ${fmtDate(exam.date)} · Maksimal ball: ${exam.maxScore}`}
        backHref="/teacher/exams"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="O'rtacha ball"
          value={avg !== null ? avg : "—"}
          icon={BarChart3}
          tone="indigo"
          hint={avg !== null ? `${pct(avg, exam.maxScore)}%` : undefined}
        />
        <StatCard label="Eng yuqori ball" value={max !== null ? max : "—"} icon={Rocket} tone="emerald" />
        <StatCard label="100% olganlar" value={perfectCount} icon={BadgeCheck} tone="violet" />
        <StatCard
          label="Natijalar"
          value={`${exam.results.length}/${exam.group.students.length}`}
          icon={Receipt}
          tone="sky"
        />
      </div>

      {exam.group.students.length === 0 ? (
        <EmptyState icon={Users} title="Guruhda o'quvchilar yo'q" />
      ) : (
        <Card>
          <form action={saveExamResults}>
            <input type="hidden" name="examId" value={exam.id} />
            <div className="divide-y divide-white/5">
              {exam.group.students.map((m) => (
                <div key={m.student.id} className="flex items-center gap-3 py-3">
                  <Avatar name={m.student.name} image={m.student.image} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                    {m.student.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name={`score_${m.student.id}`}
                      min={0}
                      max={exam.maxScore}
                      defaultValue={scoreByStudent.get(m.student.id) ?? ""}
                      placeholder="—"
                      className={`${inputCls} w-24 text-center`}
                    />
                    <span className="text-xs text-slate-400">/ {exam.maxScore}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Bo'sh qoldirilgan katak — natija kiritilmagan deb hisoblanadi (mavjud natija o'chiriladi
              va berilgan ballar qaytarib olinadi).
            </p>
            <div className="mt-4">
              <button type="submit" className={btn.primary}>
                Saqlash
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
