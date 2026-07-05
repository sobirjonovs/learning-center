"use server";

// Yutuqlar bo'yicha server amallari
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/log";

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
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
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
    redirect("/admin/achievements?error=required");
  }

  const existing = await db.achievement.findUnique({ where: { code: data.code } });
  if (existing) redirect("/admin/achievements?error=duplicate_code");

  const achievement = await db.achievement.create({ data });
  await logActivity(session.id, "Yutuq qo'shdi", achievement.name);
  revalidateAchievements();
  redirect("/admin/achievements");
}

export async function updateAchievement(formData: FormData) {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const achievement = await db.achievement.findUnique({ where: { id } });
  if (!achievement) redirect("/admin/achievements");

  const data = readForm(formData);
  if (!data.code || !data.name || !data.description) {
    redirect("/admin/achievements?error=required");
  }

  const existing = await db.achievement.findUnique({ where: { code: data.code } });
  if (existing && existing.id !== id) redirect("/admin/achievements?error=duplicate_code");

  await db.achievement.update({ where: { id }, data });
  await logActivity(session.id, "Yutuqni tahrirladi", data.name);
  revalidateAchievements();
  redirect("/admin/achievements");
}

export async function toggleAchievement(formData: FormData) {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const achievement = await db.achievement.findUnique({ where: { id } });
  if (!achievement) return;

  await db.achievement.update({ where: { id }, data: { active: !achievement.active } });
  await logActivity(
    session.id,
    achievement.active ? "Yutuqni faolsizlantirdi" : "Yutuqni faollashtirdi",
    achievement.name
  );
  revalidateAchievements();
}

export async function deleteAchievement(formData: FormData) {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const achievement = await db.achievement.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });
  if (!achievement) return;

  await db.achievement.delete({ where: { id } });
  await logActivity(
    session.id,
    "Yutuqni o'chirdi",
    `${achievement.name} (${achievement._count.students} ta o'quvchi)`
  );
  revalidateAchievements();
}
