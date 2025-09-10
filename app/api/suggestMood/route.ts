import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

export const runtime = "edge";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    const allowedMoods = [
      "happy", "sad", "anxious", "angry", "excited",
      "overwhelmed", "tired", "okay", "calm"
    ];

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `
You are an emotion recognition system for a journaling app. 
Your job is to analyze short journal entries and respond with one emotion 
from the following list:

happy, sad, anxious, angry, excited, overwhelmed, tired, okay, calm

Only respond with **one** of these mood labels, and nothing else.

Examples:
Entry: "I had a great time at the beach today with friends."
Mood: happy

Entry: "I'm behind on work and it's making me panic."
Mood: anxious

Entry: "It was a slow, relaxing day. Just sat with a book."
Mood: calm

Entry: "I can’t sleep again and everything feels heavy."
Mood: sad

Now analyze the next entry.
        `.trim(),
      },
      {
        role: "user",
        content: `Entry: "${content}"\nMood:`,
      },
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.2,
      max_tokens: 5,
    });

    const raw =
      response.choices?.[0]?.message?.content?.trim().toLowerCase() ?? "";
    const suggestedMood = allowedMoods.includes(raw) ? raw : "okay";

    return NextResponse.json({ mood: suggestedMood });
  } catch (err) {
    console.error("Mood suggestion failed:", err);
    return NextResponse.json({ mood: "okay" });
  }
}

