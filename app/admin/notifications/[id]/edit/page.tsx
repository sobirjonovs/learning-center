// Bildirishnomani tahrirlash (faqat DRAFT/SCHEDULED)
import { notFound, redirect } from "next/navigation";
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { toDatetimeLocal } from "@/lib/utils";
import { PageHeader, Card } from "@/components/ui";
import { NotificationForm, type UserOption } from "../../notification-form";

export default async function EditNotificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "notifications.send");

  const { id } = await params;
  const notification = await db.notification.findUnique({
    where: { id },
    include: { recipients: { select: { userId: true } } },
  });
  if (!notification) notFound();
  if (notification.status === "SENT") redirect("/admin/notifications");

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
        title="Bildirishnomani tahrirlash"
        subtitle={notification.title}
        backHref="/admin/notifications"
      />
      <Card>
        <NotificationForm
          groups={groups}
          users={users as UserOption[]}
          notification={{
            id: notification.id,
            title: notification.title,
            body: notification.body,
            image: notification.image,
            audience: notification.audience,
            groupId: notification.groupId,
            scheduledAt: toDatetimeLocal(notification.scheduledAt),
            recipientIds: notification.recipients.map((r) => r.userId),
          }}
        />
      </Card>
    </div>
  );
}
