"use server";

// Imtihonlar bo'yicha server amallari
import { revalidatePath } from "next/cache";
import { redirectWithToast } from "@/lib/redirect-toast";
import { actionOk, type ActionResult } from "@/lib/action-result";
import { MSGS } from "@/lib/toast-messages";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { clamp } from "@/lib/utils";
import { saveUpload, resolveImageFromForm } from "@/lib/uploads";
import { logActivity } from "@/lib/log";
import { awardForExam } from "@/lib/gamification";
import { examPassed } from "@/lib/exam";

export type GradeExamState = { success?: string; error?: string };

function parseIntField(v: FormDataEntryValue | null, fallback: number, min: number, max: number): number {
  const n = Math.round(Number(String(v ?? "").trim()));
  return Number.isFinite(n) ? clamp(n, min, max) : fallback;
}

function parseDateField(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function ownGroup(teacherId: string, groupId: string) {
  const group = await db.group.findUnique({ where: { id: groupId } });
  return group && group.teacherId === teacherId ? group : null;
}

function readExamForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const groupId = String(formData.get("groupId") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const startAt = parseDateField(formData.get("startAt")) ?? new Date();
  const endAt = parseDateField(formData.get("endAt"));
  const minScore = parseIntField(formData.get("minScore"), 0, 0, 1000);
  const maxScore = parseIntField(formData.get("maxScore"), 100, 1, 1000);
  const passPercent = parseIntField(formData.get("passPercent"), 60, 1, 100);
  const link = String(formData.get("link") ?? "").trim() || null;
  return {
    title,
    groupId,
    description,
    startAt,
    endAt,
    minScore: Math.min(minScore, maxScore),
    maxScore,
    passPercent,
    link,
  };
}

export async function createExam(formData: FormData): Promise<void> {
  const session = await requireRole("TEACHER");
  const f = readExamForm(formData);
  if (!f.title || !f.endAt) return;

  const group = await ownGroup(session.id, f.groupId);
  if (!group) return;

  const fileUrl = await saveUpload(formData.get("file") as File | null, "exams");
  const imageUrl = await resolveImageFromForm(formData, "exams");

  const exam = await db.exam.create({
    data: {
      groupId: f.groupId,
      title: f.title,
      description: f.description,
      startAt: f.startAt,
      endAt: f.endAt,
      minScore: f.minScore,
      maxScore: f.maxScore,
      passPercent: f.passPercent,
      fileUrl,
      link: f.link,
      imageUrl,
    },
  });

  await logActivity(session.id, "Imtihon yaratdi", `${group.name}: ${exam.title}`);
  revalidatePath("/teacher/exams");
  revalidatePath("/teacher");
  redirectWithToast("/teacher/exams", MSGS.created(exam.title));
}

export async function updateExam(formData: FormData): Promise<void> {
  const session = await requireRole("TEACHER");
  const id = String(formData.get("id") ?? "");
  const exam = await db.exam.findUnique({ where: { id }, include: { group: true } });
  if (!exam || exam.group.teacherId !== session.id) return;

  const f = readExamForm(formData);
  if (!f.title || !f.endAt) return;

  const group = await ownGroup(session.id, f.groupId);
  if (!group) return;

  const newFile = await saveUpload(formData.get("file") as File | null, "exams");
  const newImage = await resolveImageFromForm(formData, "exams");

  await db.exam.update({
    where: { id: exam.id },
    data: {
      groupId: f.groupId,
      title: f.title,
      description: f.description,
      startAt: f.startAt,
      endAt: f.endAt,
      minScore: f.minScore,
      maxScore: f.maxScore,
      passPercent: f.passPercent,
      link: f.link,
      ...(newFile ? { fileUrl: newFile } : {}),
      ...(newImage ? { imageUrl: newImage } : {}),
    },
  });

  await logActivity(session.id, "Imtihonni tahrirladi", `${group.name}: ${f.title}`);
  revalidatePath("/teacher/exams");
  revalidatePath(`/teacher/exams/${exam.id}`);
  revalidatePath("/teacher");
  redirectWithToast("/teacher/exams", MSGS.updated(f.title));
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

/** Imtihon topshirig'ini baholash: ACCEPT — tasdiqlash, RETURN — qayta ishlash. */
export async function gradeExamResult(
  _prev: GradeExamState,
  formData: FormData
): Promise<GradeExamState> {
  const session = await requireRole("TEACHER");

  const resultId = String(formData.get("resultId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim() || null;

  const result = await db.examResult.findUnique({
    where: { id: resultId },
    include: {
      exam: { include: { group: true } },
      student: { select: { name: true } },
    },
  });
  if (!result || result.exam.group.teacherId !== session.id) {
    return { error: "Topshiriq topilmadi yoki ruxsat yo'q" };
  }

  const exam = result.exam;
  const previousScore = result.status === "ACCEPTED" && result.score !== null ? result.score : null;
  const previousPassed = result.status === "ACCEPTED" ? Boolean(result.passed) : false;
  const hadPerfectBonus =
    previousScore !== null && previousScore >= exam.maxScore && exam.maxScore > 0;

  try {
    if (decision === "RETURN") {
      await db.examResult.update({
        where: { id: result.id },
        data: {
          status: "RETURNED",
          feedback,
          score: null,
          passed: null,
          gradedAt: new Date(),
        },
      });
      if (previousScore !== null) {
        await awardForExam(result.studentId, 0, previousScore, exam.title, result.id, {
          isPerfect: false,
          hadPerfectBonus,
          passed: false,
          previousPassed,
        });
      }
      await logActivity(
        session.id,
        "Imtihonni qayta ishlashga yubordi",
        `${exam.title} — ${result.student.name}`
      );
      revalidatePath(`/teacher/exams/${exam.id}`);
      revalidatePath("/teacher/exams");
      revalidatePath("/student/exams");
      revalidatePath("/student");
      return { success: `${result.student.name} imtihoni qayta ishlashga yuborildi` };
    }

    if (decision === "ACCEPT") {
      const raw = String(formData.get("score") ?? "").trim();
      if (raw === "") return { error: "Ball kiritilmagan" };
      const parsed = Math.round(Number(raw));
      if (!Number.isFinite(parsed)) return { error: "Ball noto'g'ri kiritilgan" };
      const score = clamp(parsed, exam.minScore, exam.maxScore);
      const passed = examPassed(score, exam.maxScore, exam.passPercent);
      const isPerfect = score >= exam.maxScore;

      await db.examResult.update({
        where: { id: result.id },
        data: {
          status: "ACCEPTED",
          score,
          passed,
          feedback,
          gradedAt: new Date(),
        },
      });
      await awardForExam(result.studentId, score, previousScore, exam.title, result.id, {
        isPerfect,
        hadPerfectBonus,
        passed,
        previousPassed,
      });
      await logActivity(
        session.id,
        "Imtihonni baholadi",
        `${exam.title} — ${result.student.name}: ${score} ball (${passed ? "o'tdi" : "yiqildi"})`
      );
      revalidatePath(`/teacher/exams/${exam.id}`);
      revalidatePath("/teacher/exams");
      revalidatePath("/student/exams");
      revalidatePath(`/student/exams/${exam.id}`);
      revalidatePath("/student");
      return {
        success: `${result.student.name}: ${score}/${exam.maxScore} — ${passed ? "O'tdi" : "Yiqildi"}`,
      };
    }

    return { error: "Noto'g'ri amal tanlandi" };
  } catch {
    return { error: "Baholashda xatolik yuz berdi. Qayta urinib ko'ring." };
  }
}
