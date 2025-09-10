"use client";

import React, { useEffect, useState, useRef } from "react";
import { fetchEntries, fetchPreviousEntries } from "@/lib/fetchEntries";
import {
  calculateAverageMood,
  calculateDayStreak,
  calculateMoodDistribution,
  calculateMoodTrend,
  calculateHighLow,
} from "@/lib/analytics";
import {
  calculateWeeklyPatterns,
  calculateMonthlySummary,
  calculateAchievements,
  calculateEmotionalTrends,
  calculateWritingPatterns,
  calculateBestStreak,           // ✅ new
  calculateEntryGrowth            // ✅ new
} from "@/lib/analyticsExtended";
import { JournalEntry } from "@/types/JournalEntry";

import { Chart, registerables } from "chart.js";
Chart.register(...registerables);



// helper: group entries by date (not weekday)
const groupEntriesByDate = (entries: JournalEntry[]) => {
  const grouped: Record<string, JournalEntry[]> = {};
  entries.forEach((entry) => {
    if (!entry.createdAt) return;
    // use ISO date (YYYY-MM-DD) so sorting works
    const dateKey = entry.createdAt.toISOString().split("T")[0];
    grouped[dateKey] = [...(grouped[dateKey] || []), entry];
  });
  return grouped;
};

const Analytics = ({ uid }: { uid: string }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [prevEntries, setPrevEntries] = useState<JournalEntry[]>([]);
  const [timeRange, setTimeRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

// close on outside click
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
      setDownloadOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);



useEffect(() => {
  if (!uid) {
    console.warn("Analytics: no uid passed, skipping fetch");
    return;
  }

  setLoading(true);
  Promise.all([fetchEntries(uid, timeRange), fetchPreviousEntries(uid, timeRange)])
    .then(([current, prev]) => {
      console.log("Fetched entries:", current.length, current);
      console.log("Fetched previous:", prev.length, prev);
      setEntries(current);
      setPrevEntries(prev);
    })
    .catch(err => {
      console.error("Error fetching analytics:", err);
    })
    .finally(() => setLoading(false));
}, [uid, timeRange]);

  // filter out invalid entries
  const validEntries = entries.filter(
    (e): e is JournalEntry & { createdAt: Date } => !!e.createdAt
  );
  const validPrevEntries = prevEntries.filter(
    (e): e is JournalEntry & { createdAt: Date } => !!e.createdAt
  );

  // derived values
  const avgMood = calculateAverageMood(validEntries);
  const dayStreak = calculateDayStreak(validEntries);
  const distribution = calculateMoodDistribution(validEntries);
  const { highest, lowest } = calculateHighLow(validEntries);
  const trend = calculateMoodTrend(validEntries, validPrevEntries);

    // ✅ New metrics
  const weeklyPatterns = calculateWeeklyPatterns(validEntries);
  const monthlySummary = calculateMonthlySummary(validEntries, validPrevEntries);
  const achievements = calculateAchievements(validEntries, trend, dayStreak);
  const emotionalTrends = calculateEmotionalTrends(validEntries);
  const writingPatterns = calculateWritingPatterns(validEntries);

  // group for Mood Journey (chronological)
  const groupedByDate = groupEntriesByDate(validEntries);
  const dailyAverages = Object.entries(groupedByDate)
    .map(([date, entries]) => {
      const avg = calculateAverageMood(entries);
      return {
        date: new Date(date),
        day: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        avg,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime()); // ✅ ensure chronological order

  const highestDay = dailyAverages.length
    ? dailyAverages.reduce((a, b) => (a.avg > b.avg ? a : b))
    : null;

  const lowestDay = dailyAverages.length
    ? dailyAverages.reduce((a, b) => (a.avg < b.avg ? a : b))
    : null;

// ✅ NOW put the useEffect here
useEffect(() => {
  if (!dailyAverages.length) return;

  const ctx = document.getElementById("moodChart") as HTMLCanvasElement;
  if (!ctx) return;

  const labels = dailyAverages.map(d => d.day);
  const data = dailyAverages.map(d => d.avg);

  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Mood Score",
          data,
          borderColor: "#2563eb",
          borderWidth: 2.5,
          tension: 0.3,
          fill: true,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return "rgba(37, 99, 235, 0.08)";
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, "rgba(16, 185, 129, 0.3)");
            gradient.addColorStop(0.5, "rgba(251, 191, 36, 0.2)");
            gradient.addColorStop(1, "rgba(239, 68, 68, 0.1)");
            return gradient;
          },
          pointBackgroundColor: data.map(score => {
            if (score >= 9) return "#059669";
            if (score >= 7) return "#10b981";
            if (score >= 5) return "#f59e0b";
            if (score >= 3) return "#dc2626";
            return "#b91c1c";
          }),
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          ticks: {
            stepSize: 1,
            callback: (val: string | number) => {
  const moods: Record<number, string> = {
    10: "Excited",
    9: "Happy",
    8: "Calm",
    6: "Okay",
    5: "Tired",
    4: "Anxious",
    3: "Overwhelmed",
    2: "Angry",
    1: "Sad",
  };
  return moods[Number(val)] ?? val;
},
              
          },
        },
        x: { grid: { display: false } },
      },
      interaction: { mode: "index", intersect: false },
    },
  });

  return () => chart.destroy();
}, [dailyAverages]);


  if (loading) {
    return <div className="p-8 text-slate-600">Loading analytics...</div>;
  }

const personalBest = calculateBestStreak([...validEntries, ...validPrevEntries]);
const entryGrowth = calculateEntryGrowth(validEntries, validPrevEntries);

  return (
    <div className="space-y-10 pr-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
  <div>
    <h2 className="text-4xl font-bold mb-2 text-slate-800">
      Analytics Dashboard
    </h2>
    <p className="text-slate-600">Insights into your emotional journey</p>
  </div>

  <div className="flex items-center space-x-4">
    {/* Time Range Selector */}
    <select
      value={timeRange}
      onChange={(e) => setTimeRange(Number(e.target.value))}
      className="liquid-glass rounded-xl p-3 text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
    >
      <option value="7">Last 7 Days</option>
      <option value="30">Last 30 Days</option>
      <option value="90">Last 3 Months</option>
      <option value="365">Last Year</option>
    </select>

   {/* Download Dropdown */}
<div className="relative" ref={downloadRef}>
  <button
    className="liquid-glass rounded-xl p-3 hover:bg-white/20 transition-all duration-300"
    title="Export Data"
    onClick={() => setDownloadOpen(!downloadOpen)}
  >
    {/* Download Icon */}
    <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 10v6m0 0l-4-4m4 4l4-4m-6 8h8a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  </button>

  {/* Dropdown menu */}
  {downloadOpen && (
    <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow z-50">
      <button
        onClick={() => {
          const data = {
            avgMood,
            dayStreak,
            totalEntries: validEntries.length,
            trend,
            distribution,
            weeklyPatterns,
            monthlySummary,
            achievements,
            emotionalTrends,
            writingPatterns,
          };
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `analytics-${timeRange}days.json`;
          a.click();
          URL.revokeObjectURL(url);
          setDownloadOpen(false);
        }}
        className="block w-full px-4 py-2 text-sm hover:bg-gray-100 text-left"
      >
        Download JSON
      </button>
      <button
        onClick={() => {
          const rows: string[] = [];
          rows.push("Metric,Value");
          rows.push(`Average Mood,${avgMood.toFixed(2)}`);
          rows.push(`Day Streak,${dayStreak}`);
          rows.push(`Total Entries,${validEntries.length}`);
          rows.push(`Trend,${trend}`);

          Object.entries(distribution).forEach(([mood, percent]) => {
            rows.push(`Mood: ${mood},${percent}%`);
          });

          if (weeklyPatterns.best) {
            rows.push(
              `Best Day (${weeklyPatterns.best.day}),${weeklyPatterns.best.avg.toFixed(2)}`
            );
          }
          if (weeklyPatterns.worst) {
            rows.push(
              `Challenging Day (${weeklyPatterns.worst.day}),${weeklyPatterns.worst.avg.toFixed(2)}`
            );
          }

          const csvContent = rows.join("\n");
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `analytics-${timeRange}days.csv`;
          a.click();
          URL.revokeObjectURL(url);
          setDownloadOpen(false);
        }}
        className="block w-full px-4 py-2 text-sm hover:bg-gray-100 text-left"
      >
        Download CSV
      </button>
    </div>
  )}
</div>


    {/* Refresh Button */}
    <button
      onClick={() => setTimeRange((prev) => prev)} // triggers re-fetch
      className="liquid-glass rounded-xl p-3 hover:bg-white/20 transition-all duration-300"
      title="Refresh Data"
    >
      {/* Refresh Icon */}
      <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  </div>
</div>


      {/* Key Metrics Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Avg Mood */}
  <div className="liquid-glass rounded-2xl p-6 text-center metric-card relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
    <div className="relative z-10">
      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
      </div>
      <div className="text-3xl font-bold text-slate-800 mb-2">
        {avgMood.toFixed(1)}
      </div>
      <div className="text-sm text-slate-600">Average Mood</div>
      <div className="text-xs text-green-600 mt-1">
        {trend >= 0 ? `↗ +${trend}` : `↘ ${trend}`} from last period
      </div>
    </div>
  </div>

 {/* Day Streak */}
<div className="liquid-glass rounded-2xl p-6 text-center metric-card relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10" />
  <div className="relative z-10">
    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </div>
    <div className="text-3xl font-bold text-slate-800 mb-2">
      {dayStreak}
    </div>
    <div className="text-sm text-slate-600">Day Streak</div>
    <div className="text-xs text-green-600 mt-1">
      {dayStreak === personalBest
        ? "🔥 Personal best!"
        : `Best: ${personalBest} days`}
    </div>
  </div>
</div>

{/* Total Entries */}
<div className="liquid-glass rounded-2xl p-6 text-center metric-card relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10" />
  <div className="relative z-10">
    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
      </svg>
    </div>
    <div className="text-3xl font-bold text-slate-800 mb-2">
      {validEntries.length}
    </div>
    <div className="text-sm text-slate-600">Total Entries</div>
    <div className={`text-xs mt-1 ${entryGrowth >= 0 ? "text-blue-600" : "text-red-600"}`}>
      {entryGrowth >= 0
        ? `+${entryGrowth} vs last period`
        : `${entryGrowth} vs last period`}
    </div>
  </div>
</div>


{/* AI Insights */}
  <div className="liquid-glass rounded-2xl p-6 text-center metric-card relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
    <div className="relative z-10">
      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
      </div>
      <div className="text-3xl font-bold text-slate-800 mb-2">0</div>
            <div className="text-sm text-slate-600">AI Insights</div>
            <div className="text-xs text-purple-600 mt-1">Coming soon...</div>
          </div>
        </div>
      </div>

      {/* Mood Journey */}
      <div className="liquid-glass rounded-2xl p-8 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              Mood Journey
            </h3>
            <p className="text-slate-600">
              Your emotional patterns over the selected time period
            </p>
          </div>
        </div>

        {/* Chart */}
        
<div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl p-6 border border-white/50">
  <canvas id="moodChart" className="w-full h-96"></canvas>
</div>


          {/* Chart Summary */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {avgMood.toFixed(1)}
              </div>
              <div className="text-xs text-slate-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {highestDay ? highestDay.avg.toFixed(1) : "-"}
              </div>
              <div className="text-xs text-slate-600">
                {highestDay ? highestDay.day : "Highest Day"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {lowestDay ? lowestDay.avg.toFixed(1) : "-"}
              </div>
              <div className="text-xs text-slate-600">
                {lowestDay ? lowestDay.day : "Lowest Day"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {trend >= 0 ? `↗ +${trend}` : `↘ ${trend}`}
              </div>
              <div className="text-xs text-slate-600">Trend</div>
            </div>
          </div>
        </div>
      

{/* Wrapper for side-by-side layout */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Mood Distribution */}
  <div className="liquid-glass rounded-2xl p-8">
    <h3 className="text-xl font-bold text-slate-800 mb-6">Mood Distribution</h3>
    <div className="space-y-5">
      {Object.entries(distribution).map(([mood, percent]) => {
        const moodConfig: Record<string, { emoji: string; className: string }> = {
          happy: { emoji: "😊", className: "mood-happy" },
          sad: { emoji: "😢", className: "mood-sad" },
          anxious: { emoji: "😰", className: "mood-anxious" },
          tired: { emoji: "🥱", className: "mood-tired" },
          okay: { emoji: "😐", className: "mood-okay" },
          excited: { emoji: "🤩", className: "mood-excited" },
          calm: { emoji: "😌", className: "mood-calm" },
          overwhelmed: { emoji: "🤯", className: "mood-overwhelmed" },
          angry: { emoji: "😠", className: "mood-angry" },
        };

        const config = moodConfig[mood.toLowerCase()] || {
          emoji: "🙂",
          className: "bg-slate-400",
        };

        return (
          <div key={mood} className="flex items-center justify-between">
            {/* Left side: Emoji + Label */}
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{config.emoji}</span>
              <span className="text-slate-700 font-medium capitalize">{mood}</span>
            </div>

            {/* Right side: Progress bar + % */}
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`${config.className} h-2 rounded-full`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-sm text-slate-600 w-10 text-right">{percent}%</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {/* ================== WEEKLY PATTERNS ================== */}
  <div className="liquid-glass rounded-2xl p-8">
    <h3 className="text-xl font-bold text-slate-800 mb-6">Weekly Patterns</h3>
    <div className="space-y-4">
      {/* Best Day */}
      <div className="bg-white/20 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Best Day</span>
          <span className="text-sm text-green-600 font-bold">
            {weeklyPatterns.best?.day ?? "—"}
          </span>
        </div>
        <div className="text-xs text-slate-600">
          Average mood: {weeklyPatterns.best ? weeklyPatterns.best.avg.toFixed(1) : "—"}/10
        </div>
      </div>

      {/* Most Challenging */}
      <div className="bg-white/20 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Most Challenging</span>
          <span className="text-sm text-orange-600 font-bold">
            {weeklyPatterns.worst?.day ?? "—"}
          </span>
        </div>
        <div className="text-xs text-slate-600">
          Average mood: {weeklyPatterns.worst ? weeklyPatterns.worst.avg.toFixed(1) : "—"}/10
        </div>
      </div>

      {/* Most Consistent */}
      <div className="bg-white/20 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Most Consistent</span>
          <span className="text-sm text-blue-600 font-bold">
            {weeklyPatterns.consistent?.day ?? "—"}
          </span>
        </div>
        <div className="text-xs text-slate-600">Lowest variance in mood</div>
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <svg
            className="w-4 h-4 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="text-sm font-medium text-indigo-800">AI Insight</span>
        </div>
        <p className="text-xs text-indigo-700">
          Your mood tends to {trend > 0 ? "improve" : "decline"} compared to last period.{" "}
          {weeklyPatterns.best?.day ? `Peaks on ${weeklyPatterns.best.day}.` : ""}
        </p>
      </div>
    </div>
  </div>
</div>

{/* ================== MONTHLY SUMMARY & ACHIEVEMENTS ================== */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
  {/* Monthly Summary */}
  <div className="lg:col-span-2 liquid-glass rounded-2xl p-8">
    <h3 className="text-xl font-bold text-slate-800 mb-6">Monthly Summary</h3>
    <div className="grid grid-cols-2 gap-6">
      {/* This Month */}
      <div className="space-y-4">
        <div className="bg-white/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {monthlySummary.avgThisMonth.toFixed(1)}
          </div>
          <div className="text-sm text-slate-600">This Month Average</div>
          <div className="text-xs text-green-600 mt-1">
            {monthlySummary.avgLastMonth
              ? `↗ ${(monthlySummary.avgThisMonth - monthlySummary.avgLastMonth).toFixed(1)} from last month`
              : "—"}
          </div>
        </div>
        <div className="bg-white/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {monthlySummary.totalEntries}
          </div>
          <div className="text-sm text-slate-600">Entries This Month</div>
          <div className="text-xs text-blue-600 mt-1">
            {monthlySummary.completionRate}% completion rate
          </div>
        </div>
      </div>

      {/* Last Month + Words */}
      <div className="space-y-4">
        <div className="bg-white/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {monthlySummary.avgLastMonth.toFixed(1)}
          </div>
          <div className="text-sm text-slate-600">Last Month Average</div>
          <div className="text-xs text-slate-600 mt-1">Previous period</div>
        </div>
        <div className="bg-white/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {monthlySummary.wordCount}
          </div>
          <div className="text-sm text-slate-600">Words Written</div>
          <div className="text-xs text-orange-600 mt-1">
            {/* Placeholder growth — you can compute delta if needed */}
            vs last month TBD
          </div>
        </div>
      </div>
    </div>

    {/* Progress Visualization */}
    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-green-800">Monthly Goal Progress</span>
        <span className="text-sm text-green-700 font-bold">
          {monthlySummary.completionRate}%
        </span>
      </div>
      <div className="w-full bg-white/50 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full"
          style={{ width: `${monthlySummary.completionRate}%` }}
        ></div>
      </div>
      <div className="text-xs text-green-700 mt-2">
        {monthlySummary.totalEntries} out of {new Date().getDate()} days completed
      </div>
    </div>
  </div>

  {/* Achievements */}
  <div className="liquid-glass rounded-2xl p-8">
    <h3 className="text-xl font-bold text-slate-800 mb-6">Recent Achievements</h3>
    <div className="space-y-4">
      {achievements.map((ach, i) => (
        <div
          key={i}
          className={`achievement-card flex items-center space-x-3 p-3 rounded-lg border ${
            ach.unlocked
              ? "bg-gradient-to-r from-green-50 to-teal-50 border-green-200"
              : "bg-white/20 border-slate-200 opacity-60"
          }`}
        >
          <div className="text-2xl">{ach.unlocked ? "🏆" : "🔒"}</div>
          <div>
            <div className="text-sm font-medium text-slate-800">{ach.title}</div>
            <div className="text-xs text-slate-700">{ach.description}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

{/* ================== DETAILED ANALYTICS GRID ================== */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Emotional Trends */}
  <div className="liquid-glass rounded-2xl p-8">
    <h3 className="text-xl font-bold text-slate-800 mb-6">Emotional Trends</h3>
    <div className="space-y-6">
      {/* Frequent Emotions */}
      <div className="bg-white/20 rounded-lg p-4">
        <h4 className="font-medium text-slate-800 mb-3">Most Frequent Emotions</h4>
        <div className="space-y-2">
          {Object.entries(emotionalTrends.percentages)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([mood, pct]) => (
              <div className="flex justify-between items-center" key={mood}>
                <span className="text-sm text-slate-700">{mood}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-white/30 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-indigo-400 to-purple-500 h-1.5 rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-600 w-8">{pct}%</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Emotional Stability */}
      <div className="bg-white/20 rounded-lg p-4">
        <h4 className="font-medium text-slate-800 mb-3">Emotional Stability</h4>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Consistency Score</span>
          <span className="text-sm font-bold text-indigo-600">
            {emotionalTrends.stability}%
          </span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-400 to-purple-500 h-2 rounded-full"
            style={{ width: `${emotionalTrends.stability}%` }}
          ></div>
        </div>
        <p className="text-xs text-slate-600 mt-2">
          Your mood has been relatively {emotionalTrends.stability > 70 ? "stable" : "variable"} this month
        </p>
      </div>
    </div>
  </div>

  {/* Writing Patterns */}
  <div className="liquid-glass rounded-2xl p-8">
    <h3 className="text-xl font-bold text-slate-800 mb-6">Writing Patterns</h3>
    <div className="space-y-6">
      {/* Peak Writing Times */}
      <div className="bg-white/20 rounded-lg p-4">
        <h4 className="font-medium text-slate-800 mb-3">Peak Writing Times</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(writingPatterns.buckets).map(([period, count]) => {
            const pct = Math.round((count / validEntries.length) * 100) || 0;
            return (
              <div className="text-center p-2 bg-white/20 rounded" key={period}>
                <div className="text-lg font-bold text-blue-600">{pct}%</div>
                <div className="text-xs text-slate-600 capitalize">{period}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Avg Entry Length */}
      <div className="bg-white/20 rounded-lg p-4">
        <h4 className="font-medium text-slate-800 mb-3">Average Entry Length</h4>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {writingPatterns.avgLength}
          </div>
          <div className="text-sm text-slate-600">Words per entry</div>
          {/* TODO: show delta vs last month once computed */}
        </div>
      </div>

      {/* Writing Tip */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <svg
            className="w-4 h-4 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="text-sm font-medium text-purple-800">Writing Tip</span>
        </div>
        <p className="text-xs text-purple-700">{writingPatterns.tip}</p>
      </div>
    </div>
  </div>
</div>


      
    </div>
  );
};

export default Analytics;
