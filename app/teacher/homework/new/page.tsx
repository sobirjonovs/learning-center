// Yangi uyga vazifa yaratish
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { HomeworkForm } from "../homework-form";
import { createHomework } from "../actions";

export default async function NewHomeworkPage() {
  const session = await requireRole("TEACHER");

  const groups = await db.group.findMany({
    where: { teacherId: session.id },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yangi vazifa"
        subtitle="Guruh uchun uyga vazifa yarating"
        backHref="/teacher/homework"
      />
      <Card>
        <HomeworkForm groups={groups} action={createHomework} submitLabel="Vazifani yaratish" />
      </Card>
    </div>
  );
}
