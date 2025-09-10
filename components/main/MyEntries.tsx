"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getJournalEntries } from "@/firebase/firestoreFunctions"; // adjust path
import { useAuth } from "@/context/AuthContext"; // assuming you have auth context
import { useRouter } from "next/navigation";
import EntryEditModal from "./EntryEditModal";
import { Entry } from "@/types/journal";
import { calculateAverageMood, calculateMoodTrend } from "@/lib/analytics";
import { Sparkles } from "lucide-react";
import { ReactNode } from "react";
import ViewEntryModal from "@/components/main/ViewEntryModal";


// ------------------------
// Types / Constants
// ------------------------
const moodEmojiMap: Record<string, string> = {
  sad: "😢",
  anxious: "😰",
  tired: "😴",
  okay: "😐",
  happy: "😊",
  excited: "🤩",
  calm: "😌",
  overwhelmed: "🤯",
  angry: "😠",
};

type ViewType = "dashboard" | "editor" | "analytics" | "myentries" | "guide";

type MyEntriesProps = {
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
};

// ------------------------
// Helpers
// ------------------------
/**
 * Convert a value to a Date safely:
 * - Firestore Timestamp (has toDate())
 * - JS Date
 * - ISO date string / number timestamp
 */
const toDateSafe = (d: any): Date | undefined => {
  if (!d) return undefined;
  if (typeof d.toDate === "function") return d.toDate(); // Firestore Timestamp
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

/** Sort entries by createdAt DESC (newest first). Handles missing dates gracefully. */
const sortEntriesByDateDesc = (items: Entry[]) =>
  [...items].sort((a, b) => {
    const at = toDateSafe(a.createdAt) ? toDateSafe(a.createdAt)!.getTime() : 0;
    const bt = toDateSafe(b.createdAt) ? toDateSafe(b.createdAt)!.getTime() : 0;
    return bt - at;
  });



  
// ------------------------
// Component
// ------------------------
export default function MyEntries({ setView }: MyEntriesProps) {
  const { user } = useAuth(); // ✅ assumes Firebase auth context
  const router = useRouter();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All Entries");
  const [layoutView, setLayoutView] = useState<"grid" | "list">("grid");
  const [editing, setEditing] = useState<Entry | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [viewing, setViewing] = useState<Entry | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);


  const openEdit = (entry: Entry) => {
    setEditing(entry);
    setIsEditOpen(true);
  };

  const closeEdit = () => setIsEditOpen(false);

  // ------------------------
  // Load Entries (normalized + sorted)
  // ------------------------
  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      try {
        const data = await getJournalEntries(user.uid);
        // Normalize createdAt to Date (if needed) and sort newest-first
        const normalized: Entry[] = data.map((e: Entry) => ({
          ...e,
          createdAt: toDateSafe((e as any).createdAt) as any,
        }));
        setEntries(sortEntriesByDateDesc(normalized));
      } catch (err) {
        console.error("Failed to load entries:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  // ------------------------
  // Filter + Search
  // ------------------------
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Search
    if (searchQuery) {
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter
    if (filter === "Recent") {
      // keep sorted (entries already sorted by date desc)
      result = sortEntriesByDateDesc(result);
    } else if (filter === "Favorites") {
      result = result.filter((e) => e.favorite);
    } else if (filter.includes("Mood")) {
      const mood = filter.split(" ")[0].toLowerCase();
      result = result.filter((e) => e.mood?.toLowerCase() === mood);
    } else {
      // default: ensure newest-first
      result = sortEntriesByDateDesc(result);
    }

    return result;
  }, [entries, searchQuery, filter]);

  // ------------------------
  // Stats
  // ------------------------
  const stats = useMemo(() => {
  const totalEntries = entries.length;
  const thisMonth = entries.filter(
    (e) =>
      e.createdAt &&
      (e.createdAt as unknown as Date).getMonth() === new Date().getMonth() &&
      (e.createdAt as unknown as Date).getFullYear() === new Date().getFullYear()
  ).length;
  const favorites = entries.filter((e) => e.favorite).length;
  const totalWords = entries.reduce(
    (sum, e) => sum + (e.content?.split(" ").length || 0),
    0
  );

// ✅ All-time average mood
const avgMood = calculateAverageMood(entries.filter(e => !!e.mood));

// ✅ Compare last 30 days vs previous 30 days (trend)
const now = new Date();
const last30 = new Date(now);
last30.setDate(last30.getDate() - 30);
const prev30 = new Date(now);
prev30.setDate(prev30.getDate() - 60);

const last30Entries = entries.filter(e => e.createdAt && e.createdAt >= last30);
const prev30Entries = entries.filter(
  e => e.createdAt && e.createdAt >= prev30 && e.createdAt < last30
);

const moodTrend = calculateMoodTrend(last30Entries, prev30Entries);


  return {
    totalEntries,
    thisMonth,
    favorites,
    totalWords,
    avgMood,
    moodTrend,
  };
}, [entries]);





  // ------------------------
  // Handlers
  // ------------------------
  const toggleFavorite = (id: string) => {
    setEntries((prev) =>
      // update then re-sort
      sortEntriesByDateDesc(
        prev.map((e) => (e.id === id ? { ...e, favorite: !e.favorite } : e))
      )
    );
    // TODO: persist favorite to Firestore
  };

  // ------------------------
  // UI
  // ------------------------
  return (
    <div className="space-y-10 pr-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold mb-2 text-slate-800">My Library</h2>
          <p className="text-slate-600">Your personal collection of thoughts and reflections</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input liquid-glass rounded-xl p-3 pr-10 text-slate-800 bg-transparent border-none focus:outline-none focus:bg-white/20 transition-all duration-300 w-64"
            />
            <svg
              className="w-5 h-5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="liquid-glass rounded-xl p-3 text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            <option>All Entries</option>
            <option>Recent</option>
            <option>Favorites</option>
            <option>Happy Mood</option>
            <option>Sad Mood</option>
            <option>Excited Mood</option>
            <option>Calm Mood</option>
            <option>Anxious Mood</option>
            <option>Tired Mood</option>
            <option>Okay Mood</option>
            <option>Overwhelmed Mood</option>
            <option>Angry Mood</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 liquid-glass rounded-xl p-2">
            <button
              onClick={() => setLayoutView("grid")}
              className={`p-2 rounded-lg ${layoutView === "grid" ? "bg-indigo-500/20 text-indigo-600" : "hover:bg-white/20 text-slate-600"}`}
            >
              {/* Grid Icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setLayoutView("list")}
              className={`p-2 rounded-lg ${layoutView === "list" ? "bg-indigo-500/20 text-indigo-600" : "hover:bg-white/20 text-slate-600"}`}
            >
              {/* List Icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* New Entry Button */}
          <button
            onClick={() => setView("editor")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-md hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span className="whitespace-nowrap">New Entry</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Entries" value={stats.totalEntries.toString()} color="text-indigo-600" />
        <StatCard label="This Month" value={stats.thisMonth.toString()} color="text-green-600" />
        <StatCard label="Favorites" value={stats.favorites.toString()} color="text-purple-600" />
        <StatCard label="Total Words" value={`${(stats.totalWords / 1000).toFixed(1)}k`} color="text-orange-600" />
        <StatCard
  label="Avg Mood"
  value={stats.avgMood ? stats.avgMood.toFixed(1) : "-"}
  color="text-cyan-600"
  trend={stats.moodTrend}
/>

      </div>

      {/* Entries Grid/List */}
      {loading ? (
        <p className="text-slate-500">Loading entries...</p>
      ) : filteredEntries.length === 0 ? (
        <p className="text-slate-500">No entries found.</p>
      ) : (
        <div className={layoutView === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
          {filteredEntries.map((entry) => (
            <EntryCard
              key={entry.id}
               mood={
    moodEmojiMap[entry.mood?.toLowerCase()]
      ? moodEmojiMap[entry.mood.toLowerCase()]
      : <Sparkles className="w-5 h-5 text-indigo-500" />
  }
              title={entry.title || "Untitled"}
              date={entry.createdAt ? (entry.createdAt as unknown as Date).toDateString() : ""}
              preview={entry.content.slice(0, 120) + "..."}
              tags={entry.tags && entry.tags.length > 0 ? entry.tags : []}
              words={entry.content.trim().split(/\s+/).length.toString()}
              favorite={entry.favorite ?? false}
                onEdit={() => {
    setEditing(entry);
    setIsEditOpen(true);
  }}
  onToggleFavorite={() => toggleFavorite(entry.id)}
  onClick={() => {
    setViewing(entry);
    setIsViewOpen(true);
  }}
/>
          ))}
        </div>
      )}

      <ViewEntryModal
  open={isViewOpen}
  entry={viewing}
  onClose={() => setIsViewOpen(false)}
  onEdit={(entry) => {
    setViewing(null);
    setIsViewOpen(false);
    setEditing(entry);
    setIsEditOpen(true);
  }}
  onToggleFavorite={(id) => toggleFavorite(id)}
/>


      {/* 🔽 Render Edit Modal at the bottom */}
      <EntryEditModal
        open={isEditOpen}
        entry={editing}
        onClose={() => setIsEditOpen(false)}
        onSaved={(updated) =>
          setEntries((prev) => sortEntriesByDateDesc(prev.map((e) => (e.id === updated.id ? updated : e))))
        }
        onDeleted={(id) => setEntries((prev) => sortEntriesByDateDesc(prev.filter((e) => e.id !== id)))}
      />
    </div>
  );
}



/* --- Reusable Components --- */
type StatCardProps = {
  label: string;
  value: string;
  color: string;
  trend?: number; 
};

function StatCard({ label, value, color, trend }: StatCardProps) {
  let trendLabel = null;

  if (trend !== undefined) {
    if (trend > 0) {
      trendLabel = (
        <span className="text-green-600 text-xs flex items-center gap-1">
          ↑ {trend.toFixed(1)}
        </span>
      );
    } else if (trend < 0) {
      trendLabel = (
        <span className="text-red-600 text-xs flex items-center gap-1">
          ↓ {Math.abs(trend).toFixed(1)}
        </span>
      );
    } else {
      trendLabel = (
        <span className="text-gray-500 text-xs flex items-center gap-1">
          → 0
        </span>
      );
    }
  }

  return (
    <div className="liquid-glass rounded-xl p-4 text-center flex flex-col items-center">
      <div className={`text-2xl font-bold mb-1 ${color}`}>{value}</div>
      <div className="text-xs text-slate-600">{label}</div>
      {trendLabel && <div className="mt-1 flex justify-center">{trendLabel}</div>}
    </div>
  );
}


type EntryCardProps = {
  mood: ReactNode;
  title: string;
  date: string;
  preview: string;
  tags: string[];
  words: string;
  favorite?: boolean;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onClick: () => void; 
};

function EntryCard({
  mood,
  title,
  date,
  preview,
  tags,
  words,
  favorite,
  onEdit,
  onToggleFavorite,
  onClick, // ✅ add this
}: EntryCardProps) {
  return (
    <div
      className="journal-card rounded-2xl p-6 cursor-pointer group"
      onClick={onClick} // ✅ now works
    >


      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl flex items-center justify-center">{mood}</span>
          <div>
            <h3 className="font-semibold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{title}</h3>
            <p className="text-sm text-slate-600">{date}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {favorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="text-red-500"
            >
              ❤️
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>
      <p className="text-slate-700 text-sm leading-relaxed mb-4">{preview}</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-indigo-500/20 text-indigo-700 rounded-full text-xs">
              {tag}
            </span>
          ))}
        </div>
        <div className="text-xs text-slate-500">{words} words</div>
      </div>
    </div>
  );
}

