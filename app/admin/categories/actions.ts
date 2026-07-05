"use server";

// Fan kategoriyalari server amallari
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/log";

async function guard() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "categories.manage");
  return session;
}

function readForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const active = formData.get("active") === "on";
  return { name, active };
}

export async function createCategory(formData: FormData) {
  const session = await guard();
  const { name, active } = readForm(formData);
  if (!name) redirect("/admin/categories?error=required");

  const existing = await db.subject.findUnique({ where: { name } });
  if (existing) redirect("/admin/categories?error=duplicate");

  const subject = await db.subject.create({ data: { name, active } });
  await logActivity(session.id, "Fan kategoriyasi yaratdi", subject.name);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/groups");
  redirect("/admin/categories");
}

export async function updateCategory(formData: FormData) {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const subject = await db.subject.findUnique({ where: { id } });
  if (!subject) redirect("/admin/categories");

  const { name, active } = readForm(formData);
  if (!name) redirect("/admin/categories?error=required");

  const existing = await db.subject.findUnique({ where: { name } });
  if (existing && existing.id !== id) redirect("/admin/categories?error=duplicate");

  await db.subject.update({ where: { id }, data: { name, active } });
  await logActivity(session.id, "Fan kategoriyasini tahrirladi", name);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/groups");
  redirect("/admin/categories");
}

export async function toggleCategory(formData: FormData) {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const subject = await db.subject.findUnique({ where: { id } });
  if (!subject) return;

  await db.subject.update({ where: { id }, data: { active: !subject.active } });
  await logActivity(
    session.id,
    subject.active ? "Fan kategoriyasini faolsizlantirdi" : "Fan kategoriyasini faollashtirdi",
    subject.name
  );
  revalidatePath("/admin/categories");
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/groups");
}

export async function deleteCategory(formData: FormData) {
  const session = await guard();
  const id = String(formData.get("id") ?? "");
  const subject = await db.subject.findUnique({
    where: { id },
    include: { _count: { select: { teachers: true, groups: true } } },
  });
  if (!subject) return;

  if (subject._count.teachers > 0 || subject._count.groups > 0) {
    redirect("/admin/categories?error=in_use");
  }

  await db.subject.delete({ where: { id } });
  await logActivity(session.id, "Fan kategoriyasini o'chirdi", subject.name);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/groups");
  redirect("/admin/categories");
}
