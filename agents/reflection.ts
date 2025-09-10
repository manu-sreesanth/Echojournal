import { callGroq } from "@/lib/llm/groqClient";

export async function generateReflectionQuestions(journalText: string) {
  const prompt = `
The user wrote this journal entry:

"""
${journalText}
"""

Generate exactly 3 short reflection questions that could naturally arise
in the user's own mind while writing this entry.

- Write as if the user is questioning themselves, not being asked by a coach.
- Use first-person phrasing ("What can I do if…", "Is it okay that I…").
- Keep each question under 18 words.
- Questions should feel natural, thoughtful, and slightly unfinished, as if they just occurred to the writer.
❌ Do not include numbering, bullets, introductions, or explanations.
✅ Only output the 3 questions, one per line.
`;

  const response = await callGroq(
    [
      {
        role: "system",
        content:
          "You generate inner reflection questions that sound like the user's own thoughts.",
      },
      { role: "user", content: prompt },
    ],
    { temperature: 0.85, maxTokens: 150 }
  );

  return response
    .split("\n")
    .map((q) => q.trim().replace(/^[-•\d.]+\s*/, "")) // strip bullets/numbers
    .filter((q) => q.length > 0)
    .slice(0, 3);
}

