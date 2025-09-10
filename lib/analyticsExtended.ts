// lib/extendedAnalytics.ts
import { JournalEntry } from "@/types/JournalEntry";
import { calculateAverageMood } from "./analytics"; // reuse existing
import { getMoodScore } from "@/config/moodScores";

//
// 📌 Weekly Patterns
//
export const calculateWeeklyPatterns = (entries: JournalEntry[]) => {
  // Group by weekday
  const grouped: Record<string, JournalEntry[]> = {};
  entries.forEach((e) => {
    if (!e.createdAt) return;
    const weekday = e.createdAt.toLocaleDateString("en-US", { weekday: "long" });
    grouped[weekday] = [...(grouped[weekday] || []), e];
  });

  // Get average + variance per weekday
  const stats = Object.entries(grouped).map(([day, es]) => {
    const scores = es.map((e) => getMoodScore(e.mood));
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length;
    return { day, avg, variance, count: scores.length };
  });

  if (!stats.length) return { best: null, worst: null, consistent: null };

  const best = stats.reduce((a, b) => (a.avg > b.avg ? a : b));
  const worst = stats.reduce((a, b) => (a.avg < b.avg ? a : b));
  const consistent = stats.reduce((a, b) => (a.variance < b.variance ? a : b));

  return { best, worst, consistent };
};

//
// 📌 Monthly Summary
//
export const calculateMonthlySummary = (
  entries: JournalEntry[],
  prevEntries: JournalEntry[]
) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthEntries = entries.filter(
    (e) =>
      e.createdAt &&
      e.createdAt.getMonth() === currentMonth &&
      e.createdAt.getFullYear() === currentYear
  );

  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEntries = prevEntries.filter(
    (e) =>
      e.createdAt &&
      e.createdAt.getMonth() === prevMonth.getMonth() &&
      e.createdAt.getFullYear() === prevMonth.getFullYear()
  );

  const avgThisMonth = calculateAverageMood(currentMonthEntries);
  const avgLastMonth = calculateAverageMood(prevMonthEntries);

  const wordCount = currentMonthEntries.reduce(
    (acc, e) => acc + (e.content?.split(/\s+/).length || 0),
    0
  );

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const completionRate = (currentMonthEntries.length / daysInMonth) * 100;

  return {
    avgThisMonth,
    avgLastMonth,
    totalEntries: currentMonthEntries.length,
    wordCount,
    completionRate: Math.round(completionRate),
  };
};

//
// 📌 Achievements
//
export const calculateAchievements = (
  entries: JournalEntry[],
  trend: number,
  streak: number
) => {
  const totalWords = entries.reduce(
    (acc, e) => acc + (e.content?.split(/\s+/).length || 0),
    0
  );

  const reflectionEntries = entries.filter((e) =>
    e.tags?.includes("reflection")
  ).length;

  const achievements: {
    title: string;
    description: string;
    unlocked: boolean;
  }[] = [
    {
      title: "Consistency Master",
      description: "Maintained a 20+ day streak",
      unlocked: streak >= 20,
    },
    {
      title: "Growth Mindset",
      description: "Positive mood trend compared to last period",
      unlocked: trend > 0,
    },
    {
      title: "Prolific Writer",
      description: "Wrote over 1000 words this month",
      unlocked: totalWords >= 1000,
    },
    {
      title: "Self Aware",
      description: "Wrote 3+ reflective entries",
      unlocked: reflectionEntries >= 3,
    },
  ];

  return achievements;
};

//
// 📌 Emotional Trends
//
export const calculateEmotionalTrends = (entries: JournalEntry[]) => {
  const distribution: Record<string, number> = {};
  const scores: number[] = [];

  entries.forEach((e) => {
    if (!e.mood) return;
    distribution[e.mood] = (distribution[e.mood] || 0) + 1;
    scores.push(getMoodScore(e.mood));
  });

  const total = entries.length || 1;
  const percentages = Object.fromEntries(
    Object.entries(distribution).map(([mood, count]) => [
      mood,
      Math.round((count / total) * 100),
    ])
  );

  // Emotional stability = inverse of std deviation
  const mean = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const variance =
    scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
    (scores.length || 1);
  const stdDev = Math.sqrt(variance);
  const stability = Math.max(0, 100 - Math.round((stdDev / 5) * 100));

  return { percentages, stability };
};

//
// 📌 Writing Patterns
//
export const calculateWritingPatterns = (entries: JournalEntry[]) => {
  const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  let totalWords = 0;

  entries.forEach((e) => {
    if (!e.createdAt) return;
    const hour = e.createdAt.getHours();
    const words = e.content?.split(/\s+/).length || 0;
    totalWords += words;

    if (hour >= 5 && hour < 12) buckets.morning++;
    else if (hour >= 12 && hour < 17) buckets.afternoon++;
    else if (hour >= 17 && hour < 22) buckets.evening++;
    else buckets.night++;
  });

  const avgLength = entries.length
    ? Math.round(totalWords / entries.length)
    : 0;

  // Simple tip
  const maxPeriod = Object.entries(buckets).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];
  const tip =
    maxPeriod === "evening"
      ? "You write more expressively in the evenings"
      : maxPeriod === "morning"
      ? "Your mornings are your most reflective times"
      : "Keep writing consistently!";

  return { buckets, avgLength, tip };
};

/**
 * Calculate the longest streak (personal best) from all entries
 */
export const calculateBestStreak = (entries: JournalEntry[]): number => {
  if (!entries.length) return 0;

  // Sort entries by date
  const sorted = [...entries].sort(
    (a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
  );

  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].createdAt;
    const curr = sorted[i].createdAt;
    if (!prev || !curr) continue;

    const diffDays = Math.floor(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      current++;
      best = Math.max(best, current);
    } else if (diffDays > 1) {
      current = 1; // reset streak
    }
  }

  return best;
};

/**
 * Compare total entries with the previous period
 */
export const calculateEntryGrowth = (
  current: JournalEntry[],
  prev: JournalEntry[]
): number => {
  return current.length - prev.length;
};