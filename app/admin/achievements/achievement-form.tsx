// Yutuq yaratish/tahrirlash formasi
import { Field, inputCls, btn } from "@/components/ui";
import { ACHIEVEMENT_CODE_OPTIONS } from "@/lib/constants";
import { createAchievement, updateAchievement } from "./actions";

type AchievementData = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  pointsReward: number;
  active: boolean;
};

export function AchievementForm({
  achievement,
  usedCodes = [],
}: {
  achievement?: AchievementData;
  usedCodes?: string[];
}) {
  const isEdit = Boolean(achievement);
  const availableCodes = ACHIEVEMENT_CODE_OPTIONS.filter(
    (opt) => !usedCodes.includes(opt.code) || opt.code === achievement?.code
  );

  return (
    <form action={achievement ? updateAchievement : createAchievement} className="space-y-4">
      {achievement && <input type="hidden" name="id" value={achievement.id} />}

      <Field label="Kod" required>
        {isEdit ? (
          <>
            <input type="hidden" name="code" value={achievement!.code} />
            <select disabled className={inputCls} value={achievement!.code}>
              {ACHIEVEMENT_CODE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code} — {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Kod tahrirlashda o&apos;zgartirilmaydi</p>
          </>
        ) : availableCodes.length === 0 ? (
          <p className="text-sm text-amber-400">
            Barcha yutuq kodlari allaqachon qo&apos;shilgan. Yangi kod qo&apos;shish uchun avval mavjud
            yutuqni o&apos;chiring yoki faolsizlantiring.
          </p>
        ) : (
          <>
            <select name="code" required defaultValue="" className={inputCls}>
              <option value="" disabled>
                Yutuq turini tanlang
              </option>
              {availableCodes.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code} — {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Kod tizim tomonidan avtomatik beriladi — faqat ro&apos;yxatdan tanlang
            </p>
          </>
        )}
      </Field>

      <Field label="Nomi" required>
        <input
          name="name"
          required
          defaultValue={achievement?.name ?? ""}
          placeholder="Masalan: Olov seriyasi"
          className={inputCls}
        />
      </Field>
      <Field label="Tavsifi" required>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={achievement?.description ?? ""}
          placeholder="Yutuq shartini qisqacha yozing"
          className={inputCls}
        />
      </Field>
      <Field label="Ikonka (emoji)">
        <input
          name="icon"
          defaultValue={achievement?.icon ?? "🏆"}
          placeholder="🏆"
          className={inputCls}
          maxLength={8}
        />
        <p className="mt-1 text-xs text-slate-500">Masalan: 🔥, 🏆, ⭐</p>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="XP mukofoti">
          <input
            type="number"
            name="xpReward"
            min={0}
            defaultValue={achievement?.xpReward ?? 0}
            className={inputCls}
          />
        </Field>
        <Field label="Ball mukofoti">
          <input
            type="number"
            name="pointsReward"
            min={0}
            defaultValue={achievement?.pointsReward ?? 0}
            className={inputCls}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <input
          type="checkbox"
          name="active"
          defaultChecked={achievement?.active ?? true}
          className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
        />
        Faol (o'quvchilarga ko'rinadi va beriladi)
      </label>
      <div className="flex justify-end">
        <button
          type="submit"
          className={btn.primary}
          disabled={!isEdit && availableCodes.length === 0}
        >
          {achievement ? "Saqlash" : "Qo'shish"}
        </button>
      </div>
    </form>
  );
}
