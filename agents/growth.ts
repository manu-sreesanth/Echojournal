import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateGrowthOpportunities(journalText: string) {
  const prompt = `
You are an AI coach. Based on the following journal entry, provide one growth opportunity and one concrete action suggestion. 
Respond ONLY in valid JSON (no extra text, no markdown).
Use this schema exactly:
{
  "insight": "string",
  "action": "string"
}

Journal Entry:
"""
${journalText}
"""
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant", // ✅ fast llama model
    messages: [
      {
        role: "system",
        content:
          "You are an AI that ONLY responds with valid JSON. Do not include explanations or extra text.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 200,
  });

  const raw = response.choices[0]?.message?.content?.trim();

  try {
    // parse only the JSON part (in case model adds text accidentally)
    const jsonMatch = raw?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found");
  } catch (err) {
    console.warn("⚠️ Failed to parse growth JSON:", raw, err);
    return {
      insight: "Reflect on recurring patterns in your emotions and habits.",
      action: "Write down three small steps you can take to improve tomorrow.",
    };
  }
}
