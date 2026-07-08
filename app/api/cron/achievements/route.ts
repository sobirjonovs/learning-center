import { NextRequest, NextResponse } from "next/server";
import { processScheduledAchievements } from "@/lib/achievement-scheduler";

/** Toshkent 00:00 da ishlaydigan rejalashtirilgan yutuqlar (haftalik TOP 3, oy chempioni). */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET sozlanmagan" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const result = await processScheduledAchievements();
  return NextResponse.json({ ok: true, result });
}
