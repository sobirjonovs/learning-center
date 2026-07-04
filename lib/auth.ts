// Server tomonidagi sessiya yordamchilari
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession, type SessionUser } from "./session";
import { ROLE_HOME, type PermissionKey, type Role } from "./constants";

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
