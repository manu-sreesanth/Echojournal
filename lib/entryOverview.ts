// lib/entryOverview.ts
import { JournalEntry } from "@/types/JournalEntry";
import { getMoodScore, calculateMoodPercentage } from "@/lib/analytics";

export const buildEntryOverview = (entry: JournalEntry) => {
  const words = entry.content?.trim().split(/\s+/).length || 0;
  const readingTime = `${Math.max(1, Math.ceil(words / 200))}m`;

  const moodScore = getMoodScore(entry.mood || "custom");
  const positivity = calculateMoodPercentage(moodScore);

  return {
    mood: entry.mood || "🙂",
    date: entry.createdAt
      ? entry.createdAt.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "Today",
    title: entry.title || entry.aiSummary || "Untitled Entry",
    wordCount: words,
    sentimentScore: `${positivity}%`,
    readingTime,
  };
};
