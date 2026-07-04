// Yangi o'quvchi qo'shish
import { requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { StudentForm } from "../student-form";
import { createStudent } from "../actions";

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "students.create");
  const { error } = await searchParams;

  const groups = await db.group.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Yangi o'quvchi" subtitle="O'quvchi ma'lumotlarini kiriting" backHref="/admin/students" />
      <Card>
        <StudentForm groups={groups} memberGroupIds={[]} action={createStudent} error={error} />
      </Card>
    </div>
  );
}
