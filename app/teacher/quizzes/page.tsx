// O'qituvchining quizlari ro'yxati
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { QUIZ_TYPES, type QuizType } from "@/lib/constants";
import { BarChart3, Pencil, Zap } from "lucide-react";
import { Badge, EmptyState, PageHeader, Table, Td, Th, btn } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteQuiz, startLiveGame } from "./actions";

export default async function TeacherQuizzesPage() {
  const session = await requireRole("TEACHER");

  const quizzes = await db.quiz.findMany({
    where: { teacherId: session.id },
    include: { group: { select: { name: true } }, _count: { select: { questions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" strokeWidth={1.75} fill="currentColor" />
            Quiz Battle
          </span>
        }
        subtitle="Jonli quizlar yaratish va o'tkazish"
        action={
          <Link href="/teacher/quizzes/new" className={btn.primary}>
            + Yangi quiz
          </Link>
        }
      />

      {quizzes.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="Hali quiz yaratilmagan"
          hint="Birinchi quizingizni yaratib, o'quvchilar bilan jonli bellashuv o'tkazing!"
          action={
            <Link href="/teacher/quizzes/new" className={btn.primary}>
              + Yangi quiz
            </Link>
          }
        />
      ) : (
        <Table
          head={
            <>
              <Th>Nomi</Th>
              <Th>Fan</Th>
              <Th>Turi</Th>
              <Th>Guruh</Th>
              <Th className="text-center">Savollar</Th>
              <Th>Yaratilgan</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {quizzes.map((q) => (
            <tr key={q.id} className="transition hover:bg-white/[0.04]">
              <Td>
                <div className="flex items-center gap-3">
                  {q.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={q.image}
                      alt={q.name}
                      className="h-10 w-10 rounded-xl border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                      <Zap className="h-5 w-5 text-indigo-600" strokeWidth={1.75} fill="currentColor" />
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/teacher/quizzes/${q.id}`}
                      className="font-semibold text-white hover:text-blue-400"
                    >
                      {q.name}
                    </Link>
                    {q.description && (
                      <div className="max-w-xs truncate text-xs text-slate-400">{q.description}</div>
                    )}
                  </div>
                </div>
              </Td>
              <Td>{q.subject ?? "—"}</Td>
              <Td>
                <Badge className="bg-violet-500/15 text-violet-400">
                  {QUIZ_TYPES[q.type as QuizType]?.label ?? q.type}
                </Badge>
              </Td>
              <Td>{q.group?.name ?? "—"}</Td>
              <Td className="text-center font-semibold">{q._count.questions}</Td>
              <Td className="text-slate-500">{fmtDate(q.createdAt)}</Td>
              <Td>
                <div className="flex items-center justify-end gap-1.5">
                  {q._count.questions > 0 && (
                    <form action={startLiveGame}>
                      <input type="hidden" name="quizId" value={q.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700"
                      >
                        ▶ O&apos;tkazish
                      </button>
                    </form>
                  )}
                  <Link href={`/teacher/quizzes/${q.id}/results`} className={`${btn.small} inline-flex items-center gap-1`}>
                    <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Natijalar
                  </Link>
                  <Link href={`/teacher/quizzes/${q.id}`} className={`${btn.small} inline-flex items-center gap-1`}>
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Tahrirlash
                  </Link>
                  <form action={deleteQuiz}>
                    <input type="hidden" name="id" value={q.id} />
                    <ConfirmButton
                      message={`"${q.name}" quizini o'chirishga ishonchingiz komilmi? Barcha savollar va natijalar ham o'chadi.`}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20"
                    >
                      🗑
                    </ConfirmButton>
                  </form>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
