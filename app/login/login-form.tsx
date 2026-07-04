"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl bg-white p-8 shadow-2xl shadow-indigo-900/30"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="login" className="mb-1.5 block text-sm font-medium text-slate-700">
            Login
          </label>
          <input
            id="login"
            name="login"
            type="text"
            required
            autoComplete="username"
            placeholder="masalan: aziz.teacher"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Parol
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        {state.error && (
          <div className="animate-shake rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Tekshirilmoqda..." : "Kirish"}
        </button>
      </div>
    </form>
  );
}
