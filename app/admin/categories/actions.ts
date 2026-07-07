"use server";

// Fan kategoriyalari server amallari
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import { actionErr, actionOk, type ActionResult } from "@/lib/action-result";
import { redirectWithError, redirectWithToast } from "@/lib/redirect-toast";
import { MSGS } from "@/lib/toast-messages";

async function guard() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "categories.manage");
  return session;
}

function revalidateCategories() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/groups");
}

function readForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const active = formData.get("active") === "on";
  return { name, active };
}

export async function createCategory(formData: FormData) {
  const session = await guard();
  const { name, active } = readForm(formData);
  if (!name) redirectWithError("/admin/categories", "Kategoriya nomini kiriting");

  const existing = await db.subject.findUnique({ where: { name } });
  if (existing) redirectWithError("/admin/categories", "Bu nomdagi kategoriya allaqachon mavjud");

  const subject = await db.subject.create({ data: { name, active } });
  await logActivity(session.id, "Fan kategoriyasi yaratdi", subject.name);
  revalidateCategories();
  redirectWithToast("/admin/categories", MSGS.created(subject.name));
}

export async function updateCategory(formData: FormData) {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const subject = await db.subject.findUnique({ where: { id } });
  if (!subject) redirectWithToast("/admin/categories", MSGS.updated());

  const { name, active } = readForm(formData);
  if (!name) redirectWithError("/admin/categories", "Kategoriya nomini kiriting");

  const existing = await db.subject.findUnique({ where: { name } });
  if (existing && existing.id !== id) {
    redirectWithError("/admin/categories", "Bu nomdagi kategoriya allaqachon mavjud");
  }

  await db.subject.update({ where: { id }, data: { name, active } });
  await logActivity(session.id, "Fan kategoriyasini tahrirladi", name);
  revalidateCategories();
  redirectWithToast("/admin/categories", MSGS.updated(name));
}

export async function toggleCategory(formData: FormData): Promise<ActionResult> {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const subject = await db.subject.findUnique({ where: { id } });
  if (!subject) return actionOk(MSGS.saved);

  await db.subject.update({ where: { id }, data: { active: !subject.active } });
  await logActivity(
    session.id,
    subject.active ? "Fan kategoriyasini faolsizlantirdi" : "Fan kategoriyasini faollashtirdi",
    subject.name
  );
  revalidateCategories();
  return actionOk(
    subject.active ? MSGS.deactivated(subject.name) : MSGS.activated(subject.name)
  );
}

export async function deleteCategory(formData: FormData): Promise<ActionResult> {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const subject = await db.subject.findUnique({
    where: { id },
    include: { _count: { select: { teachers: true, groups: true } } },
  });
  if (!subject) return actionOk(MSGS.deleted());

  if (subject._count.teachers > 0 || subject._count.groups > 0) {
    return actionErr(
      "Kategoriya o'qituvchi yoki guruhga biriktirilgan — avval ularni o'zgartiring"
    );
  }

  await db.subject.delete({ where: { id } });
  await logActivity(session.id, "Fan kategoriyasini o'chirdi", subject.name);
  revalidateCategories();
  return actionOk(MSGS.deleted(subject.name));
}
