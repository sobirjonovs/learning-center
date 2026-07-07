"use client";

// O'quvchi yaratish/tahrirlash formasi
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Field, btn, inputCls } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";
import { ImageInput } from "@/components/image-input";
import { STUDENT_TYPES } from "@/lib/constants";
import { suggestStudentLogin } from "./actions";

type StudentData = {
  id: string;
  name: string;
  login: string;
  phone: string | null;
  parentPhone: string | null;
  studentType: string | null;
  image?: string | null;
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
  const isNew = !student;
  const [name, setName] = useState(student?.name ?? "");
  const [login, setLogin] = useState(student?.login ?? "");
  const [loginManual, setLoginManual] = useState(!isNew);
  const [loginLoading, setLoginLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loginManualRef = useRef(loginManual);
  loginManualRef.current = loginManual;

  useEffect(() => {
    if (!isNew || loginManual) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = name.trim();
    if (!trimmed.split(/\s+/).filter(Boolean)[0]) {
      setLogin("");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoginLoading(true);
      try {
        const suggested = await suggestStudentLogin(trimmed);
        if (!loginManualRef.current) setLogin(suggested);
      } finally {
        setLoginLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name, isNew]);

  return (
    <form action={action} className="space-y-4">
      {error && ERROR_TEXT[error] && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {ERROR_TEXT[error]}
        </div>
      )}

      {student && <input type="hidden" name="id" value={student.id} />}
      {isNew && <input type="hidden" name="loginManual" value={loginManual ? "1" : "0"} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="F.I.Sh" required className="sm:col-span-2">
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Aziz Rahimov"
            className={inputCls}
          />
        </Field>

        <Field label="Login" required>
          <input
            name="login"
            required
            value={login}
            onChange={(e) => {
              setLoginManual(true);
              setLogin(e.target.value);
            }}
            placeholder={isNew ? "Masalan: aziz_U121" : "student1"}
            className={inputCls}
          />
          {isNew && !loginManual && (
            <p className="mt-1 text-xs text-slate-500">
              {loginLoading ? "Login yaratilmoqda..." : "Ismdan avtomatik yaratiladi (masalan: aziz_U121)"}
            </p>
          )}
        </Field>

        <Field label="Parol" required={!student}>
          <PasswordInput
            name="password"
            required={!student}
            placeholder={student ? "Bo'sh qoldirilsa o'zgarmaydi" : "Kamida 6 ta belgi"}
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
          <ImageInput currentImage={student?.image} />
        </Field>

        <Field label="Guruhga biriktirish" className="sm:col-span-2">
          {groups.length === 0 ? (
            <p className="text-sm text-slate-400">Faol guruhlar yo&apos;q</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {groups.map((g) => (
                <label
                  key={g.id}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5"
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

      <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <input
          type="checkbox"
          name="active"
          defaultChecked={student ? student.active : true}
          className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
        />
        Faol
      </label>

      <div className="flex items-center gap-2 pt-2">
        <button type="submit" className={btn.primary} disabled={isNew && loginLoading}>
          Saqlash
        </button>
        <Link href="/admin/students" className={btn.secondary}>
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
