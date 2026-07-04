// Guruh yaratish/tahrirlash formasi (server komponent)
import Link from "next/link";
import { Field, btn, inputCls } from "@/components/ui";
import { GROUP_TYPES, WEEKDAYS } from "@/lib/constants";
import { parseJsonArray, toDateInput } from "@/lib/utils";

type GroupData = {
  id: string;
  name: string;
  type: string | null;
  teacherId: string | null;
  days: string;
  time: string;
  room: string | null;
  startDate: Date | null;
  endDate: Date | null;
  active: boolean;
};

const ERROR_TEXT: Record<string, string> = {
  required: "Majburiy maydonlarni to'ldiring (nomi, dars kunlari va vaqti).",
};

export function GroupForm({
  group,
  teachers,
  action,
  error,
}: {
  group?: GroupData;
  teachers: Array<{ id: string; name: string }>;
  action: (formData: FormData) => Promise<void>;
  error?: string;
}) {
  const selectedDays = group ? parseJsonArray(group.days) : [];

  return (
    <form action={action} className="space-y-4">
      {error && ERROR_TEXT[error] && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {ERROR_TEXT[error]}
        </div>
      )}

      {group && <input type="hidden" name="id" value={group.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Guruh nomi" required className="sm:col-span-2">
          <input
            name="name"
            required
            defaultValue={group?.name}
            placeholder="Masalan: Frontend A-1"
            className={inputCls}
          />
        </Field>

        <Field label="Guruh turi">
          <select name="type" defaultValue={group?.type ?? GROUP_TYPES[0]} className={inputCls}>
            {GROUP_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="O'qituvchi">
          <select name="teacherId" defaultValue={group?.teacherId ?? ""} className={inputCls}>
            <option value="">— Biriktirilmagan —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Dars kunlari" required className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <label
                key={day}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  name="days"
                  value={day}
                  defaultChecked={selectedDays.includes(day)}
                  className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                />
                {day}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Dars vaqti" required>
          <input
            name="time"
            required
            defaultValue={group?.time}
            placeholder="14:00 - 16:00"
            className={inputCls}
          />
        </Field>

        <Field label="Xona">
          <input name="room" defaultValue={group?.room ?? ""} placeholder="201" className={inputCls} />
        </Field>

        <Field label="Boshlanish sanasi">
          <input
            name="startDate"
            type="date"
            defaultValue={toDateInput(group?.startDate)}
            className={inputCls}
          />
        </Field>

        <Field label="Tugash sanasi">
          <input
            name="endDate"
            type="date"
            defaultValue={toDateInput(group?.endDate)}
            className={inputCls}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="active"
          defaultChecked={group ? group.active : true}
          className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
        />
        Faol
      </label>

      <div className="flex items-center gap-2 pt-2">
        <button type="submit" className={btn.primary}>
          Saqlash
        </button>
        <Link href="/admin/groups" className={btn.secondary}>
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
