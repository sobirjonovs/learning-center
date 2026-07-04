"use server";

// Quiz Battle: o'qituvchi uchun server amallari
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";
import { logActivity } from "@/lib/log";
import { QUIZ_TYPES } from "@/lib/constants";
import { createGame } from "@/lib/quiz-live";

// ---------------- Yordamchilar ----------------

async function requireOwnQuiz(quizId: string) {
  const session = await requireRole("TEACHER");
  const quiz = await db.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.teacherId !== session.id) redirect("/teacher/quizzes");
  return { session, quiz };
}

function revalidateQuiz(quizId?: string) {
  revalidatePath("/teacher/quizzes");
  if (quizId) revalidatePath(`/teacher/quizzes/${quizId}`);
}

/** Formadan quiz meta maydonlarini o'qish */
async function readQuizFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const groupId = String(formData.get("groupId") ?? "").trim() || null;
  const typeRaw = String(formData.get("type") ?? "NORMAL");
  const type = typeRaw in QUIZ_TYPES ? typeRaw : "NORMAL";
  const timeLimitRaw = Number(formData.get("timeLimit"));
  const timeLimit =
    Number.isFinite(timeLimitRaw) && timeLimitRaw > 0 ? Math.round(timeLimitRaw) : null;
  const countsToRating = formData.get("countsToRating") === "on";
  const image = await saveUpload(formData.get("image") as File | null, "quizzes");
  return { name, description, subject, groupId, type, timeLimit, countsToRating, image };
}

/** Savol formasidan maydonlarni o'qish */
async function readQuestionFields(formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  const count = Math.min(4, Math.max(2, Math.round(Number(formData.get("variantCount") ?? 4))));
  const options: string[] = [];
  for (let i = 0; i < count; i++) {
    const v = String(formData.get(`option${i}`) ?? "").trim();
    if (v) options.push(v);
  }
  const correctIndexRaw = Math.round(Number(formData.get("correctIndex") ?? 0));
  const correctIndex = Math.min(Math.max(0, correctIndexRaw), options.length - 1);
  const timeSecondsRaw = Math.round(Number(formData.get("timeSeconds") ?? 20));
  const timeSeconds = Math.min(300, Math.max(5, Number.isFinite(timeSecondsRaw) ? timeSecondsRaw : 20));
  const pointsRaw = Math.round(Number(formData.get("points") ?? 500));
  const points = Math.min(10000, Math.max(10, Number.isFinite(pointsRaw) ? pointsRaw : 500));
  const image = await saveUpload(formData.get("image") as File | null, "quizzes");
  return { text, options, correctIndex, timeSeconds, points, image };
}

// ---------------- Quiz CRUD ----------------

export async function createQuiz(formData: FormData): Promise<void> {
  const session = await requireRole("TEACHER");
  const fields = await readQuizFields(formData);
  if (!fields.name) return;

  // Guruh faqat o'qituvchining o'ziniki bo'lishi mumkin
  if (fields.groupId) {
    const group = await db.group.findUnique({ where: { id: fields.groupId } });
    if (!group || group.teacherId !== session.id) fields.groupId = null;
  }

  const quiz = await db.quiz.create({
    data: { ...fields, teacherId: session.id },
  });

  await logActivity(session.id, "Quiz yaratdi", quiz.name);
  revalidateQuiz(quiz.id);
  redirect(`/teacher/quizzes/${quiz.id}`);
}

export async function updateQuiz(formData: FormData): Promise<void> {
  const quizId = String(formData.get("id") ?? "");
  const { session } = await requireOwnQuiz(quizId);

  const fields = await readQuizFields(formData);
  if (!fields.name) return;

  if (fields.groupId) {
    const group = await db.group.findUnique({ where: { id: fields.groupId } });
    if (!group || group.teacherId !== session.id) fields.groupId = null;
  }

  const { image, ...rest } = fields;
  await db.quiz.update({
    where: { id: quizId },
    data: { ...rest, ...(image ? { image } : {}) },
  });

  await logActivity(session.id, "Quizni tahrirladi", fields.name);
  revalidateQuiz(quizId);
  redirect(`/teacher/quizzes/${quizId}`);
}

export async function deleteQuiz(formData: FormData): Promise<void> {
  const quizId = String(formData.get("id") ?? "");
  const { session, quiz } = await requireOwnQuiz(quizId);

  await db.quiz.delete({ where: { id: quizId } });
  await logActivity(session.id, "Quizni o'chirdi", quiz.name);
  revalidateQuiz();
}

// ---------------- Savollar ----------------

export async function addQuestion(formData: FormData): Promise<void> {
  const quizId = String(formData.get("quizId") ?? "");
  await requireOwnQuiz(quizId);

  const fields = await readQuestionFields(formData);
  if (!fields.text || fields.options.length < 2) return;

  const last = await db.quizQuestion.findFirst({
    where: { quizId },
    orderBy: { order: "desc" },
  });

  await db.quizQuestion.create({
    data: {
      quizId,
      order: (last?.order ?? -1) + 1,
      text: fields.text,
      image: fields.image,
      options: JSON.stringify(fields.options),
      correctIndex: fields.correctIndex,
      timeSeconds: fields.timeSeconds,
      points: fields.points,
    },
  });

  revalidateQuiz(quizId);
}

export async function updateQuestion(formData: FormData): Promise<void> {
  const questionId = String(formData.get("questionId") ?? "");
  const question = await db.quizQuestion.findUnique({ where: { id: questionId } });
  if (!question) return;
  await requireOwnQuiz(question.quizId);

  const fields = await readQuestionFields(formData);
  if (!fields.text || fields.options.length < 2) return;

  await db.quizQuestion.update({
    where: { id: questionId },
    data: {
      text: fields.text,
      options: JSON.stringify(fields.options),
      correctIndex: fields.correctIndex,
      timeSeconds: fields.timeSeconds,
      points: fields.points,
      ...(fields.image ? { image: fields.image } : {}),
    },
  });

  revalidateQuiz(question.quizId);
}

export async function deleteQuestion(formData: FormData): Promise<void> {
  const questionId = String(formData.get("questionId") ?? "");
  const question = await db.quizQuestion.findUnique({ where: { id: questionId } });
  if (!question) return;
  await requireOwnQuiz(question.quizId);

  await db.quizQuestion.delete({ where: { id: questionId } });

  // Tartib raqamlarini qayta joylash
  const rest = await db.quizQuestion.findMany({
    where: { quizId: question.quizId },
    orderBy: { order: "asc" },
  });
  await db.$transaction(
    rest.map((q, i) => db.quizQuestion.update({ where: { id: q.id }, data: { order: i } }))
  );

  revalidateQuiz(question.quizId);
}

export async function moveQuestion(formData: FormData): Promise<void> {
  const questionId = String(formData.get("questionId") ?? "");
  const dir = String(formData.get("dir") ?? "") === "up" ? -1 : 1;
  const question = await db.quizQuestion.findUnique({ where: { id: questionId } });
  if (!question) return;
  await requireOwnQuiz(question.quizId);

  const all = await db.quizQuestion.findMany({
    where: { quizId: question.quizId },
    orderBy: { order: "asc" },
  });
  const idx = all.findIndex((q) => q.id === questionId);
  const swapWith = all[idx + dir];
  if (!swapWith) return;

  await db.$transaction([
    db.quizQuestion.update({ where: { id: question.id }, data: { order: swapWith.order } }),
    db.quizQuestion.update({ where: { id: swapWith.id }, data: { order: question.order } }),
  ]);

  revalidateQuiz(question.quizId);
}

// ---------------- Jonli o'yin ----------------

/** Jonli o'yin ochib, host ekraniga yo'naltiradi. */
export async function startLiveGame(formData: FormData): Promise<void> {
  const quizId = String(formData.get("quizId") ?? "");
  const { session } = await requireOwnQuiz(quizId);

  const questionCount = await db.quizQuestion.count({ where: { quizId } });
  if (questionCount === 0) redirect(`/teacher/quizzes/${quizId}?error=no-questions`);

  const pin = await createGame(quizId, session.id);
  redirect(`/teacher/quizzes/${quizId}/host?pin=${pin}`);
}
