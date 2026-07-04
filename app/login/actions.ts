"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/log";
import { SESSION_COOKIE, signSession } from "@/lib/session";
import { ROLE_HOME, type Role } from "@/lib/constants";
import { parseJsonArray } from "@/lib/utils";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!login || !password) {
    return { error: "Login va parolni kiriting" };
  }

  const user = await db.user.findUnique({ where: { login } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "Login yoki parol noto'g'ri" };
  }
  if (!user.active) {
    return { error: "Sizning hisobingiz faolsizlantirilgan. Administratsiyaga murojaat qiling." };
  }

  const token = await signSession({
    id: user.id,
    role: user.role as Role,
    name: user.name,
    image: user.image,
    permissions: parseJsonArray<string>(user.permissions),
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  await logActivity(user.id, "Tizimga kirdi");
  redirect(ROLE_HOME[user.role as Role] ?? "/login");
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
