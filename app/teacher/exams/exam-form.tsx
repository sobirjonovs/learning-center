// Imtihon yaratish/tahrirlash formasi
import Link from "next/link";
import type { Exam, Group } from "@prisma/client";
import { toDatetimeLocal } from "@/lib/utils";
import { ImageInput } from "@/components/image-input";
import { Field, btn, inputCls } from "@/components/ui";

export function ExamForm({
  groups,
  exam,
  action,
  submitLabel,
}: {
  groups: Group[];
  exam?: Exam;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const defaultEnd = exam?.endAt ?? new Date(Date.now() + 7 * 86_400_000);

  return (
    <form action={action} className="space-y-4">
      {exam && <input type="hidden" name="id" value={exam.id} />}

      <Field label="Imtihon nomi" required>
        <input
          name="title"
          required
          defaultValue={exam?.title ?? ""}
          placeholder="Masalan: Oraliq imtihon"
          className={inputCls}
        />
      </Field>

      <Field label="Batafsil tavsif">
        <textarea
          name="description"
          rows={5}
          defaultValue={exam?.description ?? ""}
          placeholder="Imtihon shartlari, talablar va ko'rsatmalar..."
          className={inputCls}
        />
      </Field>

      <Field label="Guruh" required>
        <select name="groupId" required defaultValue={exam?.groupId ?? ""} className={inputCls}>
          <option value="" disabled>
            Guruhni tanlang
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
              {g.active ? "" : " (faol emas)"}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Boshlanish vaqti" required>
          <input
            type="datetime-local"
            name="startAt"
            required
            defaultValue={toDatetimeLocal(exam?.startAt ?? new Date())}
            className={inputCls}
          />
        </Field>
        <Field label="Tugash vaqti" required>
          <input
            type="datetime-local"
            name="endAt"
            required
            defaultValue={toDatetimeLocal(defaultEnd)}
            className={inputCls}
          />
        </Field>
        <Field label="Minimal ball" required>
          <input
            type="number"
            name="minScore"
            required
            min={0}
            max={1000}
            defaultValue={exam?.minScore ?? 0}
            className={inputCls}
          />
        </Field>
        <Field label="Maksimal ball" required>
          <input
            type="number"
            name="maxScore"
            required
            min={1}
            max={1000}
            defaultValue={exam?.maxScore ?? 100}
            className={inputCls}
          />
        </Field>
        <Field label="O'tish foizi (%)" required>
          <input
            type="number"
            name="passPercent"
            required
            min={1}
            max={100}
            defaultValue={exam?.passPercent ?? 60}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-slate-500">
            Masalan, 60 — ball 60% dan past bo&apos;lsa yiqiladi
          </p>
        </Field>
      </div>

      <Field label="Rasm (ixtiyoriy)">
        <ImageInput currentImage={exam?.imageUrl} />
      </Field>

      <Field label="Fayl (ixtiyoriy)">
        <input type="file" name="file" className={inputCls} />
        {exam?.fileUrl && (
          <p className="mt-1 text-xs text-slate-400">
            Joriy fayl:{" "}
            <a href={exam.fileUrl} target="_blank" className="text-blue-400 hover:underline">
              yuklab olish
            </a>
          </p>
        )}
      </Field>

      <Field label="Havola (ixtiyoriy)">
        <input
          type="url"
          name="link"
          defaultValue={exam?.link ?? ""}
          placeholder="https://..."
          className={inputCls}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" className={btn.primary}>
          {submitLabel}
        </button>
        <Link href="/teacher/exams" className={btn.secondary}>
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
