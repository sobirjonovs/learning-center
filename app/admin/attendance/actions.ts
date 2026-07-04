"use server";

// Davomat nazorati server amallari
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import { awardForAttendance } from "@/lib/gamification";
import { ATTENDANCE_STATUS, type AttendanceStatus } from "@/lib/constants";

export async function setAttendance(formData: FormData) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "attendance.manage");

  const groupId = String(formData.get("groupId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const date = String(formData.get("date") ?? "");
  const statusRaw = String(formData.get("status") ?? "");

  if (!groupId || !studentId) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  if (!Object.keys(ATTENDANCE_STATUS).includes(statusRaw)) return;
  const status = statusRaw as AttendanceStatus;

  // O'quvchi haqiqatan shu guruh a'zosi ekanini tekshiramiz
  const membership = await db.groupStudent.findUnique({
    where: { groupId_studentId: { groupId, studentId } },
    include: { student: { select: { name: true } }, group: { select: { name: true } } },
  });
  if (!membership) return;

  const existing = await db.attendance.findUnique({
    where: { groupId_studentId_date: { groupId, studentId, date } },
  });

  if (existing) {
    if (existing.status === status) return; // o'zgarish yo'q
    const oldStatus = existing.status as AttendanceStatus;
    await db.attendance.update({
      where: { id: existing.id },
      data: { status, markedById: session.id },
    });
    await awardForAttendance(studentId, status, oldStatus, date, existing.id);
  } else {
    const created = await db.attendance.create({
      data: { groupId, studentId, date, status, markedById: session.id },
    });
    await awardForAttendance(studentId, status, null, date, created.id);
  }

  await logActivity(
    session.id,
    "Davomat belgiladi",
    `${membership.student.name} (${membership.group.name}) — ${date}: ${ATTENDANCE_STATUS[status].label}`
  );

  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
}
