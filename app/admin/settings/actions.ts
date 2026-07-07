"use server";

// Ball va gamifikatsiya sozlamalari (faqat SUPER_ADMIN)
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/log";
import { SETTING_KEYS } from "@/lib/constants";
import { invalidateGamificationSettingsCache } from "@/lib/gamification";
import { actionErr, actionOk, type ActionResult } from "@/lib/action-result";
import { MSGS } from "@/lib/toast-messages";

function parseFloatField(formData: FormData, name: string): number | null {
  const v = parseFloat(String(formData.get(name) ?? ""));
  return Number.isNaN(v) ? null : v;
}

function parseIntField(formData: FormData, name: string): number | null {
  const v = parseFloat(String(formData.get(name) ?? ""));
  return Number.isNaN(v) ? null : Math.round(v);
}

function upsertSetting(key: string, value: string) {
  return db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function saveGamificationSettings(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  const homeworkXpRate = parseFloatField(formData, "homeworkXpRate");
  const homeworkPointRate = parseFloatField(formData, "homeworkPointRate");
  const examXpRate = parseFloatField(formData, "examXpRate");
  const examPointRate = parseFloatField(formData, "examPointRate");
  const attPresentXp = parseIntField(formData, "attPresentXp");
  const attPresentPoints = parseIntField(formData, "attPresentPoints");
  const attLateXp = parseIntField(formData, "attLateXp");
  const attLatePoints = parseIntField(formData, "attLatePoints");
  const quizXpRate = parseFloatField(formData, "quizXpRate");
  const quizPointRate = parseFloatField(formData, "quizPointRate");
  const speedBonusPercent = parseFloatField(formData, "quizSpeedBonusPercent");
  const streakBonusPerStep = parseIntField(formData, "quizStreakBonusPerStep");
  const streakBonusMax = parseIntField(formData, "quizStreakBonusMax");

  const rates = [
    homeworkXpRate,
    homeworkPointRate,
    examXpRate,
    examPointRate,
    quizXpRate,
    quizPointRate,
  ];
  const ints = [
    attPresentXp,
    attPresentPoints,
    attLateXp,
    attLatePoints,
    streakBonusPerStep,
    streakBonusMax,
  ];

  if (
    rates.some((v) => v === null || v < 0) ||
    ints.some((v) => v === null || v < 0) ||
    speedBonusPercent === null ||
    speedBonusPercent < 0 ||
    speedBonusPercent > 100
  ) {
    return actionErr("Barcha maydonlarni to'g'ri kiriting");
  }

  const speedBonusFraction = speedBonusPercent / 100;

  await db.$transaction([
    upsertSetting(SETTING_KEYS.homeworkXpRate, String(homeworkXpRate)),
    upsertSetting(SETTING_KEYS.homeworkPointRate, String(homeworkPointRate)),
    upsertSetting(SETTING_KEYS.examXpRate, String(examXpRate)),
    upsertSetting(SETTING_KEYS.examPointRate, String(examPointRate)),
    upsertSetting(SETTING_KEYS.attPresentXp, String(attPresentXp)),
    upsertSetting(SETTING_KEYS.attPresentPoints, String(attPresentPoints)),
    upsertSetting(SETTING_KEYS.attLateXp, String(attLateXp)),
    upsertSetting(SETTING_KEYS.attLatePoints, String(attLatePoints)),
    upsertSetting(SETTING_KEYS.quizXpRate, String(quizXpRate)),
    upsertSetting(SETTING_KEYS.quizPointRate, String(quizPointRate)),
    upsertSetting(SETTING_KEYS.quizSpeedBonusFraction, String(speedBonusFraction)),
    upsertSetting(SETTING_KEYS.quizStreakBonusPerStep, String(streakBonusPerStep)),
    upsertSetting(SETTING_KEYS.quizStreakBonusMax, String(streakBonusMax)),
  ]);

  invalidateGamificationSettingsCache();

  await logActivity(session.id, "Ball sozlamalarini yangiladi", "Gamifikatsiya stavkalari");
  revalidatePath("/admin/settings");
  revalidatePath("/teacher/attendance");
  return actionOk(MSGS.saved);
}
