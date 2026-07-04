"use client";

// Savol qo'shish/tahrirlash formasi — variantlar soni dinamik (2/3/4)
import { useState } from "react";
import { Field, inputCls, btn } from "@/components/ui";
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
};

export function QuestionForm({
  quizId,
  question,
  action,
  submitLabel,
}: {
  quizId: string;
  question?: QuestionFormData;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
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
    <form action={action} className="space-y-4">
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
        <div className="space-y-2">
          {question?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={question.image}
              alt="Joriy rasm"
              className="h-20 w-32 rounded-xl border border-slate-100 object-cover"
            />
          )}
          <input type="file" name="image" accept="image/*" className={inputCls} />
        </div>
      </Field>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">
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
                  count === n ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
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
                    : "border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-600"
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
        <Field label="Maksimal ball" required>
          <input
            type="number"
            name="points"
            required
            min={10}
            max={10000}
            step={10}
            defaultValue={question?.points ?? 500}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button type="submit" className={btn.primary}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
