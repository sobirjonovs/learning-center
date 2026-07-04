// O'quvchini tahrirlash
import { notFound } from "next/navigation";
import { requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { StudentForm } from "../../student-form";
import { updateStudent } from "../../actions";

export default async function EditStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "students.edit");

  const { id } = await params;
  const { error } = await searchParams;

  const [student, groups] = await Promise.all([
    db.user.findUnique({
      where: { id },
      include: { groupMemberships: { select: { groupId: true } } },
    }),
    db.group.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!student || student.role !== "STUDENT") notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="O'quvchini tahrirlash" subtitle={student.name} backHref={`/admin/students/${student.id}`} />
      <Card>
        <StudentForm
          student={student}
          groups={groups}
          memberGroupIds={student.groupMemberships.map((m) => m.groupId)}
          action={updateStudent}
          error={error}
        />
      </Card>
    </div>
  );
}
