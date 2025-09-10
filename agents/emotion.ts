import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeEmotionalTone(journalText: string) {
  const prompt = `
  Analyze the following journal entry and respond ONLY in JSON format with:
  {
    "emotionalTone": "Short description of the emotional tone",
    "emotionalBalance": "Positive | Neutral | Negative",
    "emotionalScore": number (0-100)
  }

  Journal entry:
  """${journalText}"""
  `;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant", // ✅ LLaMA-3 8B fast model
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3, // low randomness → more structured output
  });

  try {
    return JSON.parse(response.choices[0]?.message?.content || "{}");
  } catch (err) {
    console.error("⚠️ Failed to parse emotional tone:", err);
    return {
      emotionalTone: "Unable to determine tone.",
      emotionalBalance: "Neutral",
      emotionalScore: 50,
    };
  }
}
