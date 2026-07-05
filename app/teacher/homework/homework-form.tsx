// Uyga vazifa yaratish/tahrirlash formasi (server komponent)
import Link from "next/link";
import type { Group, Homework } from "@prisma/client";
import { toDatetimeLocal } from "@/lib/utils";
import { Field, btn, inputCls } from "@/components/ui";

export function HomeworkForm({
  groups,
  homework,
  action,
  submitLabel,
}: {
  groups: Group[];
  homework?: Homework;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {homework && <input type="hidden" name="id" value={homework.id} />}

      <Field label="Sarlavha" required>
        <input
          name="title"
          required
          defaultValue={homework?.title ?? ""}
          placeholder="Masalan: 5-mavzu bo'yicha amaliy vazifa"
          className={inputCls}
        />
      </Field>

      <Field label="Tavsif">
        <textarea
          name="description"
          rows={4}
          defaultValue={homework?.description ?? ""}
          placeholder="Vazifa sharti va talablari..."
          className={inputCls}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Guruh" required>
          <select name="groupId" required defaultValue={homework?.groupId ?? ""} className={inputCls}>
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
        <Field label="Maksimal ball" required>
          <input
            type="number"
            name="maxScore"
            required
            min={1}
            max={1000}
            defaultValue={homework?.maxScore ?? 100}
            className={inputCls}
          />
        </Field>
        <Field label="Boshlanish vaqti">
          <input
            type="datetime-local"
            name="startAt"
            defaultValue={toDatetimeLocal(homework?.startAt ?? new Date())}
            className={inputCls}
          />
        </Field>
        <Field label="Topshirish muddati" required>
          <input
            type="datetime-local"
            name="dueAt"
            required
            defaultValue={toDatetimeLocal(homework?.dueAt)}
            className={inputCls}
          />
        </Field>
        <Field label="Erta topshirish bonusi (kuniga, ball)">
          <input
            type="number"
            name="earlyBonus"
            min={0}
            max={1000}
            defaultValue={homework?.earlyBonus ?? 0}
            className={inputCls}
          />
        </Field>
        <Field label="Kech topshirish jarimasi (kuniga, ball)">
          <input
            type="number"
            name="latePenalty"
            min={0}
            max={1000}
            defaultValue={homework?.latePenalty ?? 0}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Fayl (ixtiyoriy)">
        <input type="file" name="file" className={inputCls} />
        {homework?.fileUrl && (
          <p className="mt-1 text-xs text-slate-400">
            Joriy fayl:{" "}
            <a href={homework.fileUrl} target="_blank" className="text-blue-400 hover:underline">
              yuklab olish
            </a>{" "}
            (yangi fayl tanlansa almashtiriladi)
          </p>
        )}
      </Field>

      <Field label="Link (ixtiyoriy)">
        <input
          type="url"
          name="link"
          defaultValue={homework?.link ?? ""}
          placeholder="https://..."
          className={inputCls}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" className={btn.primary}>
          {submitLabel}
        </button>
        <Link href="/teacher/homework" className={btn.secondary}>
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
