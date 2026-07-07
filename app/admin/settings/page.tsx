// Ball sozlamalari — barcha gamifikatsiya stavkalari (faqat SUPER_ADMIN)
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getGamificationSettings } from "@/lib/gamification";
import { PageHeader, Card, CardTitle, Field, inputCls, btn } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { saveGamificationSettings } from "./actions";

export default async function SettingsPage() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  const s = await getGamificationSettings();
  const speedPercent = Math.round(s.quizScoring.speedBonusFraction * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Ball sozlamalari"
        subtitle="Platforma bo'ylab XP va magazin balli qanday berilishini boshqarish"
      />

      <ActionForm action={saveGamificationSettings} className="space-y-5">
        <Card>
          <CardTitle>Davomat</CardTitle>
          <p className="mb-4 text-sm text-slate-400">
            O&apos;qituvchi davomat belgilaganda beriladigan standart mukofot. Guruh bo&apos;yicha
            alohida o&apos;zgartirish mumkin.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Keldi — XP" required>
              <input
                type="number"
                name="attPresentXp"
                required
                min={0}
                max={10000}
                step={1}
                defaultValue={s.attendance.presentXp}
                className={inputCls}
              />
            </Field>
            <Field label="Keldi — magazin balli" required>
              <input
                type="number"
                name="attPresentPoints"
                required
                min={0}
                max={10000}
                step={1}
                defaultValue={s.attendance.presentPoints}
                className={inputCls}
              />
            </Field>
            <Field label="Kechikdi — XP" required>
              <input
                type="number"
                name="attLateXp"
                required
                min={0}
                max={10000}
                step={1}
                defaultValue={s.attendance.lateXp}
                className={inputCls}
              />
            </Field>
            <Field label="Kechikdi — magazin balli" required>
              <input
                type="number"
                name="attLatePoints"
                required
                min={0}
                max={10000}
                step={1}
                defaultValue={s.attendance.latePoints}
                className={inputCls}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle>Uyga vazifa</CardTitle>
          <p className="mb-4 text-sm text-slate-400">
            O&apos;qituvchi baholagan yakuniy ball asosida XP va magazin balli hisoblanadi.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="XP koeffitsiyenti" required>
              <input
                type="number"
                name="homeworkXpRate"
                required
                step={0.01}
                min={0}
                defaultValue={s.homework.xpRate}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-500">XP = yakuniy ball × koeffitsient</p>
            </Field>
            <Field label="Magazin balli koeffitsiyenti" required>
              <input
                type="number"
                name="homeworkPointRate"
                required
                step={0.01}
                min={0}
                defaultValue={s.homework.pointRate}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-500">Ball = yakuniy ball × koeffitsient</p>
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle>Imtihon</CardTitle>
          <p className="mb-4 text-sm text-slate-400">
            Imtihon natijasi asosida XP va magazin balli beriladi. 100% natija uchun bonus alohida.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="XP koeffitsiyenti" required>
              <input
                type="number"
                name="examXpRate"
                required
                step={0.01}
                min={0}
                defaultValue={s.exam.xpRate}
                className={inputCls}
              />
            </Field>
            <Field label="Magazin balli koeffitsiyenti" required>
              <input
                type="number"
                name="examPointRate"
                required
                step={0.01}
                min={0}
                defaultValue={s.exam.pointRate}
                className={inputCls}
              />
            </Field>
            <Field label="100% bonus balli" required>
              <input
                type="number"
                name="examPerfectBonus"
                required
                min={0}
                defaultValue={s.exam.perfectBonus}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-500">
                Imtihondan to&apos;liq ball olgan o&apos;quvchiga qo&apos;shimcha magazin balli
              </p>
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle>Quiz — reytingga qo&apos;shish</CardTitle>
          <p className="mb-4 text-sm text-slate-400">
            Jonli quiz yakunida olingan o&apos;yin balli reytingga aylantiriladi.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="XP koeffitsiyenti" required>
              <input
                type="number"
                name="quizXpRate"
                required
                step={0.001}
                min={0}
                defaultValue={s.quiz.xpRate}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-500">
                Masalan, 0.05 — 5000 o&apos;yin balli = 250 XP
              </p>
            </Field>
            <Field label="Magazin balli koeffitsiyenti" required>
              <input
                type="number"
                name="quizPointRate"
                required
                step={0.001}
                min={0}
                defaultValue={s.quiz.pointRate}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-500">
                Masalan, 0.015 — 5000 o&apos;yin balli = 75 magazin balli
              </p>
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle>Quiz — Kahoot jonli o&apos;yin</CardTitle>
          <p className="mb-4 text-sm text-slate-400">
            Jonli o&apos;yin davomida har bir savol uchun ball tizimi.
          </p>
          <div className="space-y-4">
            <Field label="Tezlik bonusi maksimumi (%)" required>
              <input
                type="number"
                name="quizSpeedBonusPercent"
                required
                step={1}
                min={0}
                max={100}
                defaultValue={speedPercent}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-500">
                Eng tez to&apos;g&apos;ri javob uchun asosiy ballning shu foizi qo&apos;shiladi.
              </p>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Streak bonusi (har qadam)" required>
                <input
                  type="number"
                  name="quizStreakBonusPerStep"
                  required
                  step={1}
                  min={0}
                  max={10000}
                  defaultValue={s.quizScoring.streakBonusPerStep}
                  className={inputCls}
                />
              </Field>
              <Field label="Streak bonusi maksimumi" required>
                <input
                  type="number"
                  name="quizStreakBonusMax"
                  required
                  step={1}
                  min={0}
                  max={100000}
                  defaultValue={s.quizScoring.streakBonusMax}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <button type="submit" className={btn.primary}>
            Barcha sozlamalarni saqlash
          </button>
        </div>
      </ActionForm>
    </div>
  );
}
