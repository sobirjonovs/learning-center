// Bildirishnomalar ro'yxati
import Link from "next/link";
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime, fmtNumber } from "@/lib/utils";
import {
  NOTIFICATION_AUDIENCE,
  NOTIFICATION_STATUS,
  type NotificationAudience,
  type NotificationStatus,
} from "@/lib/constants";
import { Bell } from "lucide-react";
import { PageHeader, Table, Th, Td, Badge, EmptyState, btn } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { deliverDueScheduled, sendNow, deleteNotification } from "./actions";

export default async function NotificationsPage() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "notifications.send");

  // Vaqti kelgan rejalashtirilgan bildirishnomalarni avval yuboramiz
  await deliverDueScheduled();

  const notifications = await db.notification.findMany({
    include: { group: { select: { name: true } }, _count: { select: { recipients: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Bildirishnomalar"
        subtitle="O'quvchi va o'qituvchilarga xabarlar yuborish"
        action={
          <Link href="/admin/notifications/new" className={btn.primary}>
            + Yangi bildirishnoma
          </Link>
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Bildirishnomalar yo'q"
          hint="Birinchi bildirishnomani yaratish uchun yuqoridagi tugmani bosing."
          action={
            <Link href="/admin/notifications/new" className={btn.primary}>
              + Yangi bildirishnoma
            </Link>
          }
        />
      ) : (
        <Table
          head={
            <>
              <Th>Nomi</Th>
              <Th>Auditoriya</Th>
              <Th>Holat</Th>
              <Th>Sana</Th>
              <Th>Qabul qiluvchilar</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {notifications.map((n) => {
            const st =
              NOTIFICATION_STATUS[n.status as NotificationStatus] ?? NOTIFICATION_STATUS.DRAFT;
            const audience =
              NOTIFICATION_AUDIENCE[n.audience as NotificationAudience]?.label ?? n.audience;
            const editable = n.status === "DRAFT" || n.status === "SCHEDULED";
            return (
              <tr key={n.id} className="hover:bg-white/[0.04]">
                <Td>
                  <div className="max-w-xs">
                    <div className="truncate font-medium text-slate-100">{n.title}</div>
                    <div className="truncate text-xs text-slate-400">{n.body}</div>
                  </div>
                </Td>
                <Td>
                  <div className="text-slate-700">{audience}</div>
                  {n.audience === "GROUP" && n.group && (
                    <div className="text-xs text-slate-400">{n.group.name}</div>
                  )}
                </Td>
                <Td>
                  <Badge className={st.badge}>{st.label}</Badge>
                </Td>
                <Td className="text-slate-500">
                  {n.status === "SENT"
                    ? fmtDateTime(n.sentAt)
                    : n.status === "SCHEDULED"
                      ? fmtDateTime(n.scheduledAt)
                      : "—"}
                </Td>
                <Td>
                  <span className="font-medium text-slate-200">
                    {fmtNumber(n._count.recipients)} ta
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    {editable && (
                      <>
                        <form action={sendNow}>
                          <input type="hidden" name="id" value={n.id} />
                          <ConfirmButton
                            message={`"${n.title}" hoziroq yuborilsinmi?`}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-400 transition hover:bg-blue-500/25"
                          >
                            Darhol yuborish
                          </ConfirmButton>
                        </form>
                        <Link href={`/admin/notifications/${n.id}/edit`} className={btn.small}>
                          Tahrirlash
                        </Link>
                      </>
                    )}
                    <form action={deleteNotification}>
                      <input type="hidden" name="id" value={n.id} />
                      <ConfirmButton
                        message={`"${n.title}" bildirishnomasini o'chirishni tasdiqlaysizmi?`}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20"
                      >
                        O'chirish
                      </ConfirmButton>
                    </form>
                  </div>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
