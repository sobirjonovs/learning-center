// O'quvchi yaratish/tahrirlash formasi (server komponent)
import Link from "next/link";
import { Field, btn, inputCls } from "@/components/ui";
import { STUDENT_TYPES } from "@/lib/constants";

type StudentData = {
  id: string;
  name: string;
  login: string;
  phone: string | null;
  parentPhone: string | null;
  studentType: string | null;
  active: boolean;
};

const ERROR_TEXT: Record<string, string> = {
  login: "Bu login allaqachon band. Boshqa login tanlang.",
  required: "Majburiy maydonlarni to'ldiring.",
};

export function StudentForm({
  student,
  groups,
  memberGroupIds,
  action,
  error,
}: {
  student?: StudentData;
  groups: Array<{ id: string; name: string }>;
  memberGroupIds: string[];
  action: (formData: FormData) => Promise<void>;
  error?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {error && ERROR_TEXT[error] && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {ERROR_TEXT[error]}
        </div>
      )}

      {student && <input type="hidden" name="id" value={student.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="F.I.Sh" required className="sm:col-span-2">
          <input
            name="name"
            required
            defaultValue={student?.name}
            placeholder="Masalan: Aziz Rahimov"
            className={inputCls}
          />
        </Field>

        <Field label="Login" required>
          <input
            name="login"
            required
            defaultValue={student?.login}
            placeholder="student1"
            className={inputCls}
          />
        </Field>

        <Field label="Parol" required={!student}>
          <input
            name="password"
            type="password"
            required={!student}
            placeholder={student ? "Bo'sh qoldirilsa o'zgarmaydi" : "Kamida 6 ta belgi"}
            className={inputCls}
          />
        </Field>

        <Field label="Telefon">
          <input
            name="phone"
            defaultValue={student?.phone ?? ""}
            placeholder="+998 90 123 45 67"
            className={inputCls}
          />
        </Field>

        <Field label="Ota-ona telefoni">
          <input
            name="parentPhone"
            defaultValue={student?.parentPhone ?? ""}
            placeholder="+998 90 765 43 21"
            className={inputCls}
          />
        </Field>

        <Field label="O'quvchi turi">
          <select name="studentType" defaultValue={student?.studentType ?? STUDENT_TYPES[0]} className={inputCls}>
            {STUDENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Rasm">
          <input name="image" type="file" accept="image/*" className={inputCls} />
        </Field>

        <Field label="Guruhga biriktirish" className="sm:col-span-2">
          {groups.length === 0 ? (
            <p className="text-sm text-slate-400">Faol guruhlar yo'q</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {groups.map((g) => (
                <label
                  key={g.id}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    name="groups"
                    value={g.id}
                    defaultChecked={memberGroupIds.includes(g.id)}
                    className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                  />
                  {g.name}
                </label>
              ))}
            </div>
          )}
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="active"
          defaultChecked={student ? student.active : true}
          className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
        />
        Faol
      </label>

      <div className="flex items-center gap-2 pt-2">
        <button type="submit" className={btn.primary}>
          Saqlash
        </button>
        <Link href="/admin/students" className={btn.secondary}>
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
