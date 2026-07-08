// Rejalashtirilgan yutuqlar: haftalik TOP 3 va oylik chempion.
// Toshkent vaqti bo'yicha yakshanba 00:00 va oy oxirida (keyingi oy 1-kuni 00:00) hisoblanadi.
import { db } from "./db";
import { ACHIEVEMENT_CODES } from "./constants";
import { grantAchievement, getRating } from "./gamification";
import {
  getTashkentDateParts,
  monthPeriodKey,
  startOfWeekSundayTashkent,
  tashkentMonthStart,
} from "./tashkent-time";

const CRON_WEEKLY_KEY = "cron_achievements_weekly_top3";
const CRON_MONTHLY_KEY = "cron_achievements_monthly_champion";

async function alreadyProcessed(settingKey: string, periodKey: string): Promise<boolean> {
  const row = await db.setting.findUnique({ where: { key: settingKey } });
  return row?.value === periodKey;
}

async function markProcessed(settingKey: string, periodKey: string): Promise<void> {
  await db.setting.upsert({
    where: { key: settingKey },
    update: { value: periodKey },
    create: { key: settingKey, value: periodKey },
  });
}

/** Guruh bo'yicha haftalik TOP 3 yutuq berish (yakshanba–shanba davri). */
export async function awardWeeklyTop3(since: Date, until: Date, periodKey: string): Promise<number> {
  if (await alreadyProcessed(CRON_WEEKLY_KEY, periodKey)) return 0;

  const groups = await db.group.findMany({
    select: { id: true, students: { select: { studentId: true } } },
  });

  let granted = 0;
  for (const group of groups) {
    const memberIds = group.students.map((s) => s.studentId);
    if (memberIds.length < 2) continue;

    const rating = await getRating(memberIds, since, until);
    for (const row of rating.filter((r) => r.place <= 3 && r.xp > 0)) {
      await grantAchievement(row.studentId, ACHIEVEMENT_CODES.TOP3_GROUP);
      granted += 1;
    }
  }

  await markProcessed(CRON_WEEKLY_KEY, periodKey);
  return granted;
}

/** Guruh bo'yicha oylik chempion yutuq berish. */
export async function awardMonthlyChampion(since: Date, until: Date, periodKey: string): Promise<number> {
  if (await alreadyProcessed(CRON_MONTHLY_KEY, periodKey)) return 0;

  const groups = await db.group.findMany({
    select: { id: true, students: { select: { studentId: true } } },
  });

  let granted = 0;
  for (const group of groups) {
    const memberIds = group.students.map((s) => s.studentId);
    if (memberIds.length < 2) continue;

    const rating = await getRating(memberIds, since, until);
    const first = rating[0];
    if (first && first.xp > 0) {
      await grantAchievement(first.studentId, ACHIEVEMENT_CODES.MONTH_CHAMPION);
      granted += 1;
    }
  }

  await markProcessed(CRON_MONTHLY_KEY, periodKey);
  return granted;
}

export type ScheduledAchievementResult = {
  weekly?: { periodKey: string; granted: number };
  monthly?: { periodKey: string; granted: number };
};

/**
 * Toshkent vaqtida joriy paytda bajarilishi kerak bo'lgan rejalashtirilgan
 * yutuqlarni tekshiradi va beradi.
 *
 * - Haftalik TOP 3: har yakshanba 00:00 (o'tgan yakshanba–shanba davri)
 * - Oy chempioni: oy tugagach keyingi oy 1-kuni 00:00 (31 kunli oylarda 31-sana
 *   tugagach, qisqa oylarda oxirgi kun tugagach).
 */
export async function processScheduledAchievements(now = new Date()): Promise<ScheduledAchievementResult> {
  const t = getTashkentDateParts(now);
  const result: ScheduledAchievementResult = {};

  // Yakshanba 00:00 — o'tgan hafta (yakshanba 00:00 .. shanba 23:59:59)
  if (t.weekday === 0) {
    const until = startOfWeekSundayTashkent(now);
    const since = new Date(until.getTime() - 7 * 86_400_000);
    const periodKey = `week:${since.toISOString().slice(0, 10)}`;
    const granted = await awardWeeklyTop3(since, until, periodKey);
    result.weekly = { periodKey, granted };
  }

  // Oy 1-kuni 00:00 — o'tgan to'liq oy
  if (t.day === 1) {
    const until = tashkentMonthStart(t.year, t.month);
    const prevMonth = t.month === 1 ? { year: t.year - 1, month: 12 } : { year: t.year, month: t.month - 1 };
    const since = tashkentMonthStart(prevMonth.year, prevMonth.month);
    const periodKey = monthPeriodKey(prevMonth.year, prevMonth.month);
    const granted = await awardMonthlyChampion(since, until, periodKey);
    result.monthly = { periodKey, granted };
  }

  return result;
}
