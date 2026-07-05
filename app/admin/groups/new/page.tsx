// Yangi guruh yaratish
import { requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { GroupForm } from "../group-form";
import { createGroup } from "../actions";

export default async function NewGroupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "groups.create");
  const { error } = await searchParams;

  const teachers = await db.user.findMany({
    where: { role: "TEACHER", active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const subjects = await db.subject.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Yangi guruh" subtitle="Guruh ma'lumotlarini kiriting" backHref="/admin/groups" />
      <Card>
        <GroupForm teachers={teachers} subjects={subjects} action={createGroup} error={error} />
      </Card>
    </div>
  );
}
