// app/api/tomo/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getChatHistoryAdmin } from "@/lib/data/chatHistoryRepo";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let token: string | null = null;
    if (authHeader?.toLowerCase().startsWith("bearer ")) token = authHeader.slice(7);
    if (!token) token = req.headers.get("x-firebase-id-token");
    if (!token) token = req.cookies.get("__session")?.value ?? null;
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const history = await getChatHistoryAdmin(uid, "tomo");
    const messages = (history ?? []).map((h: any) => ({
      sender: h.role === "assistant" ? "tomo" : "user",
      text: h.content,
      timestamp: h.timestamp ?? null,
      instant: true, // 👈 ensure history renders instantly (no typing animation)
    }));

    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error("History GET error:", err);
    return NextResponse.json({ error: "Server error", details: err?.message }, { status: 500 });
  }
}

