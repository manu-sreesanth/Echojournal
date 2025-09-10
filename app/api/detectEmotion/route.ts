import { groqClient } from '@/utils/groqClient';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.length < 10) {
      return new Response(JSON.stringify({ error: 'Text too short or empty.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
You are an emotion analysis assistant. Analyze the emotional tone of the following journal entry.
Return only one of these exact labels: "positive", "neutral", or "negative".

Only output the label. No explanation.

Journal: """${text}"""
Label:
    `;

    const response = await groqClient.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.3,
    });

    const raw = response.choices?.[0]?.message?.content?.trim().toLowerCase() || '';
    console.log('[🧠 Emotion raw output]', raw);

    const cleaned = raw.replace(/[^a-z]/gi, '').trim().toLowerCase();
    const validLabels = ['positive', 'neutral', 'negative'];
    const label = validLabels.includes(cleaned) ? cleaned : 'neutral';

    return new Response(JSON.stringify({ label }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Emotion Detection Error]', err);
    return new Response(JSON.stringify({ error: 'Emotion detection failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

