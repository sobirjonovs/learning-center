"use server";

// Davomat belgilash bo'yicha server amallari
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ATTENDANCE_STATUS, type AttendanceStatus } from "@/lib/constants";
import { awardForAttendance, getGamificationSettings, getGroupAttendanceRewards } from "@/lib/gamification";
import { logActivity } from "@/lib/log";
import { actionOk, type ActionResult } from "@/lib/action-result";
import { MSGS } from "@/lib/toast-messages";

function parseReward(value: FormDataEntryValue | null, fallback: number): number {
  const n = Math.round(Number(value ?? fallback));
  return Math.min(10000, Math.max(0, Number.isFinite(n) ? n : fallback));
}

export async function saveAttendanceRewards(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("TEACHER");

  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return actionOk(MSGS.saved);

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group || group.teacherId !== session.id) return actionOk(MSGS.saved);

  const { attendance: attDefaults } = await getGamificationSettings();
  await db.group.update({
    where: { id: groupId },
    data: {
      attPresentXp: parseReward(formData.get("attPresentXp"), attDefaults.presentXp),
      attPresentPoints: parseReward(formData.get("attPresentPoints"), attDefaults.presentPoints),
      attLateXp: parseReward(formData.get("attLateXp"), attDefaults.lateXp),
      attLatePoints: parseReward(formData.get("attLatePoints"), attDefaults.latePoints),
    },
  });

  await logActivity(session.id, "Davomat mukofotini sozladi", group.name);
  revalidatePath("/teacher/attendance");
  return actionOk(MSGS.saved);
}

export async function markAttendance(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("TEACHER");

  const groupId = String(formData.get("groupId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const date = String(formData.get("date") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!groupId || !studentId) return actionOk(MSGS.saved);
  if (!(status in ATTENDANCE_STATUS)) return actionOk(MSGS.saved);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return actionOk(MSGS.saved);

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group || group.teacherId !== session.id) return actionOk(MSGS.saved);
  const { attendance: attDefaults } = await getGamificationSettings();
  const rewards = getGroupAttendanceRewards(group, attDefaults);

  const member = await db.groupStudent.findUnique({
    where: { groupId_studentId: { groupId, studentId } },
  });
  if (!member) return actionOk(MSGS.saved);

  const existing = await db.attendance.findUnique({
    where: { groupId_studentId_date: { groupId, studentId, date } },
  });
  const oldStatus = (existing?.status ?? null) as AttendanceStatus | null;
  if (oldStatus === status) return actionOk(MSGS.saved);

  const attendance = await db.attendance.upsert({
    where: { groupId_studentId_date: { groupId, studentId, date } },
    create: { groupId, studentId, date, status, markedById: session.id },
    update: { status, markedById: session.id },
  });

  await awardForAttendance(
    studentId,
    status as AttendanceStatus,
    oldStatus,
    date,
    attendance.id,
    rewards
  );
  await logActivity(session.id, "Davomat belgiladi", `${group.name} — ${date}`);

  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher");
  return actionOk(MSGS.marked);
}
