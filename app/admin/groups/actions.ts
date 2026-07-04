"use server";

// Guruhlar bo'limi server amallari
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import { GROUP_TYPES, WEEKDAYS, type PermissionKey } from "@/lib/constants";

async function guard(permission: PermissionKey) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, permission);
  return session;
}

async function readForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "");
  const type = GROUP_TYPES.includes(typeRaw) ? typeRaw : GROUP_TYPES[0];
  const teacherIdRaw = String(formData.get("teacherId") ?? "");
  const days = formData.getAll("days").map(String).filter((d) => WEEKDAYS.includes(d));
  const time = String(formData.get("time") ?? "").trim();
  const room = String(formData.get("room") ?? "").trim();
  const startDateRaw = String(formData.get("startDate") ?? "");
  const endDateRaw = String(formData.get("endDate") ?? "");
  const active = formData.get("active") === "on";

  // O'qituvchi haqiqatan mavjudligini tekshiramiz
  let teacherId: string | null = null;
  if (teacherIdRaw) {
    const teacher = await db.user.findUnique({ where: { id: teacherIdRaw } });
    if (teacher && teacher.role === "TEACHER") teacherId = teacher.id;
  }

  return {
    name,
    type,
    teacherId,
    days: JSON.stringify(days),
    daysCount: days.length,
    time,
    room: room || null,
    startDate: startDateRaw ? new Date(startDateRaw) : null,
    endDate: endDateRaw ? new Date(endDateRaw) : null,
    active,
  };
}

export async function createGroup(formData: FormData) {
  const session = await guard("groups.create");
  const f = await readForm(formData);
  if (!f.name || !f.time || f.daysCount === 0) redirect("/admin/groups/new?error=required");

  const group = await db.group.create({
    data: {
      name: f.name,
      type: f.type,
      teacherId: f.teacherId,
      days: f.days,
      time: f.time,
      room: f.room,
      startDate: f.startDate,
      endDate: f.endDate,
      active: f.active,
    },
  });

  await logActivity(session.id, "Guruh yaratdi", group.name);
  revalidatePath("/admin/groups");
  revalidatePath("/admin");
  redirect("/admin/groups");
}

export async function updateGroup(formData: FormData) {
  const session = await guard("groups.manage");
  const id = String(formData.get("id") ?? "");
  const group = await db.group.findUnique({ where: { id } });
  if (!group) redirect("/admin/groups");

  const f = await readForm(formData);
  if (!f.name || !f.time || f.daysCount === 0) redirect(`/admin/groups/${id}/edit?error=required`);

  await db.group.update({
    where: { id },
    data: {
      name: f.name,
      type: f.type,
      teacherId: f.teacherId,
      days: f.days,
      time: f.time,
      room: f.room,
      startDate: f.startDate,
      endDate: f.endDate,
      active: f.active,
    },
  });

  await logActivity(session.id, "Guruhni tahrirladi", f.name);
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${id}`);
  redirect(`/admin/groups/${id}`);
}

export async function toggleGroup(formData: FormData) {
  const session = await guard("groups.manage");
  const id = String(formData.get("id") ?? "");
  const group = await db.group.findUnique({ where: { id } });
  if (!group) return;

  await db.group.update({ where: { id }, data: { active: !group.active } });
  await logActivity(
    session.id,
    group.active ? "Guruhni faolsizlantirdi" : "Guruhni faollashtirdi",
    group.name
  );
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${id}`);
  revalidatePath("/admin");
}

export async function deleteGroup(formData: FormData) {
  const session = await guard("groups.manage");
  const id = String(formData.get("id") ?? "");
  const group = await db.group.findUnique({ where: { id } });
  if (!group) return;

  await db.group.delete({ where: { id } });
  await logActivity(session.id, "Guruhni o'chirdi", group.name);
  revalidatePath("/admin/groups");
  revalidatePath("/admin");
  redirect("/admin/groups");
}

export async function addStudentToGroup(formData: FormData) {
  const session = await guard("groups.manage");
  const groupId = String(formData.get("groupId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");

  const [group, student] = await Promise.all([
    db.group.findUnique({ where: { id: groupId } }),
    db.user.findUnique({ where: { id: studentId } }),
  ]);
  if (!group || !student || student.role !== "STUDENT") return;

  const existing = await db.groupStudent.findUnique({
    where: { groupId_studentId: { groupId, studentId } },
  });
  if (!existing) {
    await db.groupStudent.create({ data: { groupId, studentId } });
    await logActivity(session.id, "Guruhga o'quvchi qo'shdi", `${student.name} → ${group.name}`);
  }

  revalidatePath(`/admin/groups/${groupId}`);
  revalidatePath("/admin/students");
}

export async function removeStudentFromGroup(formData: FormData) {
  const session = await guard("groups.manage");
  const groupId = String(formData.get("groupId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");

  const [group, student] = await Promise.all([
    db.group.findUnique({ where: { id: groupId } }),
    db.user.findUnique({ where: { id: studentId } }),
  ]);
  if (!group || !student) return;

  await db.groupStudent.deleteMany({ where: { groupId, studentId } });
  await logActivity(session.id, "Guruhdan o'quvchi chiqardi", `${student.name} ← ${group.name}`);
  revalidatePath(`/admin/groups/${groupId}`);
  revalidatePath("/admin/students");
}
