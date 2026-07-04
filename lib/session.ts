// Edge-xavfsiz sessiya moduli — middleware ham, server ham ishlatadi.
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./constants";

export const SESSION_COOKIE = "lc_session";

export type SessionUser = {
  id: string;
  role: Role;
  name: string;
  image: string | null;
  permissions: string[];
};

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "learning-center-dev-secret-change-me"
);

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT(user as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.id || !payload.role) return null;
    return {
      id: payload.id as string,
      role: payload.role as Role,
      name: (payload.name as string) ?? "",
      image: (payload.image as string | null) ?? null,
      permissions: (payload.permissions as string[]) ?? [],
    };
  } catch {
    return null;
  }
}
