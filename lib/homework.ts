// Uyga vazifa holatini hisoblash (o'quvchi ko'rinishi uchun)
import type { HomeworkViewStatus } from "./constants";

type HomeworkLike = { dueAt: Date; startAt: Date };
type SubmissionLike = {
  status: string; // SUBMITTED | ACCEPTED | RETURNED
  submittedAt: Date;
} | null;

/**
 * Hosila status:
 *  - topshiriq yo'q, muddat o'tgan  -> MISSED (Bajarilmadi)
 *  - topshiriq yo'q, muddat yaqin(24s) -> IN_PROGRESS (Jarayonda)
 *  - topshiriq yo'q                  -> NEW (Yangi)
 *  - ACCEPTED                        -> CHECKED (Tekshirildi)
 *  - RETURNED                        -> IN_PROGRESS (qayta ishlash)
 *  - SUBMITTED kech topshirilgan     -> LATE (Kechikdi)
 *  - SUBMITTED                       -> SUBMITTED (Topshirildi)
 */
export function homeworkViewStatus(
  hw: HomeworkLike,
  submission: SubmissionLike,
  now = new Date()
): HomeworkViewStatus {
  if (!submission) {
    if (now > hw.dueAt) return "MISSED";
    const soon = hw.dueAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
    return soon ? "IN_PROGRESS" : "NEW";
  }
  if (submission.status === "ACCEPTED") return "CHECKED";
  if (submission.status === "RETURNED") return "IN_PROGRESS";
  if (submission.submittedAt > hw.dueAt) return "LATE";
  return "SUBMITTED";
}
