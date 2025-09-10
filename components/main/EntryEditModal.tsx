"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  updateJournalEntry,
  deleteJournalEntry,
} from "@/firebase/firestoreFunctions"; // see section 2 for functions
import { Entry } from "@/types/journal";
import { Heart } from "lucide-react";




type EntryEditModalProps = {
  open: boolean;
  entry: Entry | null;          // entry to edit
  onClose: () => void;          // close modal
  onSaved?: (updated: Entry) => void; // callback after successful save
  onDeleted?: (id: string) => void;   // callback after successful delete
};

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

export default function EntryEditModal({
  open,
  entry,
  onClose,
  onSaved,
  onDeleted,
}: EntryEditModalProps) {
  const { user } = useAuth();

// Local form state (synced from `entry`)
const [title, setTitle] = useState("");
const [content, setContent] = useState("");
const [mood, setMood] = useState<string>("okay");

// Tags (pill-style input)
const [tags, setTags] = useState<string[]>([]);
const [tagInput, setTagInput] = useState("");

// Custom Mood
const [customMood, setCustomMood] = useState("");
const [showCustomMood, setShowCustomMood] = useState(false);
const [customMoodActive, setCustomMoodActive] = useState(false);
const [favorite, setFavorite] = useState(false);


useEffect(() => {
  if (!entry) return;

  setTitle(entry.title ?? "");
  setContent(entry.content ?? "");
  setTags(entry.tags ?? []);
  setFavorite(entry.favorite ?? false); // ✅ sync favorite

  if (entry.mood && moodOptions.some((m) => m.mood === entry.mood)) {
    setMood(entry.mood);
    setCustomMood("");
    setCustomMoodActive(false);
  } else if (entry.mood) {
    setCustomMood(entry.mood);
    setMood(entry.mood);
    setCustomMoodActive(true);
  } else {
    setMood("okay");
    setCustomMood("");
    setCustomMoodActive(false);
  }
}, [entry]);


useEffect(() => {
  if (!entry) return;

  setTitle(entry.title ?? "");
  setContent(entry.content ?? "");
  setTags(entry.tags ?? []);

  if (entry.mood && moodOptions.some((m) => m.mood === entry.mood)) {
    // Standard mood
    setMood(entry.mood);
    setCustomMood("");
    setCustomMoodActive(false);
  } else if (entry.mood) {
    // Custom mood
    setCustomMood(entry.mood);
    setMood(entry.mood);
    setCustomMoodActive(true);
  } else {
    // Default fallback
    setMood("okay");
    setCustomMood("");
    setCustomMoodActive(false);
  }
}, [entry]);

const disabled = useMemo(
  () => !user?.uid || !entry?.id || !title?.trim() || !content?.trim(),
  [user?.uid, entry?.id, title, content]
);

if (!open) return null;

const handleSave = async () => {
  if (!user?.uid || !entry?.id) return;

  await updateJournalEntry(user.uid, entry.id, {
    title: title.trim(),
    content: content.trim(),
    mood,
    tags,
    favorite, // ✅ now array directly
  });

  const updated: Entry = {
    ...(entry as Entry),
    title: title.trim(),
    content: content.trim(),
    mood,
    tags,
    favorite,
  };
  onSaved?.(updated);
  onClose();
};

const handleDelete = async () => {
  if (!user?.uid || !entry?.id) return;
  await deleteJournalEntry(user.uid, entry.id);
  onDeleted?.(entry.id);
  onClose();
};

  // NOTE: Structure/classes mirror your provided HTML exactly (just React handlers)
  return (
    // <!-- Entry Edit Modal -->
    <div
      id="entryEditModal"
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 ${
        open ? "flex" : "hidden"
      } items-center justify-center p-4`}
    >
      <div className="bg-white/100 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">



        {/* <!-- Header --> */}
<div className="flex items-center justify-between mb-8">
  <div>
    <h3 className="text-3xl font-bold text-slate-800">Edit Entry</h3>
    <p className="text-slate-600">Make changes to your journal entry</p>
  </div>

  <div className="flex items-center space-x-3">
    {/* Favorite button */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        setFavorite(!favorite);
      }}
      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all duration-200 transform hover:scale-110"
      aria-label="Toggle favorite"
    >
      <Heart
        className={`w-5 h-5 transition-colors duration-200 ${
          favorite ? "text-red-500 fill-red-500" : "text-slate-700"
        }`}
      />
    </button>

    {/* Close button */}
    <button
      onClick={onClose}
      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300"
      aria-label="Close edit modal"
    >
      <svg
        className="w-5 h-5 text-slate-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        ></path>
      </svg>
    </button>
  </div>
</div>


        {/* <!-- Edit Form --> */}
        <div className="space-y-6">
          {/* <!-- Title --> */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Entry Title</label>
            <input
              type="text"
              id="editEntryTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 bg-transparent border border-slate-400/30 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/20 transition-all duration-300"
              placeholder="Give your entry a title"
            />
          </div>

          {/* <!-- Mood --> */}
<div>
  <label className="block text-sm font-medium text-slate-700 mb-3">
    How are you feeling?
  </label>

  {/* Emoji Mood Grid */}
  <div
    className={`grid grid-cols-3 gap-3 ${
      customMoodActive ? "opacity-50 pointer-events-none" : ""
    }`}
  >
    {moodOptions.map((m) => (
      <div
        key={m.mood}
        onClick={() => !customMoodActive && setMood(m.mood)}
        className={`mood-option tooltip-container ${
          mood === m.mood ? "selected" : ""
        }`}
      >
        <span className="text-2xl">{m.emoji}</span>
        <div className="tooltip">{m.label}</div>
      </div>
    ))}
  </div>

  {/* Optional helper text */}
  {customMoodActive && (
    <p className="mt-2 text-xs text-slate-500 italic">
      Custom mood active – emoji moods disabled
    </p>
  )}
</div>

{/* Custom Mood */}
<div className="mt-4">
  {/* Case 1: Add button */}
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

  {/* Case 2: Input mode */}
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
              setMood(customMood);
              setCustomMoodActive(true);
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
              setCustomMood("");
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

  {/* Case 3: Locked-in custom mood */}
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
            setMood("okay");
            setCustomMoodActive(false);
          }}
          className="px-3 py-1 text-sm bg-red-500 rounded-md text-white hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  )}
</div>


          {/* <!-- Content --> */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Content</label>
            <textarea
              id="editEntryContent"
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 bg-transparent border border-slate-400/30 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/20 transition-all duration-300"
              placeholder="Write your thoughts here..."
            />
          </div>

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

        </div>



        {/* <!-- Action Buttons --> */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handleDelete}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl font-medium text-white hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-lg"
          >
            Delete Entry
          </button>

          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 liquid-glass rounded-xl font-medium text-slate-800 hover:bg-white/20 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={disabled}
              className={`px-6 py-3 rounded-xl font-medium text-white transition-all duration-300 shadow-lg
                ${disabled
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
