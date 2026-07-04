"use server";

// O'quvchining vazifa topshirish amallari
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";
import { logActivity } from "@/lib/log";

export type SubmitHomeworkState = { error?: string };

/** Vazifani topshirish yoki (RETURNED bo'lsa) qayta topshirish. */
export async function submitHomework(
  _prev: SubmitHomeworkState,
  formData: FormData
): Promise<SubmitHomeworkState> {
  const session = await requireRole("STUDENT");

  const homeworkId = String(formData.get("homeworkId") ?? "");
  // Egalikni qayta tekshirish: vazifa o'quvchining guruhiga tegishli bo'lishi shart
  const hw = await db.homework.findFirst({
    where: {
      id: homeworkId,
      group: { students: { some: { studentId: session.id } } },
    },
  });
  if (!hw) return { error: "Vazifa topilmadi yoki sizga tegishli emas" };

  const link = String(formData.get("link") ?? "").trim() || null;
  const comment = String(formData.get("comment") ?? "").trim() || null;

  let fileUrl: string | null = null;
  try {
    fileUrl = await saveUpload(formData.get("file") as File | null, "submissions");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Faylni yuklashda xatolik yuz berdi" };
  }

  if (!link && !fileUrl) {
    return { error: "Kamida havola yoki fayl biriktirishingiz kerak" };
  }

  const existing = await db.submission.findUnique({
    where: { homeworkId_studentId: { homeworkId: hw.id, studentId: session.id } },
  });
  if (existing && existing.status === "ACCEPTED") {
    return { error: "Bu vazifa allaqachon tekshirilgan — qayta topshirib bo'lmaydi" };
  }

  await db.submission.upsert({
    where: { homeworkId_studentId: { homeworkId: hw.id, studentId: session.id } },
    update: {
      link,
      fileUrl,
      comment,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    create: {
      homeworkId: hw.id,
      studentId: session.id,
      link,
      fileUrl,
      comment,
    },
  });

  await logActivity(
    session.id,
    existing ? "Vazifani qayta topshirdi" : "Vazifa topshirdi",
    hw.title
  );

  revalidatePath("/student");
  revalidatePath("/student/homework");
  revalidatePath(`/student/homework/${hw.id}`);
  return {};
}
