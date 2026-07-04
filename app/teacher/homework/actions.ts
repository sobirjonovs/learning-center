"use server";

// Uyga vazifalar bo'yicha server amallari
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { clamp } from "@/lib/utils";
import { saveUpload } from "@/lib/uploads";
import { logActivity } from "@/lib/log";
import { awardForHomework, computeHomeworkScore } from "@/lib/gamification";

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

/** Guruh shu o'qituvchiniki ekanini tekshiradi. */
async function ownGroup(teacherId: string, groupId: string) {
  const group = await db.group.findUnique({ where: { id: groupId } });
  return group && group.teacherId === teacherId ? group : null;
}

export async function createHomework(formData: FormData): Promise<void> {
  const session = await requireRole("TEACHER");

  const title = String(formData.get("title") ?? "").trim();
  const groupId = String(formData.get("groupId") ?? "");
  const dueAt = parseDateField(formData.get("dueAt"));
  if (!title || !dueAt) return;

  const group = await ownGroup(session.id, groupId);
  if (!group) return;

  const startAt = parseDateField(formData.get("startAt")) ?? new Date();
  const description = String(formData.get("description") ?? "").trim() || null;
  const maxScore = parseIntField(formData.get("maxScore"), 100, 1, 1000);
  const earlyBonus = parseIntField(formData.get("earlyBonus"), 0, 0, 1000);
  const latePenalty = parseIntField(formData.get("latePenalty"), 0, 0, 1000);
  const link = String(formData.get("link") ?? "").trim() || null;
  const fileUrl = await saveUpload(formData.get("file") as File | null, "homework");

  const hw = await db.homework.create({
    data: {
      groupId,
      teacherId: session.id,
      title,
      description,
      startAt,
      dueAt,
      maxScore,
      earlyBonus,
      latePenalty,
      fileUrl,
      link,
    },
  });

  await logActivity(session.id, "Uyga vazifa yaratdi", `${group.name}: ${hw.title}`);
  revalidatePath("/teacher/homework");
  revalidatePath("/teacher");
  redirect("/teacher/homework");
}

export async function updateHomework(formData: FormData): Promise<void> {
  const session = await requireRole("TEACHER");

  const id = String(formData.get("id") ?? "");
  const hw = await db.homework.findUnique({ where: { id }, include: { group: true } });
  if (!hw || hw.group.teacherId !== session.id) return;

  const title = String(formData.get("title") ?? "").trim();
  const groupId = String(formData.get("groupId") ?? "");
  const dueAt = parseDateField(formData.get("dueAt"));
  if (!title || !dueAt) return;

  const group = await ownGroup(session.id, groupId);
  if (!group) return;

  const startAt = parseDateField(formData.get("startAt")) ?? hw.startAt;
  const description = String(formData.get("description") ?? "").trim() || null;
  const maxScore = parseIntField(formData.get("maxScore"), hw.maxScore, 1, 1000);
  const earlyBonus = parseIntField(formData.get("earlyBonus"), hw.earlyBonus, 0, 1000);
  const latePenalty = parseIntField(formData.get("latePenalty"), hw.latePenalty, 0, 1000);
  const link = String(formData.get("link") ?? "").trim() || null;
  const newFile = await saveUpload(formData.get("file") as File | null, "homework");

  await db.homework.update({
    where: { id: hw.id },
    data: {
      groupId,
      title,
      description,
      startAt,
      dueAt,
      maxScore,
      earlyBonus,
      latePenalty,
      link,
      ...(newFile ? { fileUrl: newFile } : {}),
    },
  });

  await logActivity(session.id, "Uyga vazifani tahrirladi", `${group.name}: ${title}`);
  revalidatePath("/teacher/homework");
  revalidatePath(`/teacher/homework/${hw.id}`);
  revalidatePath("/teacher");
  redirect("/teacher/homework");
}

export async function deleteHomework(formData: FormData): Promise<void> {
  const session = await requireRole("TEACHER");

  const id = String(formData.get("id") ?? "");
  const hw = await db.homework.findUnique({ where: { id }, include: { group: true } });
  if (!hw || hw.group.teacherId !== session.id) return;

  await db.homework.delete({ where: { id: hw.id } });
  await logActivity(session.id, "Uyga vazifani o'chirdi", `${hw.group.name}: ${hw.title}`);
  revalidatePath("/teacher/homework");
  revalidatePath("/teacher");
}

/** Topshiriqni baholash: "ACCEPT" — qabul qilish, "RETURN" — qayta ishlashga yuborish. */
export async function gradeSubmission(formData: FormData): Promise<void> {
  const session = await requireRole("TEACHER");

  const submissionId = String(formData.get("submissionId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim() || null;

  const sub = await db.submission.findUnique({
    where: { id: submissionId },
    include: { homework: { include: { group: true } }, student: { select: { name: true } } },
  });
  if (!sub || sub.homework.group.teacherId !== session.id) return;

  const hw = sub.homework;
  const previousScore = sub.status === "ACCEPTED" && sub.score !== null ? sub.score : null;

  if (decision === "RETURN") {
    await db.submission.update({
      where: { id: sub.id },
      data: { status: "RETURNED", feedback, score: null, bonus: 0, penalty: 0, gradedAt: new Date() },
    });
    // Avval qabul qilingan bo'lsa, berilgan ballarni qaytarib olamiz
    if (previousScore !== null) {
      await awardForHomework(sub.studentId, 0, previousScore, hw.title, sub.id);
    }
    await logActivity(session.id, "Vazifani qayta ishlashga yubordi", `${hw.title} — ${sub.student.name}`);
  } else if (decision === "ACCEPT") {
    const raw = String(formData.get("base") ?? "").trim();
    if (raw === "") return;
    const parsed = Math.round(Number(raw));
    if (!Number.isFinite(parsed)) return;
    const base = clamp(parsed, 0, hw.maxScore);

    const compute = computeHomeworkScore(base, hw.dueAt, sub.submittedAt, hw.earlyBonus, hw.latePenalty);
    await db.submission.update({
      where: { id: sub.id },
      data: {
        status: "ACCEPTED",
        baseScore: base,
        bonus: compute.bonus,
        penalty: compute.penalty,
        score: compute.final,
        feedback,
        gradedAt: new Date(),
      },
    });
    await awardForHomework(sub.studentId, compute.final, previousScore, hw.title, sub.id);
    await logActivity(session.id, "Vazifani baholadi", `${hw.title} — ${sub.student.name}: ${compute.final} ball`);
  } else {
    return;
  }

  revalidatePath(`/teacher/homework/${hw.id}`);
  revalidatePath("/teacher/homework");
  revalidatePath("/teacher");
}
