// Gamifikatsiya yadrosi: ball/XP daftari, level, streak, yutuqlar.
// Ball (points) — magazin uchun; XP — level uchun. Ikkalasi alohida yuritiladi.
import { db } from "./db";
import { dateStr, todayStr, startOfMonth } from "./utils";
import { ACHIEVEMENT_CODES, ALL_SETTING_KEYS, ATTENDANCE_STATUS, QUIZ_SCORING, RATES, SETTING_KEYS, type AttendanceStatus } from "./constants";

// ---------------- Level ----------------

/** l-leveldan (l+1)-levelga o'tish narxi */
function levelCost(level: number): number {
  return 200 + (level - 1) * 100;
}

export type LevelInfo = {
  level: number;
  intoLevel: number; // joriy levelda yig'ilgan xp
  needed: number; // keyingi levelgacha kerak bo'lgan jami xp
  progress: number; // 0..1
  totalXp: number;
};

export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1;
  let rest = Math.max(0, totalXp);
  while (rest >= levelCost(level) && level < 100) {
    rest -= levelCost(level);
    level += 1;
  }
  const needed = levelCost(level);
  return { level, intoLevel: rest, needed, progress: Math.min(1, rest / needed), totalXp };
}

// ---------------- Streak ----------------

function nextStreak(lastActive: Date | null, current: number): number {
  if (!lastActive) return 1;
  const last = dateStr(lastActive);
  const today = todayStr();
  if (last === today) return Math.max(current, 1);
  const yesterday = dateStr(new Date(Date.now() - 86_400_000));
  return last === yesterday ? current + 1 : 1;
}

// ---------------- Ball/XP daftari ----------------

export type AwardInput = {
  points?: number; // +/- magazin balli
  xp?: number; // +/- tajriba
  reason: string;
  sourceType:
    | "ATTENDANCE"
    | "HOMEWORK"
    | "QUIZ"
    | "EXAM"
    | "PURCHASE"
    | "BONUS"
    | "ACHIEVEMENT"
    | "CHALLENGE";
  sourceId?: string;
};

/**
 * O'quvchiga ball/XP yozadi, streakni yangilaydi va (agar so'ralsa)
 * yutuqlarni tekshiradi. Miqdorlar butun songa yaxlitlanadi.
 */
export async function awardScore(
  studentId: string,
  input: AwardInput,
  opts: { skipAchievements?: boolean } = {}
): Promise<void> {
  const points = Math.round(input.points ?? 0);
  const xp = Math.round(input.xp ?? 0);
  if (points === 0 && xp === 0) return;

  const student = await db.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== "STUDENT") return;

  const streak = xp > 0 ? nextStreak(student.lastActive, student.streak) : student.streak;

  await db.$transaction([
    db.scoreTransaction.create({
      data: {
        studentId,
        points,
        xp,
        reason: input.reason,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      },
    }),
    db.user.update({
      where: { id: studentId },
      data: {
        points: { increment: points },
        xp: { increment: Math.max(0, xp) },
        streak,
        ...(xp > 0 ? { lastActive: new Date() } : {}),
      },
    }),
  ]);

  if (!opts.skipAchievements) {
    await checkAchievements(studentId).catch(() => {});
  }
}

/** Magazin uchun ball yechish. Yetarli bo'lmasa xato tashlaydi. */
export async function spendPoints(
  studentId: string,
  amount: number,
  reason: string,
  sourceId?: string
): Promise<void> {
  const student = await db.user.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("O'quvchi topilmadi");
  if (student.points < amount) {
    throw new Error(`Ball yetarli emas: yana ${amount - student.points} ball kerak`);
  }
  await db.$transaction([
    db.scoreTransaction.create({
      data: { studentId, points: -amount, xp: 0, reason, sourceType: "PURCHASE", sourceId },
    }),
    db.user.update({ where: { id: studentId }, data: { points: { decrement: amount } } }),
  ]);
}

// ---------------- Davomat mukofoti ----------------

export type AttendanceReward = { xp: number; points: number; label: string };

export type AttendanceRewards = Record<AttendanceStatus, AttendanceReward>;

export type AttendanceDefaults = {
  presentXp: number;
  presentPoints: number;
  lateXp: number;
  latePoints: number;
};

/** Guruh uchun davomat mukofotlari (guruh maydoni bo'sh bo'lsa admin standartidan olinadi). */
export function getGroupAttendanceRewards(
  group: {
    attPresentXp?: number | null;
    attPresentPoints?: number | null;
    attLateXp?: number | null;
    attLatePoints?: number | null;
  },
  defaults: AttendanceDefaults
): AttendanceRewards {
  return {
    PRESENT: {
      label: ATTENDANCE_STATUS.PRESENT.label,
      xp: group.attPresentXp ?? defaults.presentXp,
      points: group.attPresentPoints ?? defaults.presentPoints,
    },
    LATE: {
      label: ATTENDANCE_STATUS.LATE.label,
      xp: group.attLateXp ?? defaults.lateXp,
      points: group.attLatePoints ?? defaults.latePoints,
    },
    ABSENT: { label: ATTENDANCE_STATUS.ABSENT.label, xp: 0, points: 0 },
    EXCUSED: { label: ATTENDANCE_STATUS.EXCUSED.label, xp: 0, points: 0 },
  };
}

function attendanceReward(
  status: AttendanceStatus,
  rewards?: AttendanceRewards
): AttendanceReward {
  if (rewards) return rewards[status];
  const d = ATTENDANCE_STATUS[status];
  return { xp: d.xp, points: d.points, label: d.label };
}

/**
 * Davomat belgilanganda chaqiriladi. Oldingi status bilan farqni hisobga oladi
 * (masalan, KELDI -> KELMADI ga o'zgartirilsa, berilgan ball qaytarib olinadi).
 */
export async function awardForAttendance(
  studentId: string,
  newStatus: AttendanceStatus,
  oldStatus: AttendanceStatus | null,
  date: string,
  attendanceId: string,
  rewards?: AttendanceRewards
): Promise<void> {
  const nw = attendanceReward(newStatus, rewards);
  const old = oldStatus ? attendanceReward(oldStatus, rewards) : { xp: 0, points: 0, label: "" };
  const dXp = nw.xp - old.xp;
  const dPoints = nw.points - old.points;
  if (dXp === 0 && dPoints === 0) return;
  await awardScore(studentId, {
    xp: dXp,
    points: dPoints,
    reason: `Davomat (${date}): ${nw.label}`,
    sourceType: "ATTENDANCE",
    sourceId: attendanceId,
  });
}

// ---------------- Uyga vazifa balli ----------------

export type HomeworkScore = {
  base: number;
  bonus: number;
  penalty: number;
  final: number;
  daysEarly: number;
  daysLate: number;
};

/**
 * Yakuniy ball = asosiy ball + (kun * bonus) - (kun * jarima), 0 dan kam emas.
 * Misol: 100 ball, 2 kun oldin (bonus 10): +20; 1 kun kech (jarima 15): -15.
 */
export function computeHomeworkScore(
  base: number,
  dueAt: Date,
  submittedAt: Date,
  earlyBonusPerDay: number,
  latePenaltyPerDay: number
): HomeworkScore {
  const diffMs = dueAt.getTime() - submittedAt.getTime();
  const daysEarly = diffMs > 0 ? Math.floor(diffMs / 86_400_000) : 0;
  const daysLate = diffMs < 0 ? Math.ceil(-diffMs / 86_400_000) : 0;
  const bonus = daysEarly * earlyBonusPerDay;
  const penalty = daysLate * latePenaltyPerDay;
  const final = Math.max(0, base + bonus - penalty);
  return { base, bonus, penalty, final, daysEarly, daysLate };
}

/** Baholangan vazifa uchun XP/ball yozish (qayta baholashda farqni yozadi). */
export async function awardForHomework(
  studentId: string,
  finalScore: number,
  previousFinal: number | null,
  homeworkTitle: string,
  submissionId: string
): Promise<void> {
  const prev = previousFinal ?? 0;
  const dFinal = finalScore - prev;
  if (dFinal === 0) return;
  const { homework } = await getGamificationSettings();
  await awardScore(studentId, {
    xp: dFinal * homework.xpRate,
    points: dFinal * homework.pointRate,
    reason: `Uyga vazifa: ${homeworkTitle}`,
    sourceType: "HOMEWORK",
    sourceId: submissionId,
  });
}

// ---------------- Ball sozlamalari (admin) ----------------

export type GamificationSettings = {
  homework: { xpRate: number; pointRate: number };
  exam: { xpRate: number; pointRate: number };
  attendance: AttendanceDefaults;
  quiz: { xpRate: number; pointRate: number };
  quizScoring: QuizScoringConfig;
};

function settingFloat(map: Map<string, string>, key: string, fallback: number): number {
  const v = parseFloat(map.get(key) ?? "");
  return !Number.isNaN(v) ? v : fallback;
}

function settingInt(map: Map<string, string>, key: string, fallback: number): number {
  const v = parseFloat(map.get(key) ?? "");
  return !Number.isNaN(v) ? Math.max(0, Math.round(v)) : fallback;
}

let settingsCache: { at: number; data: GamificationSettings } | null = null;
const SETTINGS_TTL_MS = 30_000;

/** Barcha gamifikatsiya stavkalarini admin sozlamalaridan yuklaydi. */
export async function getGamificationSettings(): Promise<GamificationSettings> {
  const now = Date.now();
  if (settingsCache && now - settingsCache.at < SETTINGS_TTL_MS) {
    return settingsCache.data;
  }

  const rows = await db.setting.findMany({ where: { key: { in: [...ALL_SETTING_KEYS] } } });
  const map = new Map(rows.map((s) => [s.key, s.value]));

  const speedFrac = settingFloat(
    map,
    SETTING_KEYS.quizSpeedBonusFraction,
    QUIZ_SCORING.speedBonusFraction
  );

  const data: GamificationSettings = {
    homework: {
      xpRate: settingFloat(map, SETTING_KEYS.homeworkXpRate, RATES.homeworkXp),
      pointRate: settingFloat(map, SETTING_KEYS.homeworkPointRate, RATES.homeworkPoints),
    },
    exam: {
      xpRate: settingFloat(map, SETTING_KEYS.examXpRate, RATES.examXp),
      pointRate: settingFloat(map, SETTING_KEYS.examPointRate, RATES.examPoints),
    },
    attendance: {
      presentXp: settingInt(map, SETTING_KEYS.attPresentXp, ATTENDANCE_STATUS.PRESENT.xp),
      presentPoints: settingInt(
        map,
        SETTING_KEYS.attPresentPoints,
        ATTENDANCE_STATUS.PRESENT.points
      ),
      lateXp: settingInt(map, SETTING_KEYS.attLateXp, ATTENDANCE_STATUS.LATE.xp),
      latePoints: settingInt(map, SETTING_KEYS.attLatePoints, ATTENDANCE_STATUS.LATE.points),
    },
    quiz: {
      xpRate: settingFloat(map, SETTING_KEYS.quizXpRate, RATES.quizXp),
      pointRate: settingFloat(map, SETTING_KEYS.quizPointRate, RATES.quizPoints),
    },
    quizScoring: {
      speedBonusFraction: Math.min(1, Math.max(0, speedFrac)),
      streakBonusPerStep: settingInt(
        map,
        SETTING_KEYS.quizStreakBonusPerStep,
        QUIZ_SCORING.streakBonusPerStep
      ),
      streakBonusMax: settingInt(
        map,
        SETTING_KEYS.quizStreakBonusMax,
        QUIZ_SCORING.streakBonusMax
      ),
    },
  };

  settingsCache = { at: now, data };
  return data;
}

export function invalidateGamificationSettingsCache(): void {
  settingsCache = null;
}

// ---------------- Quiz koeffitsiyentlari ----------------

export type QuizScoringConfig = {
  speedBonusFraction: number;
  streakBonusPerStep: number;
  streakBonusMax: number;
};

export async function getQuizScoring(): Promise<QuizScoringConfig> {
  const { quizScoring } = await getGamificationSettings();
  return quizScoring;
}

export async function getQuizRates(): Promise<{ xpRate: number; pointRate: number }> {
  const { quiz } = await getGamificationSettings();
  return quiz;
}

// ---------------- Reyting ----------------

export type RatingRow = {
  studentId: string;
  name: string;
  image: string | null;
  xp: number; // davrdagi xp
  points: number; // davrdagi ball (faqat yig'ilgan, xarajatlarsiz)
  totalXp: number;
  level: number;
  place: number;
};

/**
 * Berilgan o'quvchilar bo'yicha reyting. `since` berilsa — davr ichidagi
 * tranzaksiyalar bo'yicha, bo'lmasa umumiy XP bo'yicha.
 */
export async function getRating(studentIds: string[], since?: Date): Promise<RatingRow[]> {
  if (studentIds.length === 0) return [];
  const students = await db.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, name: true, image: true, xp: true, points: true },
  });

  let periodMap: Map<string, { xp: number; points: number }>;
  if (since) {
    const txs = await db.scoreTransaction.groupBy({
      by: ["studentId"],
      where: {
        studentId: { in: studentIds },
        createdAt: { gte: since },
        sourceType: { not: "PURCHASE" },
      },
      _sum: { xp: true, points: true },
    });
    periodMap = new Map(
      txs.map((t) => [t.studentId, { xp: t._sum.xp ?? 0, points: t._sum.points ?? 0 }])
    );
  } else {
    periodMap = new Map(students.map((s) => [s.id, { xp: s.xp, points: Math.max(s.points, 0) }]));
  }

  const rows = students
    .map((s) => {
      const p = periodMap.get(s.id) ?? { xp: 0, points: 0 };
      return {
        studentId: s.id,
        name: s.name,
        image: s.image,
        xp: p.xp,
        points: since ? p.points : s.points,
        totalXp: s.xp,
        level: levelFromXp(s.xp).level,
        place: 0,
      };
    })
    .sort((a, b) => b.xp - a.xp || b.points - a.points);

  rows.forEach((r, i) => (r.place = i + 1));
  return rows;
}

// ---------------- Yutuqlar ----------------

async function grant(studentId: string, code: string): Promise<void> {
  const achievement = await db.achievement.findUnique({ where: { code } });
  if (!achievement?.active) return;
  const existing = await db.studentAchievement.findUnique({
    where: { studentId_achievementId: { studentId, achievementId: achievement.id } },
  });
  if (existing) return;
  await db.studentAchievement.create({
    data: { studentId, achievementId: achievement.id },
  });
  if (achievement.xpReward > 0 || achievement.pointsReward > 0) {
    await awardScore(
      studentId,
      {
        xp: achievement.xpReward,
        points: achievement.pointsReward,
        reason: `Yutuq: ${achievement.name}`,
        sourceType: "ACHIEVEMENT",
        sourceId: achievement.id,
      },
      { skipAchievements: true }
    );
  }
}

/** Barcha yutuq shartlarini tekshiradi va yangi ochilganlarini beradi. */
export async function checkAchievements(studentId: string): Promise<void> {
  const student = await db.user.findUnique({
    where: { id: studentId },
    include: { groupMemberships: { select: { groupId: true } } },
  });
  if (!student) return;

  // 7 kun ketma-ket faollik
  if (student.streak >= 7) await grant(studentId, ACHIEVEMENT_CODES.STREAK_7);

  // 10 ta vazifa o'z vaqtida (jarimasiz qabul qilingan)
  const onTime = await db.submission.count({
    where: { studentId, status: "ACCEPTED", penalty: 0 },
  });
  if (onTime >= 10) await grant(studentId, ACHIEVEMENT_CODES.HOMEWORK_10_ONTIME);

  // 5 ta vazifa muddatidan oldin (bonusli)
  const early = await db.submission.count({
    where: { studentId, status: "ACCEPTED", bonus: { gt: 0 } },
  });
  if (early >= 5) await grant(studentId, ACHIEVEMENT_CODES.EARLY_5);

  // Quizda 1-o'rin
  const quizWin = await db.quizResult.count({ where: { studentId, place: 1 } });
  if (quizWin > 0) await grant(studentId, ACHIEVEMENT_CODES.QUIZ_WINNER);

  // Imtihondan 100% natija
  const examResults = await db.examResult.findMany({
    where: { studentId },
    include: { exam: { select: { maxScore: true } } },
  });
  if (examResults.some((r) => r.score >= r.exam.maxScore)) {
    await grant(studentId, ACHIEVEMENT_CODES.EXAM_PERFECT);
  }

  // Guruh reytingida TOP 3 (umumiy XP bo'yicha) va oy chempioni
  for (const gm of student.groupMemberships) {
    const memberIds = (
      await db.groupStudent.findMany({
        where: { groupId: gm.groupId },
        select: { studentId: true },
      })
    ).map((m) => m.studentId);
    if (memberIds.length < 2) continue;

    const overall = await getRating(memberIds);
    const myOverall = overall.find((r) => r.studentId === studentId);
    if (myOverall && myOverall.place <= 3 && myOverall.xp > 0) {
      await grant(studentId, ACHIEVEMENT_CODES.TOP3_GROUP);
    }

    const monthly = await getRating(memberIds, startOfMonth());
    const first = monthly[0];
    if (first && first.studentId === studentId && first.xp > 0) {
      await grant(studentId, ACHIEVEMENT_CODES.MONTH_CHAMPION);
    }
  }
}

// ---------------- Davomat foizi ----------------

/** O'quvchining davomat foizi (PRESENT/LATE qatnashgan deb olinadi). */
export async function attendancePercent(studentId: string): Promise<number> {
  const [total, present] = await Promise.all([
    db.attendance.count({ where: { studentId } }),
    db.attendance.count({ where: { studentId, status: { in: ["PRESENT", "LATE"] } } }),
  ]);
  return total > 0 ? Math.round((present / total) * 100) : 0;
}
