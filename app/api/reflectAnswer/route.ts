import { NextResponse } from "next/server";
import { callGroq, LLMMessage } from "@/lib/llm/groqClient";

export async function POST(req: Request) {
  try {
    const { question, journalText } = await req.json();

    if (!question || !journalText) {
      return NextResponse.json(
        { error: "Missing required fields (question, journalText)" },
        { status: 400 }
      );
    }

    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `
You are a practical external adviser. 
Your role is to reduce self-doubt by giving clear, useful, and realistic answers to the exact question.
Do not motivate or flatter; focus only on solving or clarifying the reflection question.  
Be polite, neutral, and constructive — never offensive.  
Keep answers concise: 2–4 sentences max.  
Avoid repeating or summarizing the journal entry in your answer.
        `,
      },
      {
        role: "user",
        content: `
Journal Entry:
"""
${journalText}
"""

Reflection Question:
"${question}"

Please provide a short, practical answer as an adviser would.
        `,
      },
    ];

    const aiAnswer = await callGroq(messages, {
      model: "llama-3.1-8b-instant",
      temperature: 0.55,
      maxTokens: 200,
    });

    return NextResponse.json({
      success: true,
      answer: aiAnswer?.trim() || "No answer generated.",
    });
  } catch (err: any) {
    console.error("🔥 Error generating reflection answer:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

