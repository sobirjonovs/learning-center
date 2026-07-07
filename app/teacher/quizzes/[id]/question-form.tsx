"use client";

// Savol qo'shish/tahrirlash formasi — variantlar soni dinamik (2/3/4)
import { useState } from "react";
import { Field, inputCls, btn } from "@/components/ui";
import { ImageInput } from "@/components/image-input";
import { ActionForm } from "@/components/action-form";
import type { ActionResult } from "@/lib/action-result";
import { ANSWER_SHAPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type QuestionFormData = {
  id: string;
  text: string;
  image: string | null;
  options: string[];
  correctIndex: number;
  timeSeconds: number;
  points: number;
  penaltyOnWrong: boolean;
};

export function QuestionForm({
  quizId,
  question,
  action,
  submitLabel,
  speedBonusPercent = 50,
  streakBonusPerStep = 100,
  streakBonusMax = 500,
}: {
  quizId: string;
  question?: QuestionFormData;
  action: (formData: FormData) => Promise<ActionResult | void>;
  submitLabel: string;
  speedBonusPercent?: number;
  streakBonusPerStep?: number;
  streakBonusMax?: number;
}) {
  const [count, setCount] = useState<number>(
    Math.min(4, Math.max(2, question?.options.length ?? 4))
  );
  const [correct, setCorrect] = useState<number>(question?.correctIndex ?? 0);

  const changeCount = (n: number) => {
    setCount(n);
    if (correct >= n) setCorrect(0);
  };

  return (
    <ActionForm action={action} className="space-y-4">
      {question ? (
        <input type="hidden" name="questionId" value={question.id} />
      ) : (
        <input type="hidden" name="quizId" value={quizId} />
      )}
      <input type="hidden" name="variantCount" value={count} />
      <input type="hidden" name="correctIndex" value={correct} />

      <Field label="Savol matni" required>
        <textarea
          name="text"
          required
          rows={2}
          defaultValue={question?.text ?? ""}
          placeholder="Savolni yozing..."
          className={inputCls}
        />
      </Field>

      <Field label="Savol rasmi">
        <ImageInput currentImage={question?.image} />
      </Field>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-200">
            Variantlar <span className="text-rose-500">*</span>
          </span>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => changeCount(n)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition",
                  count === n ? "bg-brand-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-500 hover:text-slate-100"
                )}
              >
                {n} ta
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {ANSWER_SHAPES.slice(0, count).map((s, i) => (
            <div key={s.letter} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white",
                  s.bg
                )}
              >
                {s.shape}
              </span>
              <input
                name={`option${i}`}
                required
                defaultValue={question?.options[i] ?? ""}
                placeholder={`${s.letter} varianti`}
                className={inputCls}
              />
              <label
                className={cn(
                  "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition",
                  correct === i
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-white/10 text-slate-500 hover:border-emerald-500/30 hover:text-emerald-400"
                )}
              >
                <input
                  type="radio"
                  name="correctPick"
                  checked={correct === i}
                  onChange={() => setCorrect(i)}
                  className="sr-only"
                />
                {correct === i ? "✓ To'g'ri" : "To'g'ri?"}
              </label>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          To&apos;g&apos;ri javob variantining yonidagi belgini tanlang.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Savol vaqti (soniya)" required>
          <input
            type="number"
            name="timeSeconds"
            required
            min={5}
            max={300}
            defaultValue={question?.timeSeconds ?? 20}
            className={inputCls}
          />
        </Field>
        <Field label="Ball" required>
          <input
            type="number"
            name="points"
            required
            min={0}
            max={10000}
            step={10}
            defaultValue={question?.points ?? 0}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-slate-400">
            Kahoot uslubida: to&apos;g&apos;ri javob uchun asosiy ball + tezlik bonusi (0 dan{" "}
            {speedBonusPercent}% gacha) + ketma-ket to&apos;g&apos;ri javoblar uchun streak bonusi
            (har qadam +{streakBonusPerStep}, maks. {streakBonusMax}). Admin sozlamalaridan
            olinadi.
          </p>
        </Field>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-amber-500/30">
        <input
          type="checkbox"
          name="penaltyOnWrong"
          defaultChecked={question?.penaltyOnWrong ?? false}
          className="mt-0.5 h-4 w-4 rounded border-white/20 text-amber-500 focus:ring-amber-500/40"
        />
        <span>
          <span className="block text-sm font-medium text-slate-200">
            Noto&apos;g&apos;ri javobda baldan minus qilish
          </span>
          <span className="mt-0.5 block text-xs text-slate-400">
            Kahoot uslubida: o&apos;quvchi noto&apos;g&apos;ri tanlasa, maksimal ball miqdorida jarima
            qo&apos;llanadi. Vaqt tugaganda jarima bo&apos;lmaydi.
          </span>
        </span>
      </label>

      <div className="flex justify-end border-t border-white/10 pt-4">
        <button type="submit" className={btn.primary}>
          {submitLabel}
        </button>
      </div>
    </ActionForm>
  );
}
