// Imtihonni tahrirlash
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { ExamForm } from "../../exam-form";
import { updateExam } from "../../actions";

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("TEACHER");
  const { id } = await params;

  const exam = await db.exam.findUnique({
    where: { id },
    include: { group: true },
  });
  if (!exam || exam.group.teacherId !== session.id) redirect("/teacher/exams");

  const groups = await db.group.findMany({
    where: { teacherId: session.id },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Imtihonni tahrirlash" subtitle={exam.title} backHref={`/teacher/exams/${exam.id}`} />
      <Card>
        <ExamForm groups={groups} exam={exam} action={updateExam} submitLabel="Saqlash" />
      </Card>
    </div>
  );
}
