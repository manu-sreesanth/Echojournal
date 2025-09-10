import { moodScores } from "../config/moodScores";
import { Mood } from "../types/mood";
import { JournalEntry } from "@/types/JournalEntry";



/** 
 * Get numeric mood score (fallback to "custom" if mood not in mapping).
 */
export const getMoodScore = (mood: string): number => {
  return moodScores[mood as Mood] ?? moodScores["custom"];
};

/**
 * Calculate average mood score from entries.
 */
export const calculateAverageMood = (entries: { mood: string }[]): number => {
  if (!entries.length) return 0;
  const total = entries.reduce((sum, e) => sum + getMoodScore(e.mood), 0);
  return +(total / entries.length).toFixed(2); // round to 2 decimals
};

/**
 * Convert mood score (1–10) into percentage (0–100).
 */
export const calculateMoodPercentage = (score: number): number => {
  return +(score / 10 * 100).toFixed(1);
};

/**
 * Calculate mood distribution (percentages per mood).
 */
export const calculateMoodDistribution = (entries: { mood: string }[]): Record<string, number> => {
  const total = entries.length;
  const counts: Record<string, number> = {};

  entries.forEach(e => {
    counts[e.mood] = (counts[e.mood] || 0) + 1;
  });

  const distribution: Record<string, number> = {};
  Object.entries(counts).forEach(([mood, count]) => {
    distribution[mood] = +(count / total * 100).toFixed(1);
  });

  return distribution;
};

/**
 * Calculate day streak (consecutive days with entries).
 */
export const calculateDayStreak = (entries: { createdAt: Date | null }[]): number => {
  const valid = entries.filter(e => e.createdAt !== null) as { createdAt: Date }[];
  if (!valid.length) return 0;

  // normalize dates -> midnight UTC
  const normalize = (d: Date) => {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
  };

  const sorted = [...valid]
    .map(e => ({ createdAt: normalize(e.createdAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  let streak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const diffDays =
      (sorted[i - 1].createdAt.getTime() - sorted[i].createdAt.getTime()) /
      (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
    } else if (diffDays > 1) {
      break;
    }
  }

  // optional: reset if latest entry isn’t today
  const today = normalize(new Date());
  if (sorted[0].createdAt.getTime() !== today.getTime()) {
    streak = 0;
  }

  return streak;
};



/**
 * Calculate trend (current average vs previous average).
 */
export const calculateMoodTrend = (
  currentEntries: { mood: string }[],
  previousEntries: { mood: string }[]
): number => {
  const currentAvg = calculateAverageMood(currentEntries);
  const prevAvg = calculateAverageMood(previousEntries);
  return +(currentAvg - prevAvg).toFixed(2);
};

/**
 * Calculate highest and lowest mood scores (per entry).
 */
export const calculateHighLow = (entries: { mood: string }[]): { highest: number; lowest: number } => {
  if (!entries.length) return { highest: 0, lowest: 0 };

  const scores = entries.map(e => getMoodScore(e.mood));
  return {
    highest: Math.max(...scores),
    lowest: Math.min(...scores),
  };
};



// Get the start of the current week (Sunday → Saturday)
const startOfWeek = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // normalize midnight
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day); // back to Sunday
  return d;
};

export const calculateWeeklyGoalProgress = (
  entries: JournalEntry[],
  goal: number = 7
) => {
  if (!entries.length) return { daysCompleted: 0, goal, percent: 0 };

  const now = new Date();
  const weekStart = startOfWeek(now);

  // ✅ filter only entries in this week
  const weekEntries = entries.filter(
    (e) => e.createdAt && e.createdAt >= weekStart
  );

  // ✅ unique days
  const daysWithEntries = new Set(
    weekEntries.map((e) => e.createdAt!.toDateString())
  ).size;

  const percent = Math.min((daysWithEntries / goal) * 100, 100);

  return { daysCompleted: daysWithEntries, goal, percent };
};

