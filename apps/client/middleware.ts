import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "sub_session";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/docs"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: public pages, auth API routes, Next.js internals, static files
  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    /\.(png|jpg|svg|ico|webp|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete(COOKIE);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
