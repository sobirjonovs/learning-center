import { db } from "./db";

/** Tizim faoliyatini yozib boradi; xatolar asosiy oqimni buzmaydi. */
export async function logActivity(
  userId: string | null,
  action: string,
  detail?: string
): Promise<void> {
  try {
    await db.activityLog.create({
      data: { userId: userId ?? undefined, action, detail },
    });
  } catch {
    // jurnal yozilmasa ham davom etamiz
  }
}
