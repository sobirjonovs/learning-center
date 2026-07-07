// Quiz meta ma'lumotlari formasi (yaratish/tahrirlash uchun umumiy)
import { Field, inputCls, btn } from "@/components/ui";
import { ImageInput } from "@/components/image-input";
import { QUIZ_TYPES, type QuizType } from "@/lib/constants";

export type QuizFormGroup = { id: string; name: string };

export type QuizFormData = {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  image: string | null;
  groupId: string | null;
  type: string;
  timeLimit: number | null;
  countsToRating: boolean;
};

export function QuizForm({
  groups,
  quiz,
  action,
  submitLabel,
}: {
  groups: QuizFormGroup[];
  quiz?: QuizFormData;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {quiz && <input type="hidden" name="id" value={quiz.id} />}

      <Field label="Quiz nomi" required>
        <input
          name="name"
          required
          defaultValue={quiz?.name ?? ""}
          placeholder="Masalan: Kompyuter asoslari"
          className={inputCls}
        />
      </Field>

      <Field label="Tavsifi">
        <textarea
          name="description"
          rows={3}
          defaultValue={quiz?.description ?? ""}
          placeholder="Quiz nima haqida? (ixtiyoriy)"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fan yoki yo'nalish">
          <input
            name="subject"
            defaultValue={quiz?.subject ?? ""}
            placeholder="Masalan: Informatika"
            className={inputCls}
          />
        </Field>

        <Field label="Guruh">
          <select name="groupId" defaultValue={quiz?.groupId ?? ""} className={inputCls}>
            <option value="">Guruhsiz (ochiq)</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quiz turi" required>
          <select name="type" defaultValue={quiz?.type ?? "NORMAL"} className={inputCls}>
            {(Object.keys(QUIZ_TYPES) as QuizType[]).map((k) => (
              <option key={k} value={k}>
                {QUIZ_TYPES[k].label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Umumiy vaqt chegarasi (daqiqa)">
          <input
            type="number"
            name="timeLimit"
            min={1}
            defaultValue={quiz?.timeLimit ?? ""}
            placeholder="Ixtiyoriy"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Quiz rasmi">
        <ImageInput currentImage={quiz?.image} />
      </Field>

      <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm font-medium text-slate-200">
        <input
          type="checkbox"
          name="countsToRating"
          defaultChecked={quiz ? quiz.countsToRating : true}
          className="h-4 w-4 rounded border-slate-300 text-blue-400 focus:ring-indigo-500"
        />
        Natijalarni reytingga qo&apos;shish (o&apos;quvchilar XP va ball oladi)
      </label>

      <div className="flex justify-end border-t border-white/10 pt-4">
        <button type="submit" className={btn.primary}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
