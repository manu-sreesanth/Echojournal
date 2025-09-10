// config/moodScores.ts
import { Mood } from "../types/mood";

// mood → score
export const moodScores: Record<Mood, number> = {
  excited: 10,
  happy: 9,
  calm: 8,
  okay: 6,
  tired: 5,
  anxious: 4,
  overwhelmed: 3,
  angry: 2,
  sad: 1,
  custom: 5, // fallback
};

// mood → emoji
export const moodEmojiMap: Record<Mood | string, string> = {
  sad: "😢",
  anxious: "😰",
  tired: "😴",
  okay: "😐",
  happy: "😊",
  excited: "🤩",
  calm: "😌",
  overwhelmed: "🤯",
  angry: "😠",
  custom: "🙂", // fallback
};

// helpers
export function getMoodScore(mood: string): number {
  return moodScores[mood as Mood] ?? moodScores.custom;
}

export function getMoodEmoji(mood: string): string {
  return moodEmojiMap[mood] ?? moodEmojiMap.custom;
}
