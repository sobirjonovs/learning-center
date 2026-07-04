"use server";

// Davomat belgilash bo'yicha server amallari
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ATTENDANCE_STATUS, type AttendanceStatus } from "@/lib/constants";
import { awardForAttendance } from "@/lib/gamification";
import { logActivity } from "@/lib/log";

export async function markAttendance(formData: FormData): Promise<void> {
  const session = await requireRole("TEACHER");

  const groupId = String(formData.get("groupId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const date = String(formData.get("date") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!groupId || !studentId) return;
  if (!(status in ATTENDANCE_STATUS)) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

  // Egalikni tekshirish: guruh shu o'qituvchiniki bo'lishi shart
  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group || group.teacherId !== session.id) return;

  // O'quvchi shu guruh a'zosi bo'lishi shart
  const member = await db.groupStudent.findUnique({
    where: { groupId_studentId: { groupId, studentId } },
  });
  if (!member) return;

  const existing = await db.attendance.findUnique({
    where: { groupId_studentId_date: { groupId, studentId, date } },
  });
  const oldStatus = (existing?.status ?? null) as AttendanceStatus | null;
  if (oldStatus === status) return;

  const attendance = await db.attendance.upsert({
    where: { groupId_studentId_date: { groupId, studentId, date } },
    create: { groupId, studentId, date, status, markedById: session.id },
    update: { status, markedById: session.id },
  });

  await awardForAttendance(studentId, status as AttendanceStatus, oldStatus, date, attendance.id);
  await logActivity(session.id, "Davomat belgiladi", `${group.name} — ${date}`);

  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher");
}
