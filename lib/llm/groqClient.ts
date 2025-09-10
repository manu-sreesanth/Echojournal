// lib/llm/groqClient.ts
import fetch from "node-fetch";

const GROQ_BASE = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
const GROQ_KEY = process.env.GROQ_API_KEY;

if (!GROQ_KEY) {
  console.warn("GROQ_API_KEY not set — Groq calls will fail until provided.");
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGroq(
  messages: LLMMessage[],
  opts?: { model?: string; temperature?: number; maxTokens?: number }
) {
  const body = {
    model: opts?.model ?? "llama-3.1-8b-instant", // pick a valid Groq model
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: opts?.temperature ?? 0.2,
    max_tokens: opts?.maxTokens ?? 800,
  };

  const resp = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Groq error ${resp.status}: ${txt}`);
  }

  const json = await resp.json();

  if (json?.choices?.[0]?.message?.content) {
    return json.choices[0].message.content as string;
  }
  if (json?.output?.[0]?.content) {
    return json.output[0].content as string;
  }

  return JSON.stringify(json);
}
