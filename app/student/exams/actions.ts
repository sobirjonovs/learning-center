"use server";

// O'quvchining imtihon topshirish amallari
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";
import { logActivity } from "@/lib/log";

export type SubmitExamState = { error?: string };

/** Imtihonni topshirish yoki (RETURNED bo'lsa) qayta topshirish. */
export async function submitExam(
  _prev: SubmitExamState,
  formData: FormData
): Promise<SubmitExamState> {
  const session = await requireRole("STUDENT");
  const now = new Date();

  const examId = String(formData.get("examId") ?? "");
  const exam = await db.exam.findFirst({
    where: {
      id: examId,
      group: { students: { some: { studentId: session.id } } },
    },
  });
  if (!exam) return { error: "Imtihon topilmadi yoki sizga tegishli emas" };

  if (now < exam.startAt) return { error: "Imtihon hali boshlanmagan" };
  if (now > exam.endAt) return { error: "Imtihon vaqti tugagan" };

  const link = String(formData.get("link") ?? "").trim() || null;
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (!comment) return { error: "Batafsil javob yozishingiz kerak" };

  let fileUrl: string | null = null;
  try {
    fileUrl = await saveUpload(formData.get("file") as File | null, "exam-submissions");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Faylni yuklashda xatolik yuz berdi" };
  }

  if (!link && !fileUrl) {
    return { error: "Kamida havola yoki fayl biriktirishingiz kerak" };
  }

  const existing = await db.examResult.findUnique({
    where: { examId_studentId: { examId: exam.id, studentId: session.id } },
  });
  if (existing && existing.status === "ACCEPTED") {
    return { error: "Bu imtihon allaqachon tekshirilgan — qayta topshirib bo'lmaydi" };
  }

  await db.examResult.upsert({
    where: { examId_studentId: { examId: exam.id, studentId: session.id } },
    update: {
      link,
      fileUrl,
      comment,
      status: "SUBMITTED",
      submittedAt: new Date(),
      score: null,
      passed: null,
      feedback: null,
      gradedAt: null,
    },
    create: {
      examId: exam.id,
      studentId: session.id,
      link,
      fileUrl,
      comment,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  await logActivity(
    session.id,
    existing ? "Imtihonni qayta topshirdi" : "Imtihon topshirdi",
    exam.title
  );

  revalidatePath("/student");
  revalidatePath("/student/exams");
  revalidatePath(`/student/exams/${exam.id}`);
  return {};
}
