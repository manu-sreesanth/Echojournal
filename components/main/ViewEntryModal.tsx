"use client";

import React, { useEffect, useState } from "react";
import { Entry } from "@/types/journal";
import { Heart, Pencil, X } from "lucide-react";
import { moodEmojiMap } from "@/config/moodScores"; // adjust path if needed
import { getMoodScore, calculateMoodPercentage } from "@/lib/analytics"; 





type ViewEntryModalProps = {
  open: boolean;
  entry: Entry | null;
  onClose: () => void;
  onEdit: (entry: Entry) => void;
  onToggleFavorite: (id: string) => void;
};



export default function ViewEntryModal({
  open,
  entry,
  onClose,
  onEdit,
  onToggleFavorite,
}: ViewEntryModalProps) {
  // ✅ hooks always at the top
  const [localFavorite, setLocalFavorite] = useState(entry?.favorite ?? false);

  useEffect(() => {
    setLocalFavorite(entry?.favorite ?? false);
  }, [entry]);

  if (!open || !entry) return null; 

  const wordCount = entry.content.trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.round(wordCount / 200)); // ~200 wpm
  const score = getMoodScore(entry.mood);
  const positivity = `${calculateMoodPercentage(score)}%`;



  return (
    <div
      id="entryViewModal"
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 ${
        open ? "flex" : "hidden"
      } items-center justify-center p-4`}
    >
      <div className="bg-white/100 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div id="viewEntryMood" className="text-4xl">
  {moodEmojiMap[entry.mood?.toLowerCase()] || "📝"}
</div>
            <div>
              <h3 id="viewEntryTitle" className="text-3xl font-bold text-slate-800">
                {entry.title}
              </h3>
              <p id="viewEntryDate" className="text-slate-600">
                {entry.createdAt
                  ? new Date(entry.createdAt as any).toDateString()
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
  {/* Favorite indicator (not clickable) */}
  <div
    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
    aria-label="Favorite status"
  >
    <Heart
      className={`w-5 h-5 ${
        entry.favorite ? "text-red-500 fill-red-500" : "text-slate-700"
      }`}
    />
  </div>

  {/* Edit button */}
  <button
    onClick={() => onEdit(entry)}
    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/10 flex items-center justify-center transition-all duration-200 transform hover:scale-110"
  >
    <Pencil className="w-5 h-5 text-slate-700" />
  </button>

  {/* Close button */}
  <button
    onClick={onClose}
    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all duration-200 transform hover:scale-110"
  >
    <X className="w-5 h-5 text-slate-700" />
  </button>
</div>
        </div>

        {/* Entry Content */}
        <div className="glass-effect rounded-xl p-6 mb-6">
          <div
            id="viewEntryContent"
            className="text-slate-700 leading-relaxed whitespace-pre-wrap"
          >
            {entry.content}
          </div>
        </div>

        {/* Entry Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-effect rounded-lg p-4 text-center">
            <div id="viewWordCount" className="text-2xl font-bold text-indigo-600">
              {wordCount}
            </div>
            <div className="text-xs text-slate-600">Words</div>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <div id="viewReadTime" className="text-2xl font-bold text-green-600">
              {readTime}m
            </div>
            <div className="text-xs text-slate-600">Read Time</div>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
  <div id="viewSentiment" className="text-2xl font-bold text-purple-600">
    {positivity}
  </div>
  <div className="text-xs text-slate-600">Positivity</div>
</div>

        </div>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div id="viewEntryTagsContainer" className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Tags</h4>
            <div id="viewEntryTags" className="flex flex-wrap gap-2">
              {entry.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
