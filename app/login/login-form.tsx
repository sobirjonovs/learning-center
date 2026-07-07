"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils";
import { btn, inputCls } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ isLight = false }: { isLight?: boolean }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  return (
    <form
      action={formAction}
      className={
        isLight
          ? "rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/50"
          : "rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl ring-1 ring-white/10"
      }
    >
      <div className="space-y-5">
        <div>
          <label
            htmlFor="login"
            className={cn(
              "mb-1.5 block text-sm font-medium",
              isLight ? "text-slate-700" : "text-slate-300"
            )}
          >
            Login
          </label>
          <input
            id="login"
            name="login"
            type="text"
            required
            autoComplete="username"
            placeholder="masalan: aziz.teacher"
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className={cn(
              "mb-1.5 block text-sm font-medium",
              isLight ? "text-slate-700" : "text-slate-300"
            )}
          >
            Parol
          </label>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        {state.error && (
          <div
            className={
              isLight
                ? "animate-shake rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                : "animate-shake rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300"
            }
          >
            {state.error}
          </div>
        )}

        <button type="submit" disabled={pending} className={cn(btn.primary, "w-full py-3")}>
          {pending ? "Tekshirilmoqda..." : "Kirish"}
        </button>
      </div>
    </form>
  );
}
