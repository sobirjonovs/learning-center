"use server";

// Yutuqlar bo'yicha server amallari
import { revalidatePath } from "next/cache";
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACHIEVEMENT_CODES, type AchievementCode } from "@/lib/constants";
import { logActivity } from "@/lib/log";
import { actionOk, type ActionResult } from "@/lib/action-result";
import { redirectWithError, redirectWithToast } from "@/lib/redirect-toast";
import { MSGS } from "@/lib/toast-messages";

async function guard() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "achievements.manage");
  return session;
}

function revalidateAchievements() {
  revalidatePath("/admin/achievements");
  revalidatePath("/student/achievements");
}

function readForm(formData: FormData) {
  const codeRaw = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  const code = (Object.values(ACHIEVEMENT_CODES) as string[]).includes(codeRaw)
    ? (codeRaw as AchievementCode)
    : "";
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || "🏆";
  const xpReward = Math.max(0, Math.round(Number(formData.get("xpReward") ?? 0)));
  const pointsReward = Math.max(0, Math.round(Number(formData.get("pointsReward") ?? 0)));
  const active = formData.get("active") === "on";
  return { code, name, description, icon, xpReward, pointsReward, active };
}

export async function createAchievement(formData: FormData) {
  const session = await guard();
  const data = readForm(formData);
  if (!data.code || !data.name || !data.description) {
    redirectWithError("/admin/achievements", "Barcha majburiy maydonlarni to'ldiring");
  }

  const existing = await db.achievement.findUnique({ where: { code: data.code } });
  if (existing) redirectWithError("/admin/achievements", "Bu kod allaqachon mavjud");

  const achievement = await db.achievement.create({ data });
  await logActivity(session.id, "Yutuq qo'shdi", achievement.name);
  revalidateAchievements();
  redirectWithToast("/admin/achievements", MSGS.created(achievement.name));
}

export async function updateAchievement(formData: FormData) {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const achievement = await db.achievement.findUnique({ where: { id } });
  if (!achievement) redirectWithToast("/admin/achievements", MSGS.updated());

  const data = readForm(formData);
  if (!data.code || !data.name || !data.description) {
    redirectWithError("/admin/achievements", "Barcha majburiy maydonlarni to'ldiring");
  }

  const existing = await db.achievement.findUnique({ where: { code: data.code } });
  if (existing && existing.id !== id) {
    redirectWithError("/admin/achievements", "Bu kod allaqachon mavjud");
  }

  await db.achievement.update({ where: { id }, data });
  await logActivity(session.id, "Yutuqni tahrirladi", data.name);
  revalidateAchievements();
  redirectWithToast("/admin/achievements", MSGS.updated(data.name));
}

export async function toggleAchievement(formData: FormData): Promise<ActionResult> {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const achievement = await db.achievement.findUnique({ where: { id } });
  if (!achievement) return actionOk(MSGS.saved);

  await db.achievement.update({ where: { id }, data: { active: !achievement.active } });
  await logActivity(
    session.id,
    achievement.active ? "Yutuqni faolsizlantirdi" : "Yutuqni faollashtirdi",
    achievement.name
  );
  revalidateAchievements();
  return actionOk(
    achievement.active
      ? MSGS.deactivated(achievement.name)
      : MSGS.activated(achievement.name)
  );
}

export async function deleteAchievement(formData: FormData): Promise<ActionResult> {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const achievement = await db.achievement.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });
  if (!achievement) return actionOk(MSGS.deleted());

  await db.achievement.delete({ where: { id } });
  await logActivity(
    session.id,
    "Yutuqni o'chirdi",
    `${achievement.name} (${achievement._count.students} ta o'quvchi)`
  );
  revalidateAchievements();
  return actionOk(MSGS.deleted(achievement.name));
}
