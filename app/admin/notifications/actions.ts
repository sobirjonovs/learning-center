"use server";

// Bildirishnomalar bo'yicha server amallari
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";
import { logActivity } from "@/lib/log";
import { NOTIFICATION_AUDIENCE } from "@/lib/constants";

async function requireNotificationSender() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "notifications.send");
  return session;
}

/**
 * Bildirishnomani yuborilgan deb belgilaydi va qabul qiluvchilarni
 * YUBORISH PAYTIDA auditoriyadan aniqlaydi. CUSTOM auditoriyada saqlash
 * vaqtida tanlangan foydalanuvchilar o'z holicha qoladi.
 */
async function deliver(notificationId: string): Promise<void> {
  const notification = await db.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.status === "SENT") return;

  if (notification.audience !== "CUSTOM") {
    let userIds: string[] = [];
    if (notification.audience === "ALL_STUDENTS") {
      const users = await db.user.findMany({
        where: { role: "STUDENT", active: true },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (notification.audience === "ALL_TEACHERS") {
      const users = await db.user.findMany({
        where: { role: "TEACHER", active: true },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (notification.audience === "GROUP" && notification.groupId) {
      const members = await db.groupStudent.findMany({
        where: { groupId: notification.groupId, student: { active: true } },
        select: { studentId: true },
      });
      userIds = members.map((m) => m.studentId);
    }

    await db.notificationRecipient.deleteMany({ where: { notificationId } });
    const unique = [...new Set(userIds)];
    if (unique.length > 0) {
      await db.notificationRecipient.createMany({
        data: unique.map((userId) => ({ notificationId, userId })),
      });
    }
  }

  await db.notification.update({
    where: { id: notificationId },
    data: { status: "SENT", sentAt: new Date() },
  });
}

/**
 * Vaqti kelgan rejalashtirilgan bildirishnomalarni avtomatik yuboradi.
 * Ro'yxat sahifasi ochilganda chaqiriladi (renderda revalidate qilinmaydi).
 */
export async function deliverDueScheduled(): Promise<void> {
  await requireNotificationSender();
  const due = await db.notification.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    select: { id: true },
  });
  for (const n of due) {
    await deliver(n.id);
  }
}

/** Yaratish/tahrirlash — intent: send | schedule | draft */
export async function saveNotification(formData: FormData): Promise<void> {
  const session = await requireNotificationSender();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  const audienceRaw = String(formData.get("audience") ?? "");
  const audience = audienceRaw in NOTIFICATION_AUDIENCE ? audienceRaw : "ALL_STUDENTS";
  const groupId = audience === "GROUP" ? String(formData.get("groupId") ?? "") || null : null;
  const userIds =
    audience === "CUSTOM"
      ? [...new Set(formData.getAll("userIds").map(String).filter(Boolean))]
      : [];
  const intent = String(formData.get("intent") ?? "draft");
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "");
  const scheduledAt =
    intent === "schedule" && scheduledAtRaw ? new Date(scheduledAtRaw) : null;

  const status = intent === "schedule" && scheduledAt ? "SCHEDULED" : "DRAFT";
  const image = await saveUpload(formData.get("image") as File | null, "notifications");

  let notificationId = id;
  if (id) {
    const existing = await db.notification.findUnique({ where: { id } });
    if (!existing) return;
    if (existing.status === "SENT") redirect("/admin/notifications");
    await db.notification.update({
      where: { id },
      data: {
        title,
        body,
        audience,
        groupId,
        status,
        scheduledAt,
        ...(image ? { image } : {}),
      },
    });
  } else {
    const created = await db.notification.create({
      data: {
        title,
        body,
        image,
        senderId: session.id,
        audience,
        groupId,
        status,
        scheduledAt,
      },
    });
    notificationId = created.id;
  }

  // CUSTOM: tanlangan foydalanuvchilar saqlash paytidayoq qabul qiluvchi sifatida yoziladi
  await db.notificationRecipient.deleteMany({ where: { notificationId } });
  if (audience === "CUSTOM" && userIds.length > 0) {
    await db.notificationRecipient.createMany({
      data: userIds.map((userId) => ({ notificationId, userId })),
    });
  }

  if (intent === "send") {
    await deliver(notificationId);
    await logActivity(session.id, "Bildirishnoma yubordi", title);
  } else if (intent === "schedule") {
    await logActivity(session.id, "Bildirishnoma rejalashtirdi", title);
  } else {
    await logActivity(session.id, "Bildirishnoma qoralamasini saqladi", title);
  }

  revalidatePath("/admin/notifications");
  redirect("/admin/notifications");
}

/** DRAFT/SCHEDULED bildirishnomani darhol yuborish */
export async function sendNow(formData: FormData): Promise<void> {
  const session = await requireNotificationSender();

  const id = String(formData.get("id") ?? "");
  const notification = await db.notification.findUnique({ where: { id } });
  if (!notification || notification.status === "SENT") return;

  await deliver(id);
  await logActivity(session.id, "Bildirishnoma yubordi", notification.title);
  revalidatePath("/admin/notifications");
}

export async function deleteNotification(formData: FormData): Promise<void> {
  const session = await requireNotificationSender();

  const id = String(formData.get("id") ?? "");
  const notification = await db.notification.findUnique({ where: { id } });
  if (!notification) return;

  await db.notification.delete({ where: { id } });
  await logActivity(session.id, "Bildirishnomani o'chirdi", notification.title);
  revalidatePath("/admin/notifications");
}
