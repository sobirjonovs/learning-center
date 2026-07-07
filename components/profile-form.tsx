"use client";

import { Field, inputCls, btn } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";
import { ImageInput } from "@/components/image-input";
import { ActionForm } from "@/components/action-form";
import { updateProfile } from "@/app/profile/actions";

export type ProfileUser = {
  name: string;
  login: string;
  phone: string | null;
  image: string | null;
};

export function ProfileForm({ user }: { user: ProfileUser }) {
  return (
    <ActionForm action={updateProfile} className="space-y-6">
      <Field label="Profil rasmi">
        <ImageInput currentImage={user.image} />
      </Field>

      <Field label="F.I.Sh" required>
        <input
          name="name"
          required
          defaultValue={user.name}
          placeholder="Familiya Ism Sharif"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Login" required>
          <input
            name="login"
            required
            defaultValue={user.login}
            placeholder="login.nom"
            className={inputCls}
          />
        </Field>
        <Field label="Telefon">
          <input
            name="phone"
            defaultValue={user.phone ?? ""}
            placeholder="+998 90 123 45 67"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-200">Parolni o&apos;zgartirish</h4>
        <p className="mb-4 text-xs text-slate-400">
          Parolni o&apos;zgartirmoqchi bo&apos;lmasangiz, quyidagi maydonlarni bo&apos;sh qoldiring.
        </p>
        <div className="space-y-4">
          <Field label="Joriy parol">
            <PasswordInput
              name="currentPassword"
              autoComplete="current-password"
              placeholder="Hozirgi parolingiz"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Yangi parol">
              <PasswordInput
                name="newPassword"
                autoComplete="new-password"
                minLength={6}
                placeholder="Kamida 6 ta belgi"
              />
            </Field>
            <Field label="Yangi parolni tasdiqlang">
              <PasswordInput
                name="confirmPassword"
                autoComplete="new-password"
                minLength={6}
                placeholder="Yana bir marta"
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-white/10 pt-4">
        <button type="submit" className={btn.primary}>
          Saqlash
        </button>
      </div>
    </ActionForm>
  );
}

