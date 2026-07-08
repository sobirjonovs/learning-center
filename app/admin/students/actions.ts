"use server";

// O'quvchilar bo'limi server amallari
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requirePermission, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import { resolveImageFromForm } from "@/lib/uploads";
import { generateUniqueLogin } from "@/lib/login";
import { STUDENT_TYPES, type PermissionKey, type StudentType } from "@/lib/constants";
import { actionErr, actionOk, type ActionResult } from "@/lib/action-result";
import { redirectWithError, redirectWithToast } from "@/lib/redirect-toast";
import { MSGS } from "@/lib/toast-messages";

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
  const studentType: StudentType = (STUDENT_TYPES as readonly string[]).includes(studentTypeRaw)
    ? (studentTypeRaw as StudentType)
    : STUDENT_TYPES[0];
  const active = formData.get("active") === "on";
  const groupIds = formData.getAll("groups").map(String);
  return { name, login, password, phone, parentPhone, studentType, active, groupIds };
}

/** Ism-familiyadan bazada bo'sh login taklif qiladi (forma uchun) */
export async function suggestStudentLogin(name: string): Promise<string> {
  await guard("students.create");
  return generateUniqueLogin(name.trim());
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
  const loginManual = formData.get("loginManual") === "1";

  if (!f.name || !f.password) redirectWithError("/admin/students/new", "Barcha majburiy maydonlarni to'ldiring");

  let login = f.login;
  if (!loginManual || !login) {
    login = await generateUniqueLogin(f.name);
  }
  if (!login) redirectWithError("/admin/students/new", "Barcha majburiy maydonlarni to'ldiring");

  const existing = await db.user.findUnique({ where: { login } });
  if (existing) redirectWithError("/admin/students/new", "Bu login allaqachon band");

  const image = await resolveImageFromForm(formData, "avatars");
  const student = await db.user.create({
    data: {
      role: "STUDENT",
      name: f.name,
      login,
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
  redirectWithToast("/admin/students", MSGS.created(student.name));
}

export async function updateStudent(formData: FormData) {
  const session = await guard("students.edit");
  const id = String(formData.get("id") ?? "");
  const student = await db.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") redirectWithToast("/admin/students", MSGS.updated());

  const f = readForm(formData);
  if (!f.name || !f.login) redirectWithError(`/admin/students/${id}/edit`, "Barcha majburiy maydonlarni to'ldiring");

  const existing = await db.user.findUnique({ where: { login: f.login } });
  if (existing && existing.id !== id) redirectWithError(`/admin/students/${id}/edit`, "Bu login allaqachon band");

  const image = await resolveImageFromForm(formData, "avatars");
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
  redirectWithToast(`/admin/students/${id}`, MSGS.updated(f.name));
}

export async function toggleStudent(formData: FormData): Promise<ActionResult> {
  const session = await guard("students.edit");
  const id = String(formData.get("id") ?? "");
  const student = await db.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") return actionErr("O'quvchi topilmadi");

  await db.user.update({ where: { id }, data: { active: !student.active } });
  await logActivity(
    session.id,
    student.active ? "O'quvchini faolsizlantirdi" : "O'quvchini faollashtirdi",
    student.name
  );
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${id}`);
  revalidatePath("/admin");
  return actionOk(
    student.active ? MSGS.deactivated(student.name) : MSGS.activated(student.name)
  );
}

export async function deleteStudent(formData: FormData): Promise<ActionResult> {
  const session = await guard("students.delete");
  const id = String(formData.get("id") ?? "");
  const student = await db.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") return actionErr("O'quvchi topilmadi");

  try {
    await db.user.delete({ where: { id } });
    await logActivity(session.id, "O'quvchini o'chirdi", student.name);
    revalidatePath("/admin/students");
    revalidatePath("/admin");
    return actionOk(MSGS.deleted(student.name));
  } catch {
    return actionErr("O'quvchini o'chirib bo'lmadi. Bog'liq ma'lumotlar mavjud bo'lishi mumkin.");
  }
}
