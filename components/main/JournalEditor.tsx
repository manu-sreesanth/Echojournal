"use client";

import { Dispatch, SetStateAction, useState, useCallback, useEffect } from "react";
import TomoChatDock from "./TomoChatDock";
import AiSummaryPanel from "./AiSummaryPanel";

import { addJournalEntry } from "@/firebase/firestoreFunctions";
import useSpeechToText from "@/hooks/useSpeechToText";
import { useAuth } from "@/context/AuthContext";
import { appendAiSummaryToMemory } from "@/firebase/firestoreFunctions";
import { JournalEntry } from "@/types/JournalEntry";
import { Sparkles } from "lucide-react";

// ------------------- Props -------------------
interface JournalEditorProps {
  setView: Dispatch<
    SetStateAction<"dashboard" | "editor" | "analytics" | "myentries" | "guide">
  >;
  setMood?: (mood: string) => void;
}

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

export default function JournalEditor({ setView, setMood }: JournalEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showCustomMood, setShowCustomMood] = useState(false);
  const [customMood, setCustomMood] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [growthInsight, setGrowthInsight] = useState<string | undefined>(undefined);
  const [actionSuggestion, setActionSuggestion] = useState<string | undefined>(undefined);
  const [reflectionQuestions, setReflectionQuestions] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  


  // NEW: hold both summaries
  const [tomoSummary, setTomoSummary] = useState<string | null>(null);
  const [kaiSummary, setKaiSummary] = useState<string | null>(null);
  const [emotionalTone, setEmotionalTone] = useState<string>("");
  const [emotionalBalance, setEmotionalBalance] = useState<string>("Neutral");
  const [emotionalScore, setEmotionalScore] = useState<number>(50);

  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();



  // ------------------- Temporary Entry for Panel -------------------
  const tempEntry: JournalEntry = {
    id: "temp",
    userId: user?.uid || "",
    title: title || "",
    content: content || "",
    mood: selectedMood || customMood || "unspecified",
    tags: tags,
    aiSummary: tomoSummary || "", // ✅ panel shows Tomo’s commentary by default
    createdAt: new Date(),
  };

  // ------------------- Insert Prompt -------------------
  const insertPrompt = (prompt: string) => {
    setContent((prev) => (prev ? prev + "\n\n" + prompt : prompt));
  };

  // ------------------- Mood Handling -------------------
  const [customMoodActive, setCustomMoodActive] = useState(false);

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    setMood?.(mood);
    setCustomMoodActive(false);
  };

  // ------------------- Auto Mood Detection -------------------
  useEffect(() => {
    if (customMoodActive) return;
    if ((content.length + title.length) < 5) return;

    const fetchMood = async () => {
      try {
        const res = await fetch("/api/suggestMood", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `${title}\n\n${content}`,
          }),
        });

        const data = await res.json();
        if (data.mood) {
          setSelectedMood(data.mood);
          setMood?.(data.mood);
        }
      } catch (err) {
        console.error("Mood detection failed:", err);
      }
    };

    const timer = setTimeout(fetchMood, 800);
    return () => clearTimeout(timer);
  }, [title, content, setMood, customMoodActive]);

  // ------------------- AI Summary Generation (NEW) -------------------
  const generateAiSummaries = async () => {
    try {
      const response = await fetch("/api/generateSummaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user?.uid,
          journalText: `${title}\n\n${content}`,
          mood: selectedMood,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTomoSummary(data.tomo || null);
        setKaiSummary(data.kai || null);
        setEmotionalTone(data.emotionalTone || "");
        setEmotionalBalance(data.emotionalBalance || "Neutral");
        setEmotionalScore(data.emotionalScore || 50);
        setGrowthInsight(data.growth || undefined);
        setActionSuggestion(data.actionSuggestion || undefined);
        setReflectionQuestions(data.reflectionQuestions || []);
      }
    } catch (err) {
      console.error("Error generating AI summaries:", err);
    }
  };

  // ------------------- Save Journal Entry -------------------
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please fill in both title and content before saving.");
      return;
    }

    if (!user) {
      alert("You must be logged in to save entries.");
      return;
    }

    setIsSaving(true);

    try {
      // Ensure summaries are generated before saving
      if (!tomoSummary && !kaiSummary) {
        await generateAiSummaries();
      }

      // 1. Save journal entry (only Tomo’s commentary stored in entry)
      await addJournalEntry(
        user.uid,
        content,
        selectedMood || customMood || "unspecified",
        tomoSummary || "",
        title || "Untitled",
        tags // already an array
      );

      // 2. Append both commentaries to agent memory
      const today = new Date().toISOString().split("T")[0];

      if (tomoSummary) {
        await appendAiSummaryToMemory(user.uid, today, tomoSummary, "tomo");
      }
      if (kaiSummary) {
        await appendAiSummaryToMemory(user.uid, today, kaiSummary, "kai");
      }

    // 3. Reset form
    setTitle("");
    setContent("");
    setTags([]); 
    setCustomMood("");
    setShowCustomMood(false);
  } catch (err) {
    console.error("Error saving journal entry:", err);
  } finally {
    setIsSaving(false);
  }
};

  // ------------------- Voice Input -------------------
  const onTranscriptFinal = useCallback((spokenText: string) => {
    setContent((prev) => (prev ? prev + " " + spokenText : spokenText));
  }, []);

  const { isListening, startListening, stopListening } = useSpeechToText({
    onTranscriptFinal,
  });

  // ------------------- Render -------------------
  return (
  <div className="flex space-x-6 pr-80">
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-slate-800">
            Write Your Journal
          </h2>
          <p className="text-slate-600">Express your thoughts and feelings</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setView("dashboard")}
            className="px-6 py-3 liquid-glass rounded-xl font-medium text-black hover:bg-white/15 transition-all duration-300"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Entry Form */} 
<div className="journal-editor rounded-2xl p-8">
  {/* Title Input */}
  <div className="mb-6">
    <label className="block text-sm font-medium text-slate-700 mb-3">
      Entry Title
    </label>
    <input
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="Give your entry a meaningful title..."
      className="w-full p-4 bg-transparent border border-slate-400/30 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/20 transition-all duration-300"
    />
  </div>

          {/* Mood Selector */}
<div className="mb-6">
  <label className="block text-sm font-medium text-slate-700 mb-3">
    How are you feeling?
  </label>
  <div
    className={`grid grid-cols-3 gap-3 ${customMoodActive ? "opacity-50 pointer-events-none" : ""}`}
  >
    {moodOptions.map((m) => (
      <div
        key={m.mood}
        onClick={() => !customMoodActive && handleMoodSelect(m.mood)} // 🚫 ignore clicks if customMoodActive
        className={`mood-option tooltip-container ${
          selectedMood === m.mood ? "selected" : ""
        }`}
      >
        <span className="text-2xl">{m.emoji}</span>
        <div className="tooltip">{m.label}</div>
      </div>
    ))}
  </div>

  {/* Optional helper text when disabled */}
  {customMoodActive && (
    <p className="mt-2 text-xs text-slate-500 italic">
      Custom mood active – emoji moods disabled
    </p>
  )}
</div>


{/* Custom Mood */}
<div className="mt-4">
  {/* Case 1: Show Add button if no mood & not editing */}
  {!customMood && !showCustomMood && (
    <button
      onClick={() => setShowCustomMood(true)}
      className="w-full py-3 border-2 border-dashed border-slate-400/50 rounded-xl 
                 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 
                 transition-all duration-300 flex items-center justify-center space-x-2"
    >
      <span className="text-lg font-medium">＋ Add Custom Mood</span>
    </button>
  )}

  {/* Case 2: Show input for adding/editing */}
  {showCustomMood && (
    <div className="mt-3 p-4 bg-white/20 rounded-xl border border-white/30">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Describe your mood:
      </label>
      <div className="flex space-x-2">
        <input
          type="text"
          value={customMood}
          onChange={(e) => setCustomMood(e.target.value)}
          placeholder="e.g., nostalgic, hopeful..."
          className="flex-1 p-3 bg-transparent border border-slate-400/30 rounded-lg 
                     text-slate-800 placeholder-slate-500 
                     focus:outline-none focus:border-indigo-500 focus:bg-white/20 
                     transition-all duration-300"
        />
        <button
          onClick={() => {
            if (customMood.trim()) {
              setSelectedMood(customMood);
              setMood?.(customMood);
              setCustomMoodActive(true);   // 🚫 disable auto mood detection
              setShowCustomMood(false);
            }
          }}
          className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 
                     rounded-lg text-white hover:from-indigo-600 hover:to-purple-700 
                     transition-all duration-300 font-medium"
        >
          Save
        </button>
        <button
          onClick={() => {
            setShowCustomMood(false);
            if (!customMood.trim()) {
              setCustomMood(""); // clear if canceled with empty input
            }
          }}
          className="px-4 py-3 bg-white/20 rounded-lg text-slate-600 
                     hover:bg-white/30 transition-all duration-300"
        >
          Cancel
        </button>
      </div>
    </div>
  )}

  {/* Case 3: Show locked-in custom mood */}
  {customMood && !showCustomMood && (
    <div className="flex items-center justify-between px-4 py-3 bg-white/20 rounded-xl border border-white/30">
      <span className="text-slate-700 font-medium">{customMood}</span>
      <div className="flex space-x-2">
        <button
          onClick={() => setShowCustomMood(true)} // edit mode
          className="px-3 py-1 text-sm bg-indigo-500 rounded-md text-white hover:bg-indigo-600"
        >
          Edit
        </button>
        <button
          onClick={() => {
            setCustomMood("");
            setSelectedMood(null);
            setMood?.("default"); 
            setCustomMoodActive(false);  // ✅ re-enable auto mood detection
          }}
          className="px-3 py-1 text-sm bg-red-500 rounded-md text-white hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  )}
</div>



     




          {/* Thoughts Label + Voice Input in same row */}
<div className="flex justify-between items-center mt-6 mb-3">
  <label className="block text-sm font-medium text-slate-700">
    Your Thoughts
  </label>

  <button
    onClick={isListening ? stopListening : startListening}
    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium
                transition-all duration-300 shadow-sm
                ${isListening 
                  ? "bg-red-500 animate-pulse ring-2 ring-red-300 text-white" 
                  : "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
                }`}
  >
    {/* Mic Icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4 mr-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 013 3v7a3 3 0 11-6 0V4a3 3 0 013-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2m7 7v4m-4 0h8" />
    </svg>
    {isListening ? "Recording..." : "Voice Input"}
  </button>
</div>

{/* Thoughts textarea */}
<textarea
  value={content}
  onChange={(e) => setContent(e.target.value)}
  rows={12}
  placeholder="Start writing your thoughts..."
  className="w-full p-4 bg-transparent border border-slate-300 rounded-xl 
               text-slate-800 placeholder-slate-500 
               focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 
               focus:bg-white/20 transition-all duration-300"
/>

            {/* Tags */}
<div className="mb-6 mt-6">
  <label className="block text-sm font-medium text-slate-700 mb-3">
    Tags (optional)
  </label>
  <div className="tag-input flex flex-wrap items-center gap-2 p-2 rounded-xl w-full">
    {/* Render tags */}
    {tags.map((tag, index) => (
      <span
        key={index}
        className="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-2"
      >
        {tag}
        <button
          type="button"
          onClick={() => setTags(tags.filter((_, i) => i !== index))}
          className="text-indigo-500 hover:text-indigo-700 font-bold"
        >
          ×
        </button>
      </span>
    ))}

    {/* Input field */}
    <input
      type="text"
      value={tagInput}
      onChange={(e) => setTagInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "," || e.key === "Enter") {
          e.preventDefault();
          const newTag = tagInput.trim();
          if (newTag !== "" && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
            setTagInput("");
          }
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text");
        const newTags = pasted
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t !== "" && !tags.includes(t));
        if (newTags.length > 0) {
          setTags([...tags, ...newTags]);
          setTagInput("");
        }
      }}
      placeholder="Add tags..."
      className="flex-1 min-w-[120px] bg-transparent focus:outline-none placeholder-slate-500"
    />
  </div>
</div>


          {/* AI Suggestions */}
          <div className="liquid-glass rounded-xl p-6">
  <div className="flex items-center space-x-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
      <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
    </div>
    <h4 className="font-semibold text-slate-800">AI Writing Prompts</h4>
  </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button onClick={() => insertPrompt("What am I most grateful for today?")} className="text-left p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-300 text-sm text-slate-700">
                "What am I most grateful for today?"
              </button>
              <button onClick={() => insertPrompt("What challenged me today and how did I handle it?")} className="text-left p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-300 text-sm text-slate-700">
                "What challenged me today?"
              </button>
              <button onClick={() => insertPrompt("What did I learn about myself today?")} className="text-left p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-300 text-sm text-slate-700">
                "What did I learn about myself?"
              </button>
              <button onClick={() => insertPrompt("How do I want to grow tomorrow?")} className="text-left p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-300 text-sm text-slate-700">
                "How do I want to grow tomorrow?"
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={async () => {
            await generateAiSummaries(); // ✅ generate both
            setShowSummary(true);        // ✅ open panel
          }}
          disabled={isSaving}
          className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-medium text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Entry"}
        </button>
      </div>
    </div>

      {/* Tomo Dock */}
      <TomoChatDock />

      
{/* AI Summary Panel */}
<AiSummaryPanel
  isOpen={showSummary}
  onClose={() => setShowSummary(false)}
  onConfirm={() => {
    handleSave(); // ✅ actually save to Firestore
    setShowSummary(false);
  }}
  entry={tempEntry}
  tomoComment={tomoSummary || ""}
  kaiComment={kaiSummary || ""}
  emotionalTone={emotionalTone}
  emotionalBalance={emotionalBalance}
  emotionalScore={emotionalScore}
  growthInsight={growthInsight}
  actionSuggestion={actionSuggestion}
  reflectionQuestions={reflectionQuestions}
/>

    </div>
  );
}
