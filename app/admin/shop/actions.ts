"use server";

// Magazin: mahsulotlar va xaridlar bo'yicha server amallari
import { revalidatePath } from "next/cache";
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveImageFromForm } from "@/lib/uploads";
import { logActivity } from "@/lib/log";
import { awardScore } from "@/lib/gamification";
import { PURCHASE_STATUS } from "@/lib/constants";
import { actionOk, type ActionResult } from "@/lib/action-result";
import { MSGS } from "@/lib/toast-messages";

async function requireShopManager() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "shop.manage");
  return session;
}

function revalidateShop() {
  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/history");
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const session = await requireShopManager();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return actionOk(MSGS.saved);
  const description = String(formData.get("description") ?? "").trim() || null;
  const price = Math.max(0, Math.round(Number(formData.get("price") ?? 0)));
  const stock = Math.max(0, Math.round(Number(formData.get("stock") ?? 0)));
  const active = formData.get("active") === "on";
  const image = await resolveImageFromForm(formData, "products");

  const product = await db.product.create({
    data: { name, description, image, price, stock, active },
  });

  await logActivity(session.id, "Mahsulot qo'shdi", product.name);
  revalidateShop();
  return actionOk(MSGS.created(product.name));
}

export async function updateProduct(formData: FormData): Promise<ActionResult> {
  const session = await requireShopManager();

  const id = String(formData.get("id") ?? "");
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return actionOk(MSGS.updated());

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return actionOk(MSGS.saved);
  const description = String(formData.get("description") ?? "").trim() || null;
  const price = Math.max(0, Math.round(Number(formData.get("price") ?? 0)));
  const stock = Math.max(0, Math.round(Number(formData.get("stock") ?? 0)));
  const active = formData.get("active") === "on";
  const image = await resolveImageFromForm(formData, "products");

  await db.product.update({
    where: { id },
    data: { name, description, price, stock, active, ...(image ? { image } : {}) },
  });

  await logActivity(session.id, "Mahsulotni tahrirladi", name);
  revalidateShop();
  return actionOk(MSGS.updated(name));
}

export async function toggleProduct(formData: FormData): Promise<ActionResult> {
  const session = await requireShopManager();

  const id = String(formData.get("id") ?? "");
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return actionOk(MSGS.saved);

  await db.product.update({ where: { id }, data: { active: !product.active } });
  await logActivity(
    session.id,
    product.active ? "Mahsulotni faolsizlantirdi" : "Mahsulotni faollashtirdi",
    product.name
  );
  revalidateShop();
  return actionOk(
    product.active ? MSGS.deactivated(product.name) : MSGS.activated(product.name)
  );
}

export async function deleteProduct(formData: FormData): Promise<ActionResult> {
  const session = await requireShopManager();

  const id = String(formData.get("id") ?? "");
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return actionOk(MSGS.deleted());

  await db.product.delete({ where: { id } });
  await logActivity(session.id, "Mahsulotni o'chirdi", product.name);
  revalidateShop();
  return actionOk(MSGS.deleted(product.name));
}

/** Buyurtma holatini o'zgartirish. Bekor qilinsa — ball qaytariladi va ombor +1. */
export async function updatePurchaseStatus(formData: FormData): Promise<ActionResult> {
  const session = await requireShopManager();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!(status in PURCHASE_STATUS)) return actionOk(MSGS.saved);

  const purchase = await db.purchase.findUnique({
    where: { id },
    include: { product: true, student: true },
  });
  if (!purchase || purchase.status === status) return actionOk(MSGS.saved);
  if (purchase.status !== "NEW") return actionOk(MSGS.saved);

  await db.purchase.update({ where: { id }, data: { status } });

  if (status === "CANCELLED") {
    await awardScore(purchase.studentId, {
      points: purchase.points,
      reason: `Xarid bekor qilindi: ${purchase.product.name}`,
      sourceType: "PURCHASE",
      sourceId: purchase.id,
    });
    await db.product.update({
      where: { id: purchase.productId },
      data: { stock: { increment: 1 } },
    });
  }

  await logActivity(
    session.id,
    status === "DELIVERED" ? "Buyurtmani topshirdi" : "Buyurtmani bekor qildi",
    `${purchase.student.name} — ${purchase.product.name}`
  );
  revalidateShop();
  return actionOk(
    status === "DELIVERED"
      ? `"${purchase.product.name}" buyurtmasi topshirildi`
      : `"${purchase.product.name}" buyurtmasi bekor qilindi`
  );
}
