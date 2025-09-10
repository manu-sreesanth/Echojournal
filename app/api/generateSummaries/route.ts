import { NextResponse } from "next/server";
import { generateTomoSummary } from "@/agents/tomo";
import { generateKaiSummary } from "@/agents/kai";
import { analyzeEmotionalTone } from "@/agents/emotion";
import { generateGrowthOpportunities } from "@/agents/growth";
import { generateReflectionQuestions } from "@/agents/reflection";
import { getAgentMemoryAdmin } from "@/firebase/firestoreFunctionsAdmin";



export async function POST(req: Request) {
  try {
    const { uid, journalText, title, mood } = await req.json();

    if (!uid || !journalText) {
      return NextResponse.json(
        { error: "Missing required fields (uid, journalText)" },
        { status: 400 }
      );
    }

    const mem = await getAgentMemoryAdmin(uid);

    // Run both agents in parallel
    const [tomoReply, kaiReply, emotion, growthReply, questions] = await Promise.all([
      generateTomoSummary(uid, journalText, mem),
      generateKaiSummary(uid, journalText, mem),
      analyzeEmotionalTone(journalText),
      generateGrowthOpportunities(journalText),
      generateReflectionQuestions(journalText),
    ]);

    return NextResponse.json({
      success: true,
      tomo: tomoReply,
      kai: kaiReply,
      emotionalTone: emotion.emotionalTone,
      emotionalBalance: emotion.emotionalBalance,
      emotionalScore: emotion.emotionalScore,
      growth: growthReply.insight,
      actionSuggestion: growthReply.action,
      reflectionQuestions: questions || [],
    });
  } catch (err: any) {
    console.error("🔥 Error generating summaries:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}



