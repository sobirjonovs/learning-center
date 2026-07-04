// Uyga vazifani tahrirlash
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { HomeworkForm } from "../../homework-form";
import { updateHomework } from "../../actions";

export default async function EditHomeworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;

  const homework = await db.homework.findUnique({
    where: { id },
    include: { group: true },
  });
  if (!homework || homework.group.teacherId !== session.id) redirect("/teacher/homework");

  const groups = await db.group.findMany({
    where: { teacherId: session.id },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Vazifani tahrirlash"
        subtitle={homework.title}
        backHref="/teacher/homework"
      />
      <Card>
        <HomeworkForm
          groups={groups}
          homework={homework}
          action={updateHomework}
          submitLabel="Saqlash"
        />
      </Card>
    </div>
  );
}
