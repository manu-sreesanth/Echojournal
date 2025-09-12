"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchEntries, fetchPreviousEntries } from "@/lib/fetchEntries";
import {
  calculateAverageMood,
  calculateDayStreak,
  calculateWeeklyGoalProgress,
} from "@/lib/analytics";
import MiniMoodChart from "@/components/charts/MiniMoodChart";
import { JournalEntry } from "@/types/JournalEntry";
import { getUserProfile } from "@/firebase/firestoreFunctions";
import { moodEmojiMap, getMoodEmoji } from "@/config/moodScores";
import { calculateAchievements} from "@/lib/analyticsExtended";



type Insight = {
  icon: string;
  title: string;
  description: string;
  style: "green" | "blue" | "purple";
};

//
// ✅ Mood helpers
//
export const moodToEmoji = (mood: string) => {
  return moodEmojiMap[mood] || "🙂";
};

export const getMoodMessage = (mood: string) => {
  switch (mood) {
    case "sad":
    case "anxious":
    case "angry":
    case "overwhelmed":
      return "Tough day — take it easy on yourself.";
    case "okay":
    case "tired":
    case "calm":
      return "You’re doing okay. Stay balanced!";
    case "happy":
    case "excited":
      return "You're feeling great today! Keep up the positive energy.";
    default:
      return "Keep reflecting — every entry helps!";
  }
};

// ✅ helper: map numeric score → mood string
export const getMoodFromScore = (score: number): string => {
  if (score <= 1.5) return "sad";
  if (score <= 2.5) return "angry";
  if (score <= 4.5) return "anxious";
  if (score <= 5.5) return "tired";
  if (score <= 6.5) return "okay";
  if (score <= 7.5) return "calm";
  if (score <= 8.5) return "happy";
  return "excited";
};

// ✅ helper: get today's entries
const getTodaysEntries = (entries: JournalEntry[]) => {
  const today = new Date();
  return entries.filter((entry) => {
    if (!entry.createdAt) return false;
    const d = entry.createdAt;
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });
};

type DashboardProps = {
  setView: (view: "dashboard" | "editor" | "analytics" | "myentries" | "guide") => void;
};

export default function Dashboard({ setView }: DashboardProps) {
  const { user } = useAuth();

  const [recentEntries, setEntries] = useState<JournalEntry[]>([]);
  const [averageMood, setAverageMood] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const [isReturning, setIsReturning] = useState(false);


  const [entriesToday, setEntriesToday] = useState(0);
  const [todaysMood, setTodaysMood] = useState<string | null>(null);
  const [avgMoodToday, setAvgMoodToday] = useState<number | null>(null);
  const [wordsToday, setWordsToday] = useState(0);
  const [timeSpentToday, setTimeSpentToday] = useState(0);
  const [achievements, setAchievements] = useState<
  { title: string; description: string; unlocked: boolean }[]
>([]);


  const [thisWeekMood, setThisWeekMood] = useState<number | null>(null);
  const [lastWeekMood, setLastWeekMood] = useState<number | null>(null);

const [insights, setInsights] = useState<Insight[]>([]);
const [loadingInsights, setLoadingInsights] = useState(false);
const [lastEntryCount, setLastEntryCount] = useState(0);

useEffect(() => {
  if (!user) return;

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch(`/api/insights?uid=${user.uid}`);
      const data = await res.json();
      setInsights(data.insights || []);
    } catch (e) {
      console.error("Error fetching insights", e);
    } finally {
      setLoadingInsights(false);
    }
  };

  // 1️⃣ Run once on first load
  if (lastEntryCount === 0 && recentEntries.length > 0) {
    fetchInsights();
    setLastEntryCount(recentEntries.length);
  }

  // 2️⃣ Refresh only if a new entry is added
  if (recentEntries.length > lastEntryCount) {
    fetchInsights();
    setLastEntryCount(recentEntries.length);
  }
}, [user, recentEntries, lastEntryCount]);


useEffect(() => {
  if (!user) return;

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch(`/api/insights?uid=${user.uid}`);
      const data = await res.json();
      setInsights(data.insights || []);
    } catch (e) {
      console.error("Error fetching insights", e);
    } finally {
      setLoadingInsights(false);
    }
  };

  fetchInsights();
}, [user, recentEntries]); // refresh when entries change

  useEffect(() => {
  if (!user) return;

  const loadData = async () => {
    // ✅ 1. fetch last 30 days
    const recentEntries = await fetchEntries(user.uid, 30);
    setEntries(recentEntries);
    setTotalEntries(recentEntries.length);
    setIsReturning(recentEntries.length > 0);


    // weekly averages
    const thisWeek = calculateAverageMood(recentEntries);
    setThisWeekMood(thisWeek);

    const prevEntries = await fetchPreviousEntries(user.uid, 7);
    const lastWeek = calculateAverageMood(prevEntries);
    setLastWeekMood(lastWeek);

    // ✅ mood trend
    const trend = thisWeek - lastWeek;

    // ✅ 2. average mood overall
    const avg = calculateAverageMood(recentEntries);
    setAverageMood(avg);

    // ✅ 3. streak
    const currentStreak = calculateDayStreak(recentEntries);
    setStreak(currentStreak);

    // ✅ 4. achievements (use local trend + streak, not stale state!)
    const achievements = calculateAchievements(recentEntries, trend, currentStreak);
    setAchievements(achievements);

    // ✅ 5. today's entries
    const todayEntries = getTodaysEntries(recentEntries);
    setEntriesToday(todayEntries.length);

    if (todayEntries.length > 0) {
      const avgMoodToday = calculateAverageMood(todayEntries); // number
      setAvgMoodToday(avgMoodToday);
      setTodaysMood(getMoodFromScore(avgMoodToday)); // map to string

      // words count
      const totalWords = todayEntries.reduce(
        (sum, e) => sum + e.content.split(" ").length,
        0
      );
      setWordsToday(totalWords);

      // mock time spent (5m per entry until tracked properly)
      setTimeSpentToday(todayEntries.length * 5);
    }

    // ✅ 6. user profile
    const profile = await getUserProfile(user.uid);
    const name =
      profile?.personalDetails?.nickname ||
      profile?.personalDetails?.firstName ||
      user.displayName ||
      "Friend";
    setUserName(name);
  };

  loadData();
}, [user]);



  const weeklyGoal = calculateWeeklyGoalProgress(recentEntries, 7);

  return (
    <div className="space-y-10 pr-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold mb-2 text-slate-800">
  {isReturning ? "Welcome back" : "Welcome"}, {userName}! 👋
</h2>

          <p className="text-slate-600">Ready to reflect on your day?</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-slate-600">Current streak</div>
            <div className="text-2xl font-bold text-indigo-600">
              {streak} days
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">

      {/* Card: New Entry */}
      <div
        onClick={() => setView("editor")}
        className="liquid-glass rounded-xl p-4 cursor-pointer hover:scale-105 transition-all duration-300"
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">New Entry</div>
            <div className="text-xs text-slate-600">Start writing</div>
          </div>
        </div>
      </div>

      {/* Card: Guide Me */}
<div
  onClick={() => setView("guide")}
  className="liquid-glass rounded-xl p-4 cursor-pointer hover:scale-105 transition-all duration-300"
>
  <div className="flex flex-col items-center text-center space-y-2">
    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    </div>
    <div>
      <div className="font-semibold text-slate-800 text-sm">Guide Me</div>
      <div className="text-xs text-slate-600">Open Guide</div>
    </div>
  </div>
</div>


      {/* Card: My Entries */}
      <div
        onClick={() => setView("myentries")}
        className="liquid-glass rounded-xl p-4 cursor-pointer hover:scale-105 transition-all duration-300"
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">My Entries</div>
            <div className="text-xs text-slate-600">Browse all</div>
          </div>
        </div>
      </div>

      {/* Card: Analytics */}
      <div
        onClick={() => setView("analytics")}
        className="liquid-glass rounded-xl p-4 cursor-pointer hover:scale-105 transition-all duration-300"
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">Analytics</div>
            <div className="text-xs text-slate-600">View insights</div>
          </div>
        </div>
      </div>

              {/* Card: Weekly (Coming soon) */}
        <div className="liquid-glass rounded-xl p-4 cursor-not-allowed opacity-60 relative">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">Weekly</div>
              <div className="text-xs text-slate-600">Coming soon</div>
            </div>
          </div>
          <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
            Soon
          </div>
        </div>

        {/* Card: Monthly (Coming soon) */}
        <div className="liquid-glass rounded-xl p-4 cursor-not-allowed opacity-60 relative">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14m-14 0a2 2 0 002 2v2a2 2 0 01-2 2"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">Monthly</div>
              <div className="text-xs text-slate-600">Coming soon</div>
            </div>
          </div>
          <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
            Soon
          </div>
        </div>
      </div>


      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Average Mood */}
        <div className="liquid-glass rounded-2xl p-6 text-center metric-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-2">
              {averageMood?.toFixed(1) ?? "--"}
            </div>
            <div className="text-sm text-slate-600">Average Mood</div>
          </div>
        </div>

        {/* Total Entries */}
        <div className="liquid-glass rounded-2xl p-6 text-center metric-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-2">
              {totalEntries}
            </div>
            <div className="text-sm text-slate-600">Total Entries</div>
          </div>
        </div>

        
       {/* Weekly Goal */}
<div className="liquid-glass rounded-2xl p-6 text-center metric-card relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10"></div>
  <div className="relative z-10">
    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
    <div className="text-3xl font-bold text-slate-800 mb-2">
      {weeklyGoal.daysCompleted}/{weeklyGoal.goal}
    </div>
    <div className="text-sm text-slate-600">Weekly Goal</div>
    <div className="text-xs text-orange-600 mt-1">
      {weeklyGoal.goal - weeklyGoal.daysCompleted > 0
        ? `${weeklyGoal.goal - weeklyGoal.daysCompleted} more to go!`
        : "Goal achieved 🎉"}
    </div>
  </div>
</div>


        {/* Card: AI Insights (Coming Soon) */}
<div className="liquid-glass rounded-2xl p-6 text-center metric-card relative overflow-hidden cursor-not-allowed opacity-60">
  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
  <div className="relative z-10">
    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    </div>
    <div className="text-3xl font-bold text-slate-800 mb-2">—</div>
    <div className="text-sm text-slate-600">AI Insights</div>
  </div>

  {/* "Soon" badge */}
  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
    Soon
  </div>
</div>
      </div>


      

{/* Today's Overview & Quick Actions */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
  
  {/* Today's Overview */}
  <div className="lg:col-span-2 liquid-glass rounded-2xl p-8">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-2xl font-bold text-slate-800">Today's Overview</h3>
      <div className="text-sm text-slate-600">
        {new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </div>
    </div>

    {/* Mood Check-in */}
<div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-6">
  <div className="flex items-center justify-between mb-4">
    <h4 className="text-lg font-semibold text-indigo-800">
      How are you feeling today?
    </h4>
    <div className="text-2xl">
      {todaysMood ? moodToEmoji(todaysMood) : "—"}
    </div>
  </div>

  {/* Quick emoji palette (could later be interactive) */}
  <div className="flex justify-between items-center space-x-2">
          {["sad", "anxious", "okay", "happy", "excited", "calm"].map(
            (moodKey, i) => (
              <span key={i} className="text-2xl">
                {moodToEmoji(moodKey)}
              </span>
    ))}
  </div>

  <div className="mt-4 text-sm text-indigo-700">
    {todaysMood
            ? getMoodMessage(todaysMood)
      : "No mood tracked yet today."}
  </div>
</div>


    {/* Quick Stats */}
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white/20 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-600">
          {wordsToday}
        </div>
        <div className="text-sm text-slate-600">Words Today</div>
      </div>
      <div className="bg-white/20 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">
          {timeSpentToday}m
        </div>
        <div className="text-sm text-slate-600">Time Spent</div>
      </div>
    </div>

    {/* Today's Entry Preview */}
    <div className="bg-white/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-medium text-slate-800">Today's Entry</h5>
        {entriesToday > 0 && (
          <button
            onClick={() => setView("editor")}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Continue →
          </button>
        )}
      </div>
      <div className="text-slate-700 text-sm">
        {entriesToday > 0
          ? getTodaysEntries(recentEntries)[0]?.content.slice(0, 100) + "..."
          : "Start writing about your day..."}
      </div>
    </div>
  </div>



  

{/* Quick Actions */}
<div className="liquid-glass rounded-2xl p-8">
  <h3 className="text-xl font-bold text-slate-800 mb-6">Quick Actions</h3>
  <div className="space-y-4">
    
    {/* New Journal Entry */}
    <button
      onClick={() => setView("editor")}
      className="w-full p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
    >
      <div className="flex items-center space-x-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>New Journal Entry</span>
      </div>
    </button>

    {/* View Analytics */}
    <button
      onClick={() => setView("analytics")}
      className="w-full p-4 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl text-white font-medium hover:from-green-600 hover:to-teal-700 transition-all duration-300"
    >
      <div className="flex items-center space-x-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>View Analytics</span>
      </div>
    </button>

    {/* Browse Entries */}
    <button
      onClick={() => setView("myentries")}
      className="w-full p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl text-white font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-300"
    >
      <div className="flex items-center space-x-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span>Browse Entries</span>
      </div>
    </button>

    {/* Set Tasks (Coming Soon) */}
<button
      disabled
      className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white font-medium opacity-70 cursor-not-allowed transition-all duration-300"
    >
      <div className="flex items-center space-x-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Set Tasks (Soon)</span>
      </div>
    </button>
  </div>





    {/* Weekly Progress */}
<div className="mt-8 p-4 bg-white/20 rounded-lg">
  <h4 className="font-medium text-slate-800 mb-3">Weekly Progress</h4>

  <div className="flex justify-between items-center mb-2">
    <span className="text-sm text-slate-600">
      {weeklyGoal.daysCompleted} of {weeklyGoal.goal} days
    </span>
    <span className="text-sm font-bold text-green-600">
      {weeklyGoal.percent.toFixed(0)}%
    </span>
  </div>

  <div className="w-full bg-white/30 rounded-full h-2">
    <div
      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
      style={{ width: `${weeklyGoal.percent}%` }}
    />
  </div>
</div>

  
  </div>
</div>

{/* Recent Entries & Mood Trends */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
  {/* Recent Entries */}
  <div className="liquid-glass rounded-2xl p-8">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-bold text-slate-800">Recent Entries</h3>
      <button
        onClick={() => setView("myentries")}
        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
      >
        View All →
      </button>
    </div>
    <div className="space-y-4">
      {recentEntries.slice(0, 3).map((entry) => (
        <div
          key={entry.id}
          onClick={() => setView("myentries")}
          className="entry-card bg-white/20 rounded-lg p-4 cursor-pointer hover:bg-white/30 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{getMoodEmoji(entry.mood)}</span>
              <span className="text-sm text-slate-600">
  {entry.createdAt
    ? entry.createdAt.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown date"}
</span>

            </div>
            <span className="text-xs text-slate-500">
  {entry.content ? entry.content.split(/\s+/).length : 0} words
</span>

          </div>
          <p className="text-slate-700 text-sm mb-3">
  {entry.content.length > 100
    ? entry.content.slice(0, 100) + "..."
    : entry.content}
</p>
          <div className="flex flex-wrap gap-1">
            {entry.tags?.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}

      {recentEntries.length === 0 && (
        <p className="text-slate-500 text-sm">No recent entries found.</p>
      )}
    </div>
  </div>

  {/* Mood Trends */}
  <div className="liquid-glass rounded-2xl p-8">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-bold text-slate-800">Mood Trends</h3>
      <button
        onClick={() => setView("analytics")}
        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
      >
        Details →
      </button>
    </div>

   {/* Mini Chart */}
<div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl p-4 mb-4">
  <MiniMoodChart entries={recentEntries} />
</div>


    {/* Mood Summary */}
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-3 bg-white/20 rounded-lg">
        <div className="text-lg font-bold text-green-600">
          {thisWeekMood !== null ? thisWeekMood.toFixed(1) : "—"}
        </div>
        <div className="text-xs text-slate-600">This Week</div>
      </div>
      <div className="text-center p-3 bg-white/20 rounded-lg">
        <div className="text-lg font-bold text-blue-600">
          {lastWeekMood !== null ? lastWeekMood.toFixed(1) : "—"}
        </div>
        <div className="text-xs text-slate-600">Last Week</div>
      </div>
    </div>
  </div>
</div>


{/* AI Insights & Achievements */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* AI Insights */}
  <div className="lg:col-span-2 liquid-glass rounded-2xl p-8">
    <div className="flex items-center space-x-3 mb-6">
      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-800">AI Insights</h3>
    </div>

    <div className="space-y-4">
      {loadingInsights ? (
        <p className="text-slate-500 text-sm">Generating insights...</p>
      ) : (
        insights.map((insight, i) => {
          // map styles to tailwind classes
          const styleMap: Record<string, string> = {
            green: "from-green-50 to-emerald-50 border-green-200",
            blue: "from-blue-50 to-indigo-50 border-blue-200",
            purple: "from-purple-50 to-pink-50 border-purple-200",
          };
          const styleClasses = styleMap[insight.style] || "from-slate-50 to-gray-50 border-slate-200";

          return (
            <div
              key={i}
              className={`bg-gradient-to-r ${styleClasses} border rounded-lg p-4`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{insight.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800 mb-1">{insight.title}</h4>
                  <p className="text-slate-700 text-sm">{insight.description}</p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>



  {/* Achievements */}
{/* Achievements */}
<div className="liquid-glass rounded-2xl p-8 mt-6">
  <h3 className="text-xl font-bold text-slate-800 mb-6">Recent Achievements</h3>
  <div className="space-y-4">
    {achievements.map((ach, i) => {
      const icons = ["🔥", "📝", "🌱", "🎯"];
      const icon = icons[i] || "🏆";

      return (
        <div
          key={i}
          className={`achievement-card flex items-center space-x-3 p-3 rounded-lg border ${
            ach.unlocked
              ? "bg-gradient-to-r from-green-50 to-teal-50 border-green-200"
              : "bg-white/20 border-slate-200 opacity-60"
          }`}
        >
          <div className={`text-2xl ${!ach.unlocked ? "grayscale" : ""}`}>
            {icon}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-800">
              {ach.title}
            </div>
            <div className="text-xs text-slate-700">{ach.description}</div>
          </div>
          {ach.unlocked && (
            <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
          )}
        </div>
      );
    })}
  </div>
</div>


</div>



      
    </div>
  );
}


