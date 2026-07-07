"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { refreshSessionFromDb, requireRole } from "@/lib/auth";
import { resolveImageFromForm } from "@/lib/uploads";
import { actionErr, actionOk, type ActionResult } from "@/lib/action-result";
import { MSGS } from "@/lib/toast-messages";

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("SUPER_ADMIN", "ADMIN", "TEACHER");
  const user = await db.user.findUnique({ where: { id: session.id } });
  if (!user) return actionErr("Foydalanuvchi topilmadi");

  const name = String(formData.get("name") ?? "").trim();
  const login = String(formData.get("login") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "").trim();
  const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

  if (!name || !login) return actionErr("Ism va login majburiy");

  const existing = await db.user.findUnique({ where: { login } });
  if (existing && existing.id !== session.id) {
    return actionErr("Bu login allaqachon band. Boshqa login tanlang.");
  }

  if (newPassword) {
    if (!currentPassword) {
      return actionErr("Parolni o'zgartirish uchun joriy parolni kiriting");
    }
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return actionErr("Joriy parol noto'g'ri");
    }
    if (newPassword.length < 6) {
      return actionErr("Yangi parol kamida 6 ta belgidan iborat bo'lsin");
    }
    if (newPassword !== confirmPassword) {
      return actionErr("Yangi parollar mos kelmadi");
    }
  }

  const image = await resolveImageFromForm(formData, "avatars");

  await db.user.update({
    where: { id: session.id },
    data: {
      name,
      login,
      phone: phone || null,
      ...(image ? { image } : {}),
      ...(newPassword ? { password: await bcrypt.hash(newPassword, 10) } : {}),
    },
  });

  await refreshSessionFromDb(session.id);
  revalidatePath("/teacher/profile");
  revalidatePath("/admin/profile");

  return actionOk(MSGS.saved);
}
