// O'qituvchi yaratish/tahrirlash formasi (server komponent)
import Link from "next/link";
import { Field, btn, inputCls } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";
import { ImageInput } from "@/components/image-input";
import { TEACHER_TYPES } from "@/lib/constants";

type TeacherData = {
  id: string;
  name: string;
  login: string;
  phone: string | null;
  teacherType: string | null;
  image?: string | null;
  active: boolean;
  subjectIds?: string[];
};

type SubjectOption = { id: string; name: string };

const ERROR_TEXT: Record<string, string> = {
  login: "Bu login allaqachon band. Boshqa login tanlang.",
  required: "Majburiy maydonlarni to'ldiring.",
};

export function TeacherForm({
  teacher,
  subjects,
  action,
  error,
}: {
  teacher?: TeacherData;
  subjects: SubjectOption[];
  action: (formData: FormData) => Promise<void>;
  error?: string;
}) {
  const selectedIds = new Set(teacher?.subjectIds ?? []);
  return (
    <form action={action} className="space-y-4">
      {error && ERROR_TEXT[error] && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {ERROR_TEXT[error]}
        </div>
      )}

      {teacher && <input type="hidden" name="id" value={teacher.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="F.I.Sh" required className="sm:col-span-2">
          <input
            name="name"
            required
            defaultValue={teacher?.name}
            placeholder="Masalan: Aziz Karimov"
            className={inputCls}
          />
        </Field>

        <Field label="Login" required>
          <input
            name="login"
            required
            defaultValue={teacher?.login}
            placeholder="aziz.teacher"
            className={inputCls}
          />
        </Field>

        <Field label="Parol" required={!teacher}>
          <PasswordInput
            name="password"
            required={!teacher}
            placeholder={teacher ? "Bo'sh qoldirilsa o'zgarmaydi" : "Kamida 6 ta belgi"}
          />
        </Field>

        <Field label="Telefon">
          <input
            name="phone"
            defaultValue={teacher?.phone ?? ""}
            placeholder="+998 90 123 45 67"
            className={inputCls}
          />
        </Field>

        <Field label="O'qituvchi turi">
          <select name="teacherType" defaultValue={teacher?.teacherType ?? TEACHER_TYPES[0]} className={inputCls}>
            {TEACHER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Fan kategoriyalari" className="sm:col-span-2">
          {subjects.length === 0 ? (
            <p className="text-sm text-slate-400">
              Kategoriyalar yo&apos;q.{" "}
              <Link href="/admin/categories" className="text-blue-400 hover:underline">
                Avval kategoriya qo&apos;shing
              </Link>
              .
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    name="subjectIds"
                    value={s.id}
                    defaultChecked={selectedIds.has(s.id)}
                    className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                  />
                  {s.name}
                </label>
              ))}
            </div>
          )}
        </Field>

        <Field label="Rasm" className="sm:col-span-2">
          <ImageInput currentImage={teacher?.image} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <input
          type="checkbox"
          name="active"
          defaultChecked={teacher ? teacher.active : true}
          className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
        />
        Faol
      </label>

      <div className="flex items-center gap-2 pt-2">
        <button type="submit" className={btn.primary}>
          Saqlash
        </button>
        <Link href="/admin/teachers" className={btn.secondary}>
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
