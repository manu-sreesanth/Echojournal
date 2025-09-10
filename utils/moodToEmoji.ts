// utils/moodToEmoji.ts

// Local mapping (same as in JournalEditor)
const moodOptions = [
  { mood: "sad", emoji: "😢", label: "Sad" },
  { mood: "anxious", emoji: "😰", label: "Anxious" },
  { mood: "tired", emoji: "😴", label: "Tired" },
  { mood: "okay", emoji: "😐", label: "Okay" },
  { mood: "happy", emoji: "😊", label: "Happy" },
  { mood: "excited", emoji: "🤩", label: "Excited" },
  { mood: "calm", emoji: "😌", label: "Calm" },
  { mood: "overwhelmed", emoji: "🤯", label: "Overwhelmed" },
  { mood: "angry", emoji: "😠", label: "Angry" },
];

export function moodToEmoji(mood: string): string {
  const found = moodOptions.find(
    (m) => m.mood.toLowerCase() === mood.toLowerCase()
  );
  return found ? found.emoji : "🙂";
}

export function moodToLabel(mood: string): string {
  const found = moodOptions.find(
    (m) => m.mood.toLowerCase() === mood.toLowerCase()
  );
  return found ? found.label : mood;
}
