// O'qituvchini tahrirlash
import { notFound } from "next/navigation";
import { requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { TeacherForm } from "../../teacher-form";
import { updateTeacher } from "../../actions";

export default async function EditTeacherPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "teachers.manage");

  const { id } = await params;
  const { error } = await searchParams;

  const [teacher, subjects, teacherSubjects] = await Promise.all([
    db.user.findUnique({ where: { id } }),
    db.subject.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.teacherSubject.findMany({
      where: { teacherId: id },
      select: { subjectId: true },
    }),
  ]);
  if (!teacher || teacher.role !== "TEACHER") notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="O'qituvchini tahrirlash"
        subtitle={teacher.name}
        backHref={`/admin/teachers/${teacher.id}`}
      />
      <Card>
        <TeacherForm
          teacher={{
            ...teacher,
            subjectIds: teacherSubjects.map((ts) => ts.subjectId),
          }}
          subjects={subjects}
          action={updateTeacher}
          error={error}
        />
      </Card>
    </div>
  );
}
