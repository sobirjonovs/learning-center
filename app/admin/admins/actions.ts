"use server";

// Administratorlar bo'yicha server amallari (faqat SUPER_ADMIN)
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/log";
import { PERMISSIONS } from "@/lib/constants";

async function requireSuperAdmin() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");
  return session;
}

const VALID_PERMISSION_KEYS = new Set<string>(PERMISSIONS.map((p) => p.key));

function readPermissions(formData: FormData): string {
  const keys = formData
    .getAll("permissions")
    .map(String)
    .filter((k) => VALID_PERMISSION_KEYS.has(k));
  return JSON.stringify([...new Set(keys)]);
}

export async function createAdmin(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const active = formData.get("active") === "on";
  if (!name || !login || !password) return;

  const existing = await db.user.findUnique({ where: { login } });
  if (existing) redirect("/admin/admins/new?error=login");

  await db.user.create({
    data: {
      role: "ADMIN",
      name,
      login,
      password: await bcrypt.hash(password, 10),
      phone,
      active,
      permissions: readPermissions(formData),
    },
  });

  await logActivity(session.id, "Administrator qo'shdi", name);
  revalidatePath("/admin/admins");
  redirect("/admin/admins");
}

export async function updateAdmin(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();

  const id = String(formData.get("id") ?? "");
  const admin = await db.user.findUnique({ where: { id } });
  if (!admin || admin.role !== "ADMIN") return;

  const name = String(formData.get("name") ?? "").trim();
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const active = formData.get("active") === "on";
  if (!name || !login) return;

  const existing = await db.user.findUnique({ where: { login } });
  if (existing && existing.id !== id) {
    redirect(`/admin/admins/${id}/edit?error=login`);
  }

  await db.user.update({
    where: { id },
    data: {
      name,
      login,
      phone,
      active,
      permissions: readPermissions(formData),
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    },
  });

  await logActivity(session.id, "Administratorni tahrirladi", name);
  revalidatePath("/admin/admins");
  redirect("/admin/admins");
}

export async function toggleAdmin(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();

  const id = String(formData.get("id") ?? "");
  const admin = await db.user.findUnique({ where: { id } });
  if (!admin || admin.role !== "ADMIN") return;

  await db.user.update({ where: { id }, data: { active: !admin.active } });
  await logActivity(
    session.id,
    admin.active ? "Administratorni faolsizlantirdi" : "Administratorni faollashtirdi",
    admin.name
  );
  revalidatePath("/admin/admins");
}

export async function deleteAdmin(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();

  const id = String(formData.get("id") ?? "");
  const admin = await db.user.findUnique({ where: { id } });
  if (!admin || admin.role !== "ADMIN") return;

  await db.user.delete({ where: { id } });
  await logActivity(session.id, "Administratorni o'chirdi", admin.name);
  revalidatePath("/admin/admins");
}
