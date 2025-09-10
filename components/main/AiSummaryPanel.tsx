"use client";

import React, { useState } from "react";
import { JournalEntry } from "@/types/JournalEntry";
import { buildEntryOverview } from "@/lib/entryOverview";
import { moodToEmoji, moodToLabel } from "@/utils/moodToEmoji";
import { NotebookPen } from "lucide-react";
import { MessageSquare } from "lucide-react";
import { Sprout } from "lucide-react";
import { HelpCircle } from "lucide-react";
import Image from "next/image";



interface AiSummaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entry?: JournalEntry; 
  tomoComment?: string; // ✅ NEW
  kaiComment?: string;  // ✅ NEW
  emotionalTone?: string;
  emotionalBalance?: string;
  emotionalScore?: number;
  growthInsight?: string;
  actionSuggestion?: string;
  reflectionQuestions?: string[];
}

export default function AiSummaryPanel({
  isOpen,
  onClose,
  onConfirm,
  entry,
  tomoComment,
  kaiComment,
  emotionalTone,
  emotionalBalance,
  emotionalScore,
  growthInsight,
  actionSuggestion,
  reflectionQuestions = [],
}: AiSummaryPanelProps) {

  const [expanded, setExpanded] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<number | null>(null);

  if (!isOpen) return null;

  if (!entry) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-md">Loading...</div>
      </div>
    );
  }



  const overview = buildEntryOverview(entry);

 const handleQuestionClick = async (index: number, question: string) => {
    if (expanded === index) {
      setExpanded(null);
      return;
    }
    setExpanded(index);
    if (!answers[index]) {
      setLoading(index);
      try {
        const res = await fetch("/api/reflectAnswer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, journalText: entry?.content }),
        });
        const data = await res.json();
        setAnswers(prev => ({ ...prev, [index]: data.answer }));
      } catch (err) {
        setAnswers(prev => ({ ...prev, [index]: "⚠️ Failed to fetch answer." }));
      }
      setLoading(null);
    }
  };

return (
<div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
    {/* Main Panel */}
    <div className="bg-white/80 border border-white/20 shadow-[0_25px_45px_rgba(0,0,0,0.15)] 
                    rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto 
                    transition-all duration-500 hover:shadow-[0_35px_65px_rgba(0,0,0,0.25)]">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-blue-500 
                          flex items-center justify-center animate-pulse shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-800">AI Journal Summary</h3>
            <p className="text-slate-600">Personalized insights from your entry</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/30 backdrop-blur 
                     hover:bg-white/50 flex items-center justify-center 
                     transition-all duration-300 border border-white/40 shadow-sm"
        >
          <svg
            className="w-5 h-5 text-slate-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>


{/* Entry Overview */}
<div className="glass-effect rounded-xl p-6 mb-6 transition-all duration-300 hover:shadow-lg hover:bg-white/40">
  <div className="flex items-center justify-between mb-4">
    <h4 className="font-semibold text-xl text-slate-800 flex items-center gap-2">
  <NotebookPen className="w-5 h-5 text-slate-700" />
  Entry Overview
</h4>

    <div className="flex items-center space-x-2">
      {/* Mood emoji */}
      <span className="text-2xl">
        {moodToEmoji(overview.mood)}
      </span>

      {/* Mood label (optional, can remove if you want only emoji) */}
      <span className="text-sm font-medium text-slate-700">
        {moodToLabel(overview.mood)}
      </span>

      {/* Date pill */}
      <span className="text-sm text-slate-600 bg-white/30 backdrop-blur px-3 py-1 rounded-full">
        {overview.date}
      </span>
    </div>
  </div>

  <h5 className="text-lg font-medium text-slate-800 mb-2">{overview.title}</h5>
  <div className="grid grid-cols-3 gap-4 text-center">
    <div className="glass-effect rounded-lg p-3">
      <div className="text-2xl font-bold text-indigo-600">
        {overview.wordCount}
      </div>
      <div className="text-xs text-slate-600">Words</div>
    </div>
    <div className="glass-effect rounded-lg p-3">
      <div className="text-2xl font-bold text-green-600">
        {overview.sentimentScore}
      </div>
      <div className="text-xs text-slate-600">Positivity</div>
    </div>
    <div className="glass-effect rounded-lg p-3">
      <div className="text-2xl font-bold text-purple-600">
        {overview.readingTime}
      </div>
      <div className="text-xs text-slate-600">Read Time</div>
    </div>
  </div>
</div>

{/* AI Agent Commentary */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  {/* Tomo */}
  <div className="glass-effect rounded-xl p-6">
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-12 h-12 rounded-full overflow-hidden relative bg-gradient-to-r from-pink-400 to-orange-400">
  <Image
    src="/tomo-avatar.svg"
    alt="Tomo Avatar"
    fill
    className="object-contain p-2"
    priority
  />
</div>


      <div>
        <h4 className="font-semibold text-lg text-slate-800">Tomo</h4>
        <p className="text-xs text-slate-500"></p>
      </div>
    </div>
    <p className="text-slate-700 leading-relaxed">
      {tomoComment ||
        `"Wow, look at you being all productive and stuff! 🎉 I'm genuinely impressed by how you balanced everything today."`}
    </p>
  </div>

  {/* Kai */}
  <div className="glass-effect rounded-xl p-6">
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-12 h-12 rounded-full overflow-hidden relative bg-gradient-to-r from-slate-500 to-slate-700">
  <Image
    src="/kai-avatar.svg"
    alt="Kai Avatar"
    fill
    className="object-contain p-2"
    priority
  />
</div>

      <div>
        <h4 className="font-semibold text-lg text-slate-800">Kai</h4>
        <p className="text-xs text-slate-500"></p>
      </div>
    </div>
    <p className="text-slate-700 leading-relaxed">
      {kaiComment ||
        `"Your productivity metrics show improvement. Focus on maintaining this consistency."`}
    </p>
  </div>
</div>

       

{/* Emotional Tone */}
<div className="glass-effect rounded-xl p-6 mb-6">
  <div className="flex items-center space-x-3 mb-4">
  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-red-500 flex items-center justify-center">
    <MessageSquare className="w-5 h-5 text-white" />
  </div>
  <h4 className="font-semibold text-lg text-slate-800">Emotional Tone</h4>
</div>


  {/* AI-generated explanation */}
  <p className="text-slate-700 leading-relaxed mb-4">
    {emotionalTone ||
      "Your tone appears balanced and reflective. This neutral perspective often allows for clear thinking and honest self-assessment."}
  </p>

  {/* Emotional Balance bar */}
  <div className="bg-white/20 rounded-lg p-3">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm text-slate-600">Emotional Balance</span>
      <span className="text-sm font-medium text-slate-800">
        {emotionalBalance || "Neutral"}
      </span>
    </div>
    <div className="w-full bg-white/30 rounded-full h-2">
      <div
        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-1000"
        style={{ width: `${emotionalScore || 50}%` }}
      ></div>
    </div>
  </div>
</div>

{/* Growth Opportunities */}
<div className="glass-effect rounded-xl p-6 mb-6">
  <div className="flex items-center space-x-3 mb-4">
  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-teal-500 flex items-center justify-center">
    <Sprout className="w-5 h-5 text-white" />
  </div>
  <h4 className="font-semibold text-lg text-slate-800">Growth Opportunities</h4>
</div>


  {/* AI-generated explanation */}
  <p className="text-slate-700 leading-relaxed mb-4">
    {growthInsight ||
      "Reflect on what patterns you notice in your thoughts and emotions."}
  </p>

  {/* Action Suggestion */}
  <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-3">
    <div className="flex items-center space-x-2">
      <svg
        className="w-4 h-4 text-green-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      <span className="text-sm font-medium text-green-800">
        Action Suggestion
      </span>
    </div>
    <p className="text-sm text-green-700 mt-1">
      {actionSuggestion ||
        "Try practicing gratitude by listing three things you're thankful for."}
    </p>
  </div>
</div>

 {/* Reflection Section */}
      <div className="glass-effect rounded-xl p-6 mt-6 transition-all duration-300 hover:shadow-lg hover:bg-white/40">
        <div className="flex items-center space-x-3 mb-4">
  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
    <HelpCircle className="w-5 h-5 text-white" />
  </div>
  <h4 className="font-semibold text-lg text-slate-800">Reflection Questions</h4>
</div>


        <div className="space-y-3">
  {reflectionQuestions.map((q, idx) => (
    <div
      key={idx}
      onClick={() => handleQuestionClick(idx, q)}
      className="cursor-pointer border border-slate-200 bg-white/10 hover:bg-white/20 rounded-lg p-4 shadow-sm transition"
    >
      <p className="text-slate-800 font-medium"> {q}</p>

      {expanded === idx && (
        <div className="mt-3 pl-2 text-sm text-slate-700 border-t border-slate-200 pt-2">
          {loading === idx ? (
            <span className="animate-pulse">Thinking...</span>
          ) : (
            answers[idx] || "Click to generate answer..."
          )}
        </div>
      )}
    </div>
  ))}
</div>

      </div>



         

  


        {/* Action Buttons */}
<div className="flex justify-end space-x-4 mt-6">
  {/* Close Button */}
  <button
    onClick={onClose}
    className="px-6 py-3 rounded-lg backdrop-blur bg-white/30 text-slate-800 
               hover:bg-white/40 transition-all duration-300 border border-white/40 
               shadow-sm"
  >
    Close
  </button>

  {/* Save Summary Button */}
  <button
    onClick={onConfirm}
    className="px-6 py-3 rounded-lg backdrop-blur bg-gradient-to-r from-green-400/80 to-blue-500/80 
               hover:from-green-500/90 hover:to-blue-600/90 text-white font-semibold 
               shadow-md transition-all duration-300 border border-white/40"
  >
    Save Summary
  </button>
</div>

      </div>
    </div>
  );
}

