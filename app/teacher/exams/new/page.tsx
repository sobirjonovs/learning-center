// Yangi imtihon yaratish
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { ExamForm } from "../exam-form";
import { createExam } from "../actions";

export default async function NewExamPage() {
  const session = await requireRole("TEACHER");

  const groups = await db.group.findMany({
    where: { teacherId: session.id },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yangi imtihon"
        subtitle="Guruh uchun imtihon yarating"
        backHref="/teacher/exams"
      />
      <Card>
        <ExamForm groups={groups} action={createExam} submitLabel="Imtihonni yaratish" />
      </Card>
    </div>
  );
}
