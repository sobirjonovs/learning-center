"use server";

// O'quvchilar bo'limi server amallari
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requirePermission, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import { saveUpload } from "@/lib/uploads";
import { STUDENT_TYPES, type PermissionKey } from "@/lib/constants";

async function guard(permission: PermissionKey) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, permission);
  return session;
}

function readForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const parentPhone = String(formData.get("parentPhone") ?? "").trim();
  const studentTypeRaw = String(formData.get("studentType") ?? "");
  const studentType = STUDENT_TYPES.includes(studentTypeRaw) ? studentTypeRaw : STUDENT_TYPES[0];
  const active = formData.get("active") === "on";
  const groupIds = formData.getAll("groups").map(String);
  return { name, login, password, phone, parentPhone, studentType, active, groupIds };
}

/** Faqat faol guruhlar orasidan tanlanganlarini sinxronlaydi (formada faqat faol guruhlar ko'rinadi). */
async function syncGroups(studentId: string, selected: string[]) {
  const activeGroups = await db.group.findMany({ where: { active: true }, select: { id: true } });
  const activeIds = activeGroups.map((g) => g.id);
  const chosen = selected.filter((g) => activeIds.includes(g));

  const existing = await db.groupStudent.findMany({
    where: { studentId },
    select: { groupId: true },
  });
  const existingIds = existing.map((e) => e.groupId);

  const toAdd = chosen.filter((g) => !existingIds.includes(g));
  const toRemove = existingIds.filter((g) => activeIds.includes(g) && !chosen.includes(g));

  if (toRemove.length > 0) {
    await db.groupStudent.deleteMany({ where: { studentId, groupId: { in: toRemove } } });
  }
  if (toAdd.length > 0) {
    await db.groupStudent.createMany({
      data: toAdd.map((groupId) => ({ groupId, studentId })),
    });
  }
}

export async function createStudent(formData: FormData) {
  const session = await guard("students.create");
  const f = readForm(formData);
  if (!f.name || !f.login || !f.password) redirect("/admin/students/new?error=required");

  const existing = await db.user.findUnique({ where: { login: f.login } });
  if (existing) redirect("/admin/students/new?error=login");

  const image = await saveUpload(formData.get("image") as File | null, "avatars");
  const student = await db.user.create({
    data: {
      role: "STUDENT",
      name: f.name,
      login: f.login,
      password: await bcrypt.hash(f.password, 10),
      phone: f.phone || null,
      parentPhone: f.parentPhone || null,
      studentType: f.studentType,
      image,
      active: f.active,
    },
  });
  await syncGroups(student.id, f.groupIds);

  await logActivity(session.id, "O'quvchi yaratdi", student.name);
  revalidatePath("/admin/students");
  revalidatePath("/admin/groups");
  revalidatePath("/admin");
  redirect("/admin/students");
}

export async function updateStudent(formData: FormData) {
  const session = await guard("students.edit");
  const id = String(formData.get("id") ?? "");
  const student = await db.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") redirect("/admin/students");

  const f = readForm(formData);
  if (!f.name || !f.login) redirect(`/admin/students/${id}/edit?error=required`);

  const existing = await db.user.findUnique({ where: { login: f.login } });
  if (existing && existing.id !== id) redirect(`/admin/students/${id}/edit?error=login`);

  const image = await saveUpload(formData.get("image") as File | null, "avatars");
  await db.user.update({
    where: { id },
    data: {
      name: f.name,
      login: f.login,
      phone: f.phone || null,
      parentPhone: f.parentPhone || null,
      studentType: f.studentType,
      active: f.active,
      ...(image ? { image } : {}),
      ...(f.password ? { password: await bcrypt.hash(f.password, 10) } : {}),
    },
  });
  await syncGroups(id, f.groupIds);

  await logActivity(session.id, "O'quvchini tahrirladi", f.name);
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${id}`);
  revalidatePath("/admin/groups");
  redirect(`/admin/students/${id}`);
}

export async function toggleStudent(formData: FormData) {
  const session = await guard("students.edit");
  const id = String(formData.get("id") ?? "");
  const student = await db.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") return;

  await db.user.update({ where: { id }, data: { active: !student.active } });
  await logActivity(
    session.id,
    student.active ? "O'quvchini faolsizlantirdi" : "O'quvchini faollashtirdi",
    student.name
  );
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${id}`);
  revalidatePath("/admin");
}

export async function deleteStudent(formData: FormData) {
  const session = await guard("students.delete");
  const id = String(formData.get("id") ?? "");
  const student = await db.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") return;

  await db.user.delete({ where: { id } });
  await logActivity(session.id, "O'quvchini o'chirdi", student.name);
  revalidatePath("/admin/students");
  revalidatePath("/admin");
  redirect("/admin/students");
}
