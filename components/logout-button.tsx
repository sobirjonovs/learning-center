"use client";

import { logoutAction } from "@/app/login/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        title="Chiqish"
        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
      >
        Chiqish
      </button>
    </form>
  );
}
