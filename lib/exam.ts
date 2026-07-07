// Imtihon holatini hisoblash (o'quvchi ko'rinishi uchun)
import type { ExamViewStatus } from "./constants";

type ExamLike = { startAt: Date; endAt: Date };
type ResultLike = {
  status: string;
  submittedAt: Date | null;
} | null;

/**
 * Hosila status:
 *  - hali boshlanmagan           -> UPCOMING
 *  - natija yo'q, vaqt ichida    -> ACTIVE
 *  - RETURNED                    -> IN_PROGRESS
 *  - ACCEPTED                    -> CHECKED
 *  - SUBMITTED                   -> SUBMITTED
 *  - natija yo'q, vaqt o'tgan    -> MISSED
 */
export function examViewStatus(
  exam: ExamLike,
  result: ResultLike,
  now = new Date()
): ExamViewStatus {
  if (now < exam.startAt) return "UPCOMING";
  if (!result) {
    return now > exam.endAt ? "MISSED" : "ACTIVE";
  }
  if (result.status === "ACCEPTED") return "CHECKED";
  if (result.status === "RETURNED") return "IN_PROGRESS";
  return "SUBMITTED";
}

/** Foiz bo'yicha o'tdi/o'tmadi */
export function examPassed(score: number, maxScore: number, passPercent: number): boolean {
  if (maxScore <= 0) return false;
  return Math.round((score / maxScore) * 100) >= passPercent;
}
