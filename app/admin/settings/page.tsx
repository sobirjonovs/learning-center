// Sozlamalar — gamifikatsiya koeffitsiyentlari (faqat SUPER_ADMIN)
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { RATES, SETTING_KEYS } from "@/lib/constants";
import { PageHeader, Card, CardTitle, Field, inputCls, btn } from "@/components/ui";
import { saveGamificationSettings } from "./actions";

export default async function SettingsPage() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  const settings = await db.setting.findMany({
    where: { key: { in: [SETTING_KEYS.quizXpRate, SETTING_KEYS.quizPointRate] } },
  });
  const map = new Map(settings.map((s) => [s.key, s.value]));
  const quizXpRate = map.get(SETTING_KEYS.quizXpRate) ?? String(RATES.quizXp);
  const quizPointRate = map.get(SETTING_KEYS.quizPointRate) ?? String(RATES.quizPoints);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Sozlamalar"
        subtitle="Gamifikatsiya koeffitsiyentlarini boshqarish"
      />

      <div className="space-y-5">
        <Card>
          <CardTitle>Gamifikatsiya sozlamalari</CardTitle>
          <form action={saveGamificationSettings} className="space-y-4">
            <Field label="Quiz XP koeffitsiyenti" required>
              <input
                type="number"
                name="quizXpRate"
                required
                step={0.001}
                min={0}
                defaultValue={quizXpRate}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-400">
                Quiz ballini XP ga aylantirish koeffitsiyenti. Masalan, 0.05 bo&apos;lsa — 5000
                quiz balli 250 XP beradi.
              </p>
            </Field>
            <Field label="Quiz ball koeffitsiyenti" required>
              <input
                type="number"
                name="quizPointRate"
                required
                step={0.001}
                min={0}
                defaultValue={quizPointRate}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-400">
                Quiz ballini magazin balliga aylantirish koeffitsiyenti. Masalan, 0.015
                bo&apos;lsa — 5000 quiz balli 75 magazin balli beradi.
              </p>
            </Field>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button type="submit" className={btn.primary}>
                Saqlash
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <CardTitle>O&apos;zgarmas stavkalar (ma&apos;lumot uchun)</CardTitle>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5">
              <span>Uyga vazifa — XP</span>
              <span className="font-semibold text-slate-800">
                yakuniy ball × {RATES.homeworkXp}
              </span>
            </li>
            <li className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5">
              <span>Uyga vazifa — magazin balli</span>
              <span className="font-semibold text-slate-800">
                yakuniy ball × {RATES.homeworkPoints}
              </span>
            </li>
            <li className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5">
              <span>Imtihon — XP</span>
              <span className="font-semibold text-slate-800">natija × {RATES.examXp}</span>
            </li>
            <li className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5">
              <span>Imtihon — magazin balli</span>
              <span className="font-semibold text-slate-800">natija × {RATES.examPoints}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            Bu stavkalar kodda belgilangan bo&apos;lib, faqat quiz koeffitsiyentlari yuqoridagi
            forma orqali o&apos;zgartiriladi.
          </p>
        </Card>
      </div>
    </div>
  );
}
