import { NextResponse } from "next/server";
import { getJournalEntriesAdmin } from "@/firebase/firestoreFunctionsAdmin"; 
import Groq from "groq-sdk";


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    // Get last 30 days of entries
    const entries = await getJournalEntriesAdmin(uid);

    const journalText = entries
      .map(
        (e) =>
          `Date: ${e.createdAt?.toDateString()}\nMood: ${e.mood}\nContent: ${e.content}`
      )
      .join("\n\n");

   const prompt = `
You are Kai, a practical journaling mentor. Analyze the entries and return exactly 3 short, practical insights. 

Requirements:
- Return exactly 3 JSON objects in a JSON array.
- No more, no less.
- Do not include any text outside the JSON.

Each insight must include:
- "icon": an emoji representing the advice
- "title": a short 3–5 word summary
- "description": one or two sentences of practical advice
- "style": one of "green" (mood trend), "blue" (habit/writing tip), "purple" (consistency/motivation)

Entries:
${journalText}
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    let insights: any[] = [];
    const content = response.choices[0]?.message?.content?.trim() || "[]";

    try {
  insights = JSON.parse(content);

  // Ensure it's an array
  if (!Array.isArray(insights)) {
    insights = [insights];
  }

  // ✅ sanitize each object
  insights = insights.map((insight: any) => ({
    icon: insight.icon || "💡",
    title: insight.title || "Insight",
    description: insight.description || "No advice generated.",
    style: ["green", "blue", "purple"].includes(insight.style)
      ? insight.style
      : "blue",
  }));

  // ✅ hard enforce exactly 3
  if (insights.length > 3) {
    insights = insights.slice(0, 3);
  } else if (insights.length < 3) {
    while (insights.length < 3) {
      insights.push({
        icon: "💡",
        title: "Extra Insight",
        description: "No advice generated.",
        style: "blue",
      });
    }
  }
} catch (err) {
  console.error("Failed to parse AI insights:", err, content);
  insights = [
    {
      icon: "🤖",
      title: "Insight Error",
      description: "Could not parse AI insights.",
      style: "purple",
    },
  ];
}


    return NextResponse.json({ insights });
  } catch (err) {
    console.error("AI insights error:", err);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}

