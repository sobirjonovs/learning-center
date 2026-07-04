import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/session";
import { ROLE_HOME } from "./lib/constants";

const PROTECTED_PREFIXES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/teacher", roles: ["TEACHER"] },
  { prefix: "/student", roles: ["STUDENT"] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const protectedRoute = PROTECTED_PREFIXES.find(
    (p) => pathname === p.prefix || pathname.startsWith(p.prefix + "/")
  );

  if (protectedRoute) {
    if (!session) {
      const url = new URL("/login", req.url);
      return NextResponse.redirect(url);
    }
    if (!protectedRoute.roles.includes(session.role)) {
      return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? "/login", req.url));
    }
    return NextResponse.next();
  }

  // Login sahifasi yoki bosh sahifa: sessiya bo'lsa o'z kabinetiga
  if ((pathname === "/login" || pathname === "/") && session) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? "/login", req.url));
  }
  if (pathname === "/" && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/teacher/:path*", "/student/:path*"],
};
