// Bildirishnomalar — o'qilmaganlar ajratib ko'rsatiladi va avtomatik o'qilgan deb belgilanadi
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, fmtDateTime } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export default async function StudentNotificationsPage() {
  const session = await requireRole("STUDENT");

  // Avval ro'yxatni olamiz — joriy renderda qaysilari yangi ekani ko'rinishi uchun
  const rows = await db.notificationRecipient.findMany({
    where: { userId: session.id },
    include: {
      notification: { include: { sender: { select: { name: true } } } },
    },
    orderBy: { notification: { sentAt: "desc" } },
  });

  const unreadIds = new Set(rows.filter((r) => !r.readAt).map((r) => r.id));

  // Keyin barchasini o'qilgan deb belgilaymiz
  if (unreadIds.size > 0) {
    await db.notificationRecipient.updateMany({
      where: { userId: session.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Bildirishnomalar 🔔"
        subtitle="Sizga yuborilgan xabarlar"
        action={
          unreadIds.size > 0 ? (
            <Badge className="animate-pop bg-violet-100 text-violet-700">
              {unreadIds.size} ta yangi
            </Badge>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <EmptyState icon="🔔" title="Hozircha bildirishnomalar yo'q" />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const n = r.notification;
            const unread = unreadIds.has(r.id);
            return (
              <Card
                key={r.id}
                className={cn(
                  "animate-slide-up",
                  unread && "border-violet-200 bg-violet-50/60"
                )}
              >
                <div className="flex items-start gap-3">
                  {unread && (
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 animate-pulse-soft rounded-full bg-violet-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-slate-900">{n.title}</div>
                      {unread && (
                        <Badge className="bg-violet-100 text-violet-700">Yangi</Badge>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{n.body}</p>
                    {n.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.image}
                        alt={n.title}
                        className="mt-3 max-h-60 rounded-xl border border-slate-100 object-cover"
                      />
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>👤 {n.sender?.name ?? "Tizim"}</span>
                      <span>·</span>
                      <span>🕐 {fmtDateTime(n.sentAt ?? n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
