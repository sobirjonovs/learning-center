// Guruhni tahrirlash
import { notFound } from "next/navigation";
import { requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { GroupForm } from "../../group-form";
import { updateGroup } from "../../actions";

export default async function EditGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "groups.manage");

  const { id } = await params;
  const { error } = await searchParams;

  const [group, teachers, subjects] = await Promise.all([
    db.group.findUnique({ where: { id } }),
    db.user.findMany({
      where: { role: "TEACHER", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.subject.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!group) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Guruhni tahrirlash" subtitle={group.name} backHref={`/admin/groups/${group.id}`} />
      <Card>
        <GroupForm group={group} teachers={teachers} subjects={subjects} action={updateGroup} error={error} />
      </Card>
    </div>
  );
}
