import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

const PUBLIC_ROUTES = ["/auth/login", "/auth/signup", "/auth/verify"];
const PROTECTED_PREFIXES = ["/main", "/onboarding"];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("__session")?.value || "";
  const { pathname } = req.nextUrl;

  // ✅ Allow framework/static/API/asset routes through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.json" ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // 🧠 Check session cookie
  let isLoggedIn = false;
  try {
    const decodedToken = await adminAuth.verifySessionCookie(token, true);
    isLoggedIn = !!decodedToken;
  } catch (err) {
    console.warn("Invalid or expired session cookie:", err);
  }

  // 👋 Redirect logged-in users *away* from auth pages
  if (isLoggedIn && PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/main", req.url));
  }

  // 🔐 Protect private routes
  const isProtected = PROTECTED_PREFIXES.some((route) =>
    pathname.startsWith(route)
  );
  if (!isLoggedIn && isProtected) {
    const res = NextResponse.redirect(new URL("/auth/login", req.url));
    // 🚫 Clear stale cookie so it doesn’t keep sending invalid tokens
    res.cookies.set("__session", "", { maxAge: -1 });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/main/:path*",
    "/onboarding/:path*",
    "/auth/login",
    "/auth/signup",
    "/auth/verify",
  ],
};

