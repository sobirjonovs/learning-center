"use server";

// Kelmagan o'quvchilar — qo'ng'iroq holatini yozish
import { revalidatePath } from "next/cache";
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/log";
import { CALL_STATUS } from "@/lib/constants";

/** Har bir yangilanish YANGI CallLog yozuvi sifatida saqlanadi (tarix yo'qolmaydi). */
export async function addCallLog(formData: FormData): Promise<void> {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "calls.manage");

  const studentId = String(formData.get("studentId") ?? "");
  const groupId = String(formData.get("groupId") ?? "") || null;
  const date = String(formData.get("date") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!studentId || !date || !(status in CALL_STATUS)) return;

  const student = await db.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== "STUDENT") return;

  await db.callLog.create({
    data: {
      studentId,
      groupId,
      date,
      status,
      note,
      calledById: session.id,
    },
  });

  await logActivity(
    session.id,
    "Qo'ng'iroq holatini yangiladi",
    `${student.name} (${date}): ${CALL_STATUS[status as keyof typeof CALL_STATUS].label}`
  );
  revalidatePath("/admin/absent");
}
