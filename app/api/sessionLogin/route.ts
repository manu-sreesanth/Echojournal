// app/api/sessionLogin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const response = NextResponse.json({ status: "success" });

    // Clear stale cookie (if any)
    response.cookies.set("__session", "", { maxAge: -1 });

    response.cookies.set("__session", sessionCookie, {
      maxAge: expiresIn / 1000,
      expires: new Date(Date.now() + expiresIn),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict", // 🚀 safer against CSRF
    });

    return response;
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("Session Login Error:", error.message);
    return NextResponse.json(
      { error: "Failed to create session", details: error.message },
      { status: 401 }
    );
  }
}


