// Quiz konstruktori: meta ma'lumot + savollar boshqaruvi
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, fmtDate, parseJsonArray } from "@/lib/utils";
import { ANSWER_SHAPES, QUIZ_TYPES, type QuizType } from "@/lib/constants";
import { HelpCircle, Pencil, Target } from "lucide-react";
import { Badge, Card, CardTitle, EmptyState, PageHeader, btn } from "@/components/ui";
import { Modal } from "@/components/modal";
import { ConfirmButton } from "@/components/confirm-button";
import { StartLiveGameButton } from "@/components/start-live-game-button";
import { QuestionForm } from "./question-form";
import {
  addQuestion,
  deleteQuestion,
  moveQuestion,
  updateQuestion,
} from "../actions";

export default async function QuizBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;
  const { error } = await searchParams;

  const quiz = await db.quiz.findUnique({
    where: { id },
    include: {
      group: { select: { name: true } },
      questions: { orderBy: { order: "asc" } },
    },
  });
  if (!quiz || quiz.teacherId !== session.id) redirect("/teacher/quizzes");

  const canStart = quiz.questions.length > 0;

  return (
    <div>
      <PageHeader
        title={quiz.name}
        subtitle={`${quiz.questions.length} ta savol · ${fmtDate(quiz.createdAt)}`}
        backHref="/teacher/quizzes"
        action={
          <>
            <Link href={`/teacher/quizzes/${quiz.id}/preview`} className={btn.secondary}>
              👁 Preview
            </Link>
            <StartLiveGameButton quizId={quiz.id} className={btn.primary} disabled={!canStart}>
              ▶ Quizni boshlash
            </StartLiveGameButton>
          </>
        }
      />

      {error === "no-questions" && (
        <div className="mb-4 animate-shake rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          O&apos;yinni boshlash uchun kamida bitta savol qo&apos;shing.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Meta ma'lumot */}
        <div className="space-y-5">
          <Card>
            <CardTitle
              action={
                <Link href={`/teacher/quizzes/${quiz.id}/edit`} className={`${btn.small} inline-flex items-center gap-1`}>
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Tahrirlash
                </Link>
              }
            >
              Quiz ma&apos;lumotlari
            </CardTitle>
            {quiz.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={quiz.image}
                alt={quiz.name}
                className="mb-3 h-36 w-full rounded-xl border border-white/10 object-cover"
              />
            )}
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Turi</dt>
                <dd>
                  <Badge className="bg-violet-500/15 text-violet-400">
                    {QUIZ_TYPES[quiz.type as QuizType]?.label ?? quiz.type}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Fan</dt>
                <dd className="font-medium text-slate-200">{quiz.subject ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Guruh</dt>
                <dd className="font-medium text-slate-200">{quiz.group?.name ?? "Guruhsiz"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Vaqt chegarasi</dt>
                <dd className="font-medium text-slate-200">
                  {quiz.timeLimit ? `${quiz.timeLimit} daqiqa` : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Reytingga</dt>
                <dd>
                  {quiz.countsToRating ? (
                    <Badge className="bg-emerald-500/15 text-emerald-400">✓ Qo&apos;shiladi</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-500">Qo&apos;shilmaydi</Badge>
                  )}
                </dd>
              </div>
            </dl>
            {quiz.description && (
              <p className="mt-3 border-t border-white/10 pt-3 text-sm text-slate-500">
                {quiz.description}
              </p>
            )}
          </Card>

          <Card>
            <CardTitle>Savol qo&apos;shish</CardTitle>
            <QuestionForm quizId={quiz.id} action={addQuestion} submitLabel="+ Savol qo'shish" />
          </Card>
        </div>

        {/* Savollar ro'yxati */}
        <div className="lg:col-span-2">
          {quiz.questions.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="Hali savollar yo'q"
              hint="Chapdagi forma orqali birinchi savolni qo'shing. O'yinni boshlash uchun kamida bitta savol kerak."
            />
          ) : (
            <div className="space-y-3">
              {quiz.questions.map((q, idx) => {
                const options = parseJsonArray<string>(q.options);
                return (
                  <Card key={q.id} className="animate-fade-in">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-white">{q.text}</div>
                          <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-400">
                            <span>⏱ {q.timeSeconds} soniya</span>
                            <span className="inline-flex items-center gap-1">
                              <Target className="h-3 w-3" strokeWidth={1.75} />
                              {q.points} ball
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <form action={moveQuestion}>
                          <input type="hidden" name="questionId" value={q.id} />
                          <input type="hidden" name="dir" value="up" />
                          <button
                            type="submit"
                            disabled={idx === 0}
                            className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/10 hover:text-slate-700 disabled:opacity-30"
                            title="Yuqoriga"
                          >
                            ↑
                          </button>
                        </form>
                        <form action={moveQuestion}>
                          <input type="hidden" name="questionId" value={q.id} />
                          <input type="hidden" name="dir" value="down" />
                          <button
                            type="submit"
                            disabled={idx === quiz.questions.length - 1}
                            className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/10 hover:text-slate-700 disabled:opacity-30"
                            title="Pastga"
                          >
                            ↓
                          </button>
                        </form>
                        <Modal
                          trigger={
                            <button className={`${btn.small} inline-flex items-center justify-center`}>
                              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                          }
                          title={`${idx + 1}-savolni tahrirlash`}
                        >
                          <QuestionForm
                            quizId={quiz.id}
                            question={{
                              id: q.id,
                              text: q.text,
                              image: q.image,
                              options,
                              correctIndex: q.correctIndex,
                              timeSeconds: q.timeSeconds,
                              points: q.points,
                            }}
                            action={updateQuestion}
                            submitLabel="Saqlash"
                          />
                        </Modal>
                        <form action={deleteQuestion}>
                          <input type="hidden" name="questionId" value={q.id} />
                          <ConfirmButton
                            message="Bu savolni o'chirishga ishonchingiz komilmi?"
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20"
                          >
                            🗑
                          </ConfirmButton>
                        </form>
                      </div>
                    </div>

                    {q.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={q.image}
                        alt=""
                        className="mt-3 max-h-40 rounded-xl border border-white/10 object-contain"
                      />
                    )}

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {options.map((opt, i) => {
                        const s = ANSWER_SHAPES[i];
                        const isCorrect = i === q.correctIndex;
                        return (
                          <div
                            key={i}
                            className={cn(
                              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                              isCorrect
                                ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-800"
                                : "border-white/10 bg-white/5 text-slate-600"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-black text-white",
                                s.bg
                              )}
                            >
                              {s.shape}
                            </span>
                            <span className="min-w-0 truncate">{opt}</span>
                            {isCorrect && <span className="ml-auto shrink-0">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
