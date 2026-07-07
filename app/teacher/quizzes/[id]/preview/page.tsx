// Preview: savollar katta taqdimot kartalari ko'rinishida
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, parseJsonArray } from "@/lib/utils";
import { ANSWER_SHAPES } from "@/lib/constants";
import { Target } from "lucide-react";
import { PageHeader, btn } from "@/components/ui";
import { StartLiveGameButton } from "@/components/start-live-game-button";

export default async function QuizPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;

  const quiz = await db.quiz.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz || quiz.teacherId !== session.id) redirect("/teacher/quizzes");

  return (
    <div>
      <PageHeader
        title={`👁 Preview: ${quiz.name}`}
        subtitle="Savollar o'yin ekranida qanday ko'rinishini tekshiring"
        backHref={`/teacher/quizzes/${quiz.id}`}
        action={
          quiz.questions.length > 0 ? (
            <StartLiveGameButton quizId={quiz.id} className={btn.primary}>
              ▶ Quizni boshlash
            </StartLiveGameButton>
          ) : undefined
        }
      />

      {quiz.questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-14 text-center text-sm text-slate-500">
          Hali savollar yo&apos;q.{" "}
          <Link href={`/teacher/quizzes/${quiz.id}`} className="font-semibold text-blue-400">
            Savol qo&apos;shish →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {quiz.questions.map((q, idx) => {
            const options = parseJsonArray<string>(q.options);
            return (
              <div
                key={q.id}
                className="animate-slide-up overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-900 p-6 shadow-xl md:p-10"
                style={{ animationDelay: `${Math.min(idx * 80, 400)}ms` }}
              >
                <div className="mb-6 flex items-center justify-between text-sm font-semibold text-indigo-300">
                  <span>
                    Savol {idx + 1} / {quiz.questions.length}
                  </span>
                  <span className="flex items-center gap-3">
                    <span>⏱ {q.timeSeconds} s</span>
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {q.points} ball
                    </span>
                    {q.penaltyOnWrong && <span className="text-amber-300">− jarima</span>}
                  </span>
                </div>

                <h2 className="text-center text-2xl font-bold text-white md:text-4xl">
                  {q.text}
                </h2>

                {q.image && (
                  <div className="mt-5 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={q.image}
                      alt=""
                      className="max-h-56 rounded-2xl object-contain"
                    />
                  </div>
                )}

                <div className="mt-8 grid gap-3 sm:grid-cols-2 md:gap-4">
                  {options.map((opt, i) => {
                    const s = ANSWER_SHAPES[i];
                    const isCorrect = i === q.correctIndex;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-4 rounded-2xl p-5 text-white shadow-lg md:p-6",
                          s.bg,
                          isCorrect && "ring-4 ring-white/90"
                        )}
                      >
                        <span className="text-3xl font-black drop-shadow">{s.shape}</span>
                        <span className="min-w-0 flex-1 text-lg font-semibold md:text-2xl">
                          {opt}
                        </span>
                        {isCorrect && <span className="shrink-0 text-2xl">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
