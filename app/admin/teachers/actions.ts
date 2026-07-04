"use server";

// O'qituvchilar bo'limi server amallari
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requirePermission, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import { saveUpload } from "@/lib/uploads";
import { TEACHER_TYPES } from "@/lib/constants";

async function guard() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "teachers.manage");
  return session;
}

function readForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const teacherTypeRaw = String(formData.get("teacherType") ?? "");
  const teacherType = TEACHER_TYPES.includes(teacherTypeRaw) ? teacherTypeRaw : TEACHER_TYPES[0];
  const active = formData.get("active") === "on";
  return { name, login, password, phone, teacherType, active };
}

export async function createTeacher(formData: FormData) {
  const session = await guard();
  const { name, login, password, phone, teacherType, active } = readForm(formData);
  if (!name || !login || !password) redirect("/admin/teachers/new?error=required");

  const existing = await db.user.findUnique({ where: { login } });
  if (existing) redirect("/admin/teachers/new?error=login");

  const image = await saveUpload(formData.get("image") as File | null, "avatars");
  const teacher = await db.user.create({
    data: {
      role: "TEACHER",
      name,
      login,
      password: await bcrypt.hash(password, 10),
      phone: phone || null,
      image,
      teacherType,
      active,
    },
  });

  await logActivity(session.id, "O'qituvchi yaratdi", teacher.name);
  revalidatePath("/admin/teachers");
  revalidatePath("/admin");
  redirect("/admin/teachers");
}

export async function updateTeacher(formData: FormData) {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const teacher = await db.user.findUnique({ where: { id } });
  if (!teacher || teacher.role !== "TEACHER") redirect("/admin/teachers");

  const { name, login, password, phone, teacherType, active } = readForm(formData);
  if (!name || !login) redirect(`/admin/teachers/${id}/edit?error=required`);

  const existing = await db.user.findUnique({ where: { login } });
  if (existing && existing.id !== id) redirect(`/admin/teachers/${id}/edit?error=login`);

  const image = await saveUpload(formData.get("image") as File | null, "avatars");
  await db.user.update({
    where: { id },
    data: {
      name,
      login,
      phone: phone || null,
      teacherType,
      active,
      ...(image ? { image } : {}),
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    },
  });

  await logActivity(session.id, "O'qituvchini tahrirladi", name);
  revalidatePath("/admin/teachers");
  revalidatePath(`/admin/teachers/${id}`);
  redirect(`/admin/teachers/${id}`);
}

export async function toggleTeacher(formData: FormData) {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const teacher = await db.user.findUnique({ where: { id } });
  if (!teacher || teacher.role !== "TEACHER") return;

  await db.user.update({ where: { id }, data: { active: !teacher.active } });
  await logActivity(
    session.id,
    teacher.active ? "O'qituvchini faolsizlantirdi" : "O'qituvchini faollashtirdi",
    teacher.name
  );
  revalidatePath("/admin/teachers");
  revalidatePath(`/admin/teachers/${id}`);
  revalidatePath("/admin");
}

export async function deleteTeacher(formData: FormData) {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const teacher = await db.user.findUnique({ where: { id } });
  if (!teacher || teacher.role !== "TEACHER") return;

  await db.user.delete({ where: { id } });
  await logActivity(session.id, "O'qituvchini o'chirdi", teacher.name);
  revalidatePath("/admin/teachers");
  revalidatePath("/admin");
  redirect("/admin/teachers");
}

/** Faol guruhni o'qituvchiga biriktirish (profil sahifasidagi modal) */
export async function assignGroupToTeacher(formData: FormData) {
  const session = await guard();
  const teacherId = String(formData.get("teacherId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const [teacher, group] = await Promise.all([
    db.user.findUnique({ where: { id: teacherId } }),
    db.group.findUnique({ where: { id: groupId } }),
  ]);
  if (!teacher || teacher.role !== "TEACHER" || !group) return;

  await db.group.update({ where: { id: groupId }, data: { teacherId } });
  await logActivity(session.id, "Guruh biriktirdi", `${group.name} → ${teacher.name}`);
  revalidatePath(`/admin/teachers/${teacherId}`);
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);
}
