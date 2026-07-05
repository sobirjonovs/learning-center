// Yangi o'qituvchi qo'shish
import { requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { TeacherForm } from "../teacher-form";
import { createTeacher } from "../actions";

export default async function NewTeacherPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "teachers.manage");
  const { error } = await searchParams;

  const subjects = await db.subject.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yangi o'qituvchi"
        subtitle="O'qituvchi ma'lumotlarini kiriting"
        backHref="/admin/teachers"
      />
      <Card>
        <TeacherForm subjects={subjects} action={createTeacher} error={error} />
      </Card>
    </div>
  );
}
