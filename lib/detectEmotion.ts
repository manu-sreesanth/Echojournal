// lib/detectEmotion.ts
export async function detectEmotionLabel(text: string): Promise<'negative' | 'neutral' | 'positive'> {
  try {
    const res = await fetch('/api/detectEmotion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const { label } = await res.json();
    return label === 'negative' || label === 'positive' ? label : 'neutral';
  } catch (err) {
    console.error("Error detecting emotion:", err);
    return 'neutral';
  }
}
