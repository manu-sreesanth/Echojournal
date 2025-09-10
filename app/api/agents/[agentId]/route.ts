import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateTomoResponse, generateTomoSummary } from "@/agents/tomo";
import { generateKaiResponse, generateKaiSummary } from "@/agents/kai";

/**
 * POST payload:
 * {
 *   uid: string,
 *   message: string,
 *   mode?: "chat" | "summary"  // summary = treat message as journal entry
 * }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  // Extract dynamic route param (must be awaited in Next.js 15+)
  const { agentId } = await context.params;

  // Add unique request ID for tracing logs
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  console.log(`[AgentRoute:${requestId}] Incoming request for agentId=${agentId}`);

  try {
    // Parse payload
    const payload = await req.json();
    console.log(`[AgentRoute:${requestId}] Raw payload:`, payload);

    const { uid, message, mode } = payload as {
      uid: string;
      message: string;
      mode?: "chat" | "summary";
    };

    // Validate input
    if (!uid || !message) {
      console.warn(`[AgentRoute:${requestId}] Missing uid or message`);
      return NextResponse.json(
        { error: "uid and message required" },
        { status: 400 }
      );
    }

    console.log(`[AgentRoute:${requestId}] Handling agentId=${agentId}, mode=${mode}`);

    // Handle TOMO
    if (agentId === "tomo") {
      if (mode === "summary") {
        console.log(`[AgentRoute:${requestId}] Calling generateTomoSummary`);
        const s = await generateTomoSummary(uid, message);
        console.log(`[AgentRoute:${requestId}] Tomo summary reply:`, s);
        return NextResponse.json({ reply: s });
      }
      console.log(`[AgentRoute:${requestId}] Calling generateTomoResponse`);
      const r = await generateTomoResponse(uid, message);
      console.log(`[AgentRoute:${requestId}] Tomo chat reply:`, r);
      return NextResponse.json({ reply: r });
    }

    // Handle KAI
    if (agentId === "kai") {
      if (mode === "summary") {
        console.log(`[AgentRoute:${requestId}] Calling generateKaiSummary`);
        const s = await generateKaiSummary(uid, message);
        console.log(`[AgentRoute:${requestId}] Kai summary reply:`, s);
        return NextResponse.json({ reply: s });
      }
      console.log(`[AgentRoute:${requestId}] Calling generateKaiResponse`);
      const r = await generateKaiResponse(uid, message);
      console.log(`[AgentRoute:${requestId}] Kai chat reply:`, r);
      return NextResponse.json({ reply: r });
    }

    // Unknown agent
    console.warn(`[AgentRoute:${requestId}] Unknown agentId=${agentId}`);
    return NextResponse.json({ error: "unknown agent" }, { status: 404 });
  } catch (err: any) {
    console.error(`[AgentRoute:${requestId}] Error:`, err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}


