"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import { GROUP_TYPES, type PermissionKey } from "@/lib/constants";
import { actionErr, actionOk, type ActionResult } from "@/lib/action-result";

async function guard(permission: PermissionKey) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, permission);
  return session;
}

function parseMonth(v: unknown): string | null {
  const s = String(v ?? "").trim();
  // "YYYY-MM"
  if (!/^\d{4}-\d{2}$/.test(s)) return null;
  const mm = Number(s.slice(5, 7));
  if (mm < 1 || mm > 12) return null;
  return s;
}

export async function upsertSubjectPrices(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  if (session.role !== "SUPER_ADMIN") {
    return actionErr("Fan narxlarini faqat Super Admin o'zgartira oladi");
  }

  const subjectId = String(formData.get("subjectId") ?? "");
  if (!subjectId) return actionErr("Fan topilmadi");

  const umumiyRaw = String(formData.get("fee_umumiy") ?? "").trim();
  const individualRaw = String(formData.get("fee_individual") ?? "").trim();
  const umumiy = Math.round(Number(umumiyRaw));
  const individual = Math.round(Number(individualRaw));
  if (!Number.isFinite(umumiy) || umumiy <= 0) return actionErr("Umumiy narxni to'g'ri kiriting");
  if (!Number.isFinite(individual) || individual <= 0) return actionErr("Individual narxni to'g'ri kiriting");

  // Guruh turlari matnlari bazada shu ko'rinishda saqlanadi (seed va UI ham shuni ishlatadi)
  const umumiyType = GROUP_TYPES.includes("Umumiy") ? "Umumiy" : GROUP_TYPES[0];
  const individualType = GROUP_TYPES.includes("Individual") ? "Individual" : "Individual";

  // Subject mavjudligini tekshirish
  const subject = await db.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return actionErr("Fan topilmadi");

  await db.$transaction([
    db.subjectPrice.upsert({
      where: { subjectId_groupType: { subjectId, groupType: umumiyType } },
      update: { monthlyFee: umumiy, active: true },
      create: { subjectId, groupType: umumiyType, monthlyFee: umumiy, active: true },
    }),
    db.subjectPrice.upsert({
      where: { subjectId_groupType: { subjectId, groupType: individualType } },
      update: { monthlyFee: individual, active: true },
      create: { subjectId, groupType: individualType, monthlyFee: individual, active: true },
    }),
  ]);

  await logActivity(session.id, "Fan narxlarini yangiladi", subject.name);
  revalidatePath("/admin/payments");
  return actionOk("Narxlar saqlandi");
}

export async function upsertStudentPayment(formData: FormData): Promise<ActionResult> {
  const session = await guard("payments.manage");

  const studentId = String(formData.get("studentId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const month = parseMonth(formData.get("month"));
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;

  const amount = Math.round(Number(amountRaw));
  if (!studentId || !groupId) return actionErr("Ma'lumotlar yetarli emas");
  if (!month) return actionErr("Oy formati noto'g'ri (YYYY-MM)");
  if (!Number.isFinite(amount) || amount < 0) return actionErr("Summani to'g'ri kiriting");

  const [student, group] = await Promise.all([
    db.user.findUnique({ where: { id: studentId }, select: { id: true, role: true, name: true, studentType: true } }),
    db.group.findUnique({ where: { id: groupId }, select: { id: true, name: true } }),
  ]);
  if (!student || student.role !== "STUDENT" || !group) return actionErr("Topilmadi");
  if (student.studentType === "Ijtimoiy" && amount > 0) {
    return actionErr("Ijtimoiy o'quvchi uchun to'lov kiritib bo'lmaydi");
  }

  await db.studentPayment.upsert({
    where: { studentId_groupId_month: { studentId, groupId, month } },
    update: { amount, note, recordedById: session.id, recordedAt: new Date() },
    create: { studentId, groupId, month, amount, note, recordedById: session.id },
  });

  await logActivity(session.id, "To'lov kiritdi", `${student.name} · ${group.name} · ${month} · ${amount}`);
  revalidatePath("/admin/payments");
  revalidatePath(`/admin/groups/${groupId}`);
  revalidatePath(`/admin/students/${studentId}`);
  return actionOk("To'lov saqlandi");
}

