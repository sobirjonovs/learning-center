// Server tomonidagi sessiya yordamchilari
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, signSession, verifySession, type SessionUser } from "./session";
import { ROLE_HOME, type PermissionKey, type Role } from "./constants";
import { parseJsonArray } from "./utils";

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
});

/** Sessiya bo'lmasa loginga, rol mos kelmasa o'z sahifasiga yo'naltiradi. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles.length > 0 && !roles.includes(session.role)) {
    redirect(ROLE_HOME[session.role] ?? "/login");
  }
  return session;
}

/** SUPER_ADMIN hamma narsani, ADMIN faqat berilgan huquqlarini ko'radi. */
export function can(session: SessionUser, permission: PermissionKey): boolean {
  if (session.role === "SUPER_ADMIN") return true;
  if (session.role === "ADMIN") return session.permissions.includes(permission);
  return false;
}

/** Huquq bo'lmasa admin bosh sahifasiga qaytaradi. */
export function requirePermission(session: SessionUser, permission: PermissionKey): void {
  if (!can(session, permission)) redirect("/admin");
}

/** Profil yangilangandan keyin sessiyadagi ism/rasmni yangilaydi. */
export async function refreshSessionFromDb(userId: string): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) return;

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
}
