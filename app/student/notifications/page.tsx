// Bildirishnomalar — o'qilmaganlar ajratib ko'rsatiladi va avtomatik o'qilgan deb belgilanadi
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, fmtDateTime } from "@/lib/utils";
import { Bell } from "lucide-react";
import { Badge, EmptyState, PageHeader } from "@/components/ui";

export default async function StudentNotificationsPage() {
  const session = await requireRole("STUDENT");

  const rows = await db.notificationRecipient.findMany({
    where: { userId: session.id },
    include: {
      notification: { include: { sender: { select: { name: true } } } },
    },
    orderBy: { notification: { sentAt: "desc" } },
  });

  const unreadIds = new Set(rows.filter((r) => !r.readAt).map((r) => r.id));

  if (unreadIds.size > 0) {
    await db.notificationRecipient.updateMany({
      where: { userId: session.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={
          <span className="font-display inline-flex items-center gap-2">
            <Bell className="h-5 w-5 text-cyan-400" strokeWidth={1.75} />
            Bildirishnomalar
          </span>
        }
        subtitle="Sizga yuborilgan xabarlar"
        action={
          unreadIds.size > 0 ? (
            <Badge className="animate-pop bg-blue-500/15 text-blue-400">
              {unreadIds.size} ta yangi
            </Badge>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <EmptyState icon={Bell} title="Hozircha bildirishnomalar yo'q" />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const n = r.notification;
            const unread = unreadIds.has(r.id);
            return (
              <div
                key={r.id}
                className={cn(
                  "game-card animate-slide-up p-5",
                  unread && "border-blue-500/30 bg-blue-500/10"
                )}
              >
                <div className="flex items-start gap-3">
                  {unread && (
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 animate-pulse-soft rounded-full bg-cyan-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-white">{n.title}</div>
                      {unread && (
                        <Badge className="bg-cyan-400/15 text-cyan-300">Yangi</Badge>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-400">{n.body}</p>
                    {n.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.image}
                        alt={n.title}
                        className="mt-3 max-h-60 rounded-xl border border-white/10 object-cover"
                      />
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>👤 {n.sender?.name ?? "Tizim"}</span>
                      <span>·</span>
                      <span>🕐 {fmtDateTime(n.sentAt ?? n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
