// app/api/tomo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin"; // your existing admin init
import { generateTomoResponse } from "@/agents/tomo";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    // Grab Firebase ID token from Authorization, X-Firebase-Id-Token, or __session cookie
    const authHeader = req.headers.get("authorization");
    let token: string | null = null;
    if (authHeader?.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7);
    }
    if (!token) token = req.headers.get("x-firebase-id-token");
    if (!token) token = req.cookies.get("__session")?.value ?? null;
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Call your existing agent (this persists to Firestore for you)
    const reply = await generateTomoResponse(uid, message);

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Tomo POST error:", err);
    return NextResponse.json({ error: "Server error", details: err?.message }, { status: 500 });
  }
}
