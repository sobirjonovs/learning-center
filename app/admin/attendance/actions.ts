"use server";

// Davomat nazorati server amallari
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import { awardForAttendance, getGamificationSettings, getGroupAttendanceRewards } from "@/lib/gamification";
import { ATTENDANCE_STATUS, type AttendanceStatus } from "@/lib/constants";
import { actionOk, type ActionResult } from "@/lib/action-result";
import { MSGS } from "@/lib/toast-messages";

export async function setAttendance(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "attendance.manage");

  const groupId = String(formData.get("groupId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const date = String(formData.get("date") ?? "");
  const statusRaw = String(formData.get("status") ?? "");

  if (!groupId || !studentId) return actionOk(MSGS.saved);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return actionOk(MSGS.saved);
  if (!Object.keys(ATTENDANCE_STATUS).includes(statusRaw)) return actionOk(MSGS.saved);
  const status = statusRaw as AttendanceStatus;

  const membership = await db.groupStudent.findUnique({
    where: { groupId_studentId: { groupId, studentId } },
    include: {
      student: { select: { name: true } },
      group: {
        select: {
          name: true,
          attPresentXp: true,
          attPresentPoints: true,
          attLateXp: true,
          attLatePoints: true,
        },
      },
    },
  });
  if (!membership) return actionOk(MSGS.saved);
  const { attendance: attDefaults } = await getGamificationSettings();
  const rewards = getGroupAttendanceRewards(membership.group, attDefaults);

  const existing = await db.attendance.findUnique({
    where: { groupId_studentId_date: { groupId, studentId, date } },
  });

  if (existing) {
    if (existing.status === status) return actionOk(MSGS.saved);
    const oldStatus = existing.status as AttendanceStatus;
    await db.attendance.update({
      where: { id: existing.id },
      data: { status, markedById: session.id },
    });
    await awardForAttendance(studentId, status, oldStatus, date, existing.id, rewards);
  } else {
    const created = await db.attendance.create({
      data: { groupId, studentId, date, status, markedById: session.id },
    });
    await awardForAttendance(studentId, status, null, date, created.id, rewards);
  }

  await logActivity(
    session.id,
    "Davomat belgiladi",
    `${membership.student.name} (${membership.group.name}) — ${date}: ${ATTENDANCE_STATUS[status].label}`
  );

  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  return actionOk(MSGS.marked);
}
