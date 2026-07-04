"use server";

// Magazin: mahsulotlar va xaridlar bo'yicha server amallari
import { revalidatePath } from "next/cache";
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";
import { logActivity } from "@/lib/log";
import { awardScore } from "@/lib/gamification";
import { PURCHASE_STATUS } from "@/lib/constants";

async function requireShopManager() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "shop.manage");
  return session;
}

function revalidateShop() {
  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/history");
}

export async function createProduct(formData: FormData): Promise<void> {
  const session = await requireShopManager();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const description = String(formData.get("description") ?? "").trim() || null;
  const price = Math.max(0, Math.round(Number(formData.get("price") ?? 0)));
  const stock = Math.max(0, Math.round(Number(formData.get("stock") ?? 0)));
  const active = formData.get("active") === "on";
  const image = await saveUpload(formData.get("image") as File | null, "products");

  const product = await db.product.create({
    data: { name, description, image, price, stock, active },
  });

  await logActivity(session.id, "Mahsulot qo'shdi", product.name);
  revalidateShop();
}

export async function updateProduct(formData: FormData): Promise<void> {
  const session = await requireShopManager();

  const id = String(formData.get("id") ?? "");
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const description = String(formData.get("description") ?? "").trim() || null;
  const price = Math.max(0, Math.round(Number(formData.get("price") ?? 0)));
  const stock = Math.max(0, Math.round(Number(formData.get("stock") ?? 0)));
  const active = formData.get("active") === "on";
  const image = await saveUpload(formData.get("image") as File | null, "products");

  await db.product.update({
    where: { id },
    data: { name, description, price, stock, active, ...(image ? { image } : {}) },
  });

  await logActivity(session.id, "Mahsulotni tahrirladi", name);
  revalidateShop();
}

export async function toggleProduct(formData: FormData): Promise<void> {
  const session = await requireShopManager();

  const id = String(formData.get("id") ?? "");
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return;

  await db.product.update({ where: { id }, data: { active: !product.active } });
  await logActivity(
    session.id,
    product.active ? "Mahsulotni faolsizlantirdi" : "Mahsulotni faollashtirdi",
    product.name
  );
  revalidateShop();
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const session = await requireShopManager();

  const id = String(formData.get("id") ?? "");
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return;

  await db.product.delete({ where: { id } });
  await logActivity(session.id, "Mahsulotni o'chirdi", product.name);
  revalidateShop();
}

/** Buyurtma holatini o'zgartirish. Bekor qilinsa — ball qaytariladi va ombor +1. */
export async function updatePurchaseStatus(formData: FormData): Promise<void> {
  const session = await requireShopManager();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!(status in PURCHASE_STATUS)) return;

  const purchase = await db.purchase.findUnique({
    where: { id },
    include: { product: true, student: true },
  });
  if (!purchase || purchase.status === status) return;
  // Yakuniy holatdagi buyurtmani qayta o'zgartirmaymiz
  if (purchase.status !== "NEW") return;

  await db.purchase.update({ where: { id }, data: { status } });

  if (status === "CANCELLED") {
    // Ballni qaytarish va omborni tiklash
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
}
