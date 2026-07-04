// Yangi quiz yaratish
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { QuizForm } from "../quiz-form";
import { createQuiz } from "../actions";

export default async function NewQuizPage() {
  const session = await requireRole("TEACHER");

  const groups = await db.group.findMany({
    where: { teacherId: session.id, active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yangi quiz"
        subtitle="Avval quiz haqida ma'lumot kiriting, keyin savollar qo'shasiz"
        backHref="/teacher/quizzes"
      />
      <Card>
        <QuizForm groups={groups} action={createQuiz} submitLabel="Yaratish va savollar qo'shish →" />
      </Card>
    </div>
  );
}
