"use server";

// Imtihonlar bo'yicha server amallari
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { clamp } from "@/lib/utils";
import { awardScore, getGamificationSettings } from "@/lib/gamification";
import { logActivity } from "@/lib/log";
import { actionOk, type ActionResult } from "@/lib/action-result";
import { MSGS } from "@/lib/toast-messages";

export async function createExam(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("TEACHER");

  const title = String(formData.get("title") ?? "").trim();
  const groupId = String(formData.get("groupId") ?? "");
  const dateRaw = String(formData.get("date") ?? "").trim();
  if (!title) return actionOk(MSGS.saved);

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group || group.teacherId !== session.id) return actionOk(MSGS.saved);

  const date = dateRaw ? new Date(dateRaw) : new Date();
  if (Number.isNaN(date.getTime())) return actionOk(MSGS.saved);

  const maxScoreRaw = Math.round(Number(String(formData.get("maxScore") ?? "").trim()));
  const maxScore = Number.isFinite(maxScoreRaw) ? clamp(maxScoreRaw, 1, 1000) : 100;

  await db.exam.create({ data: { groupId, title, date, maxScore } });
  await logActivity(session.id, "Imtihon yaratdi", `${group.name}: ${title}`);

  revalidatePath("/teacher/exams");
  revalidatePath("/teacher");
  return actionOk(MSGS.created(title));
}

export async function deleteExam(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("TEACHER");

  const id = String(formData.get("id") ?? "");
  const exam = await db.exam.findUnique({ where: { id }, include: { group: true } });
  if (!exam || exam.group.teacherId !== session.id) return actionOk(MSGS.deleted());

  await db.exam.delete({ where: { id: exam.id } });
  await logActivity(session.id, "Imtihonni o'chirdi", `${exam.group.name}: ${exam.title}`);

  revalidatePath("/teacher/exams");
  revalidatePath("/teacher");
  return actionOk(MSGS.deleted(exam.title));
}

/** Guruh o'quvchilarining imtihon natijalarini bitta formadan saqlaydi. */
export async function saveExamResults(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("TEACHER");

  const examId = String(formData.get("examId") ?? "");
  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: {
      group: { include: { students: { select: { studentId: true } } } },
      results: true,
    },
  });
  if (!exam || exam.group.teacherId !== session.id) return actionOk(MSGS.saved);

  const { exam: examRates } = await getGamificationSettings();
  const oldByStudent = new Map(exam.results.map((r) => [r.studentId, r]));

  for (const { studentId } of exam.group.students) {
    const raw = formData.get(`score_${studentId}`);
    if (raw === null) continue;

    const str = String(raw).trim();
    const old = oldByStudent.get(studentId);

    if (str === "") {
      if (old) {
        await db.examResult.delete({ where: { id: old.id } });
        const delta = -old.score;
        await awardScore(studentId, {
          xp: delta * examRates.xpRate,
          points: Math.round(delta * examRates.pointRate),
          reason: `Imtihon: ${exam.title}`,
          sourceType: "EXAM",
          sourceId: exam.id,
        });
      }
      continue;
    }

    const parsed = Math.round(Number(str));
    if (!Number.isFinite(parsed)) continue;
    const score = clamp(parsed, 0, exam.maxScore);

    await db.examResult.upsert({
      where: { examId_studentId: { examId: exam.id, studentId } },
      create: { examId: exam.id, studentId, score },
      update: { score },
    });

    const delta = score - (old?.score ?? 0);
    if (delta !== 0) {
      await awardScore(studentId, {
        xp: delta * examRates.xpRate,
        points: Math.round(delta * examRates.pointRate),
        reason: `Imtihon: ${exam.title}`,
        sourceType: "EXAM",
        sourceId: exam.id,
      });
    }
  }

  await logActivity(session.id, "Imtihon natijalarini kiritdi", exam.title);
  revalidatePath(`/teacher/exams/${exam.id}`);
  revalidatePath("/teacher/exams");
  revalidatePath("/teacher");
  return actionOk(MSGS.saved);
}
