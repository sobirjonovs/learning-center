// Quiz meta ma'lumotlarini tahrirlash
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { QuizForm } from "../../quiz-form";
import { updateQuiz } from "../../actions";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;

  const quiz = await db.quiz.findUnique({ where: { id } });
  if (!quiz || quiz.teacherId !== session.id) redirect("/teacher/quizzes");

  const groups = await db.group.findMany({
    where: { teacherId: session.id, active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Quizni tahrirlash"
        subtitle={quiz.name}
        backHref={`/teacher/quizzes/${quiz.id}`}
      />
      <Card>
        <QuizForm
          groups={groups}
          quiz={{
            id: quiz.id,
            name: quiz.name,
            description: quiz.description,
            subject: quiz.subject,
            image: quiz.image,
            groupId: quiz.groupId,
            type: quiz.type,
            timeLimit: quiz.timeLimit,
            countsToRating: quiz.countsToRating,
          }}
          action={updateQuiz}
          submitLabel="Saqlash"
        />
      </Card>
    </div>
  );
}
