export async function createGroqCompletion({
  model,
  temperature,
  messages,
}: {
  model: string;
  temperature?: number;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
}) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: temperature ?? 0.7,
    }),
  });

  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? "Kai has no response.";
}
