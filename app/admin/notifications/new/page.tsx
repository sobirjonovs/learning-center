// Yangi bildirishnoma yaratish
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card } from "@/components/ui";
import { NotificationForm, type UserOption } from "../notification-form";

export default async function NewNotificationPage() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "notifications.send");

  const [groups, users] = await Promise.all([
    db.group.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { active: true, role: { in: ["STUDENT", "TEACHER"] } },
      select: { id: true, name: true, role: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yangi bildirishnoma"
        subtitle="Xabarni darhol yuboring, rejalashtiring yoki qoralama sifatida saqlang"
        backHref="/admin/notifications"
      />
      <Card>
        <NotificationForm groups={groups} users={users as UserOption[]} />
      </Card>
    </div>
  );
}
