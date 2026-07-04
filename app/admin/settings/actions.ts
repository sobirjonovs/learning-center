"use server";

// Gamifikatsiya sozlamalari (faqat SUPER_ADMIN)
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/log";
import { SETTING_KEYS } from "@/lib/constants";

export async function saveGamificationSettings(formData: FormData): Promise<void> {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  const xpRate = parseFloat(String(formData.get("quizXpRate") ?? ""));
  const pointRate = parseFloat(String(formData.get("quizPointRate") ?? ""));
  if (Number.isNaN(xpRate) || Number.isNaN(pointRate) || xpRate < 0 || pointRate < 0) return;

  await db.$transaction([
    db.setting.upsert({
      where: { key: SETTING_KEYS.quizXpRate },
      update: { value: String(xpRate) },
      create: { key: SETTING_KEYS.quizXpRate, value: String(xpRate) },
    }),
    db.setting.upsert({
      where: { key: SETTING_KEYS.quizPointRate },
      update: { value: String(pointRate) },
      create: { key: SETTING_KEYS.quizPointRate, value: String(pointRate) },
    }),
  ]);

  await logActivity(
    session.id,
    "Gamifikatsiya sozlamalarini yangiladi",
    `quiz_xp_rate=${xpRate}, quiz_point_rate=${pointRate}`
  );
  revalidatePath("/admin/settings");
}
