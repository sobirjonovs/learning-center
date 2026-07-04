"use server";

// Magazin: o'quvchi mahsulot sotib olishi
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { spendPoints } from "@/lib/gamification";
import { logActivity } from "@/lib/log";

export async function buyProduct(formData: FormData): Promise<void> {
  const session = await requireRole("STUDENT");

  const productId = String(formData.get("productId") ?? "");
  const product = await db.product.findUnique({ where: { id: productId } });

  if (!product || !product.active) {
    redirect(`/student/shop?xato=${encodeURIComponent("Mahsulot topilmadi yoki sotuvda emas")}`);
  }
  if (product.stock <= 0) {
    redirect(`/student/shop?xato=${encodeURIComponent("Afsuski, bu mahsulot tugagan")}`);
  }

  // Ball yechish — yetarli bo'lmasa xabarni foydalanuvchiga qaytaramiz
  let error: string | null = null;
  try {
    await spendPoints(session.id, product.price, `Xarid: ${product.name}`, product.id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Xarid amalga oshmadi";
  }
  if (error) {
    redirect(`/student/shop?xato=${encodeURIComponent(error)}`);
  }

  await db.purchase.create({
    data: {
      studentId: session.id,
      productId: product.id,
      points: product.price,
      status: "NEW",
    },
  });
  await db.product.update({
    where: { id: product.id },
    data: { stock: { decrement: 1 } },
  });

  await logActivity(session.id, "Mahsulot sotib oldi", `${product.name} — ${product.price} ball`);

  revalidatePath("/student/shop");
  revalidatePath("/student");
  redirect(`/student/shop?ok=${encodeURIComponent(product.name)}`);
}
