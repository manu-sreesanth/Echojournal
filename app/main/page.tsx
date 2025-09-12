"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";

import Sidebar from "@/components/main/Sidebar";
import JournalEditor from "@/components/main/JournalEditor";
import Analytics from "@/components/main/analytics";
import MyEntries from "@/components/main/MyEntries";
import GuideMePanel from "@/components/main/GuideMe/GuideMePanel";
import Dashboard from "@/components/main/Dashboard";
import TomoIntro from "@/components/main/TomoIntro";

import "./main.css";

export default function MainPage() {
  const router = useRouter();

  // Views
  const [view, setView] = useState<
    "dashboard" | "editor" | "analytics" | "myentries" | "guide"
  >(() => {
    if (typeof window !== "undefined") {
      return (
        (sessionStorage.getItem("lastView") as
          | "dashboard"
          | "editor"
          | "analytics"
          | "myentries"
          | "guide") || "dashboard"
      );
    }
    return "dashboard";
  });

  // State
  const [darkMode, setDarkMode] = useState(false);
  const [mood, setMood] = useState<string>("default");
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

  // 📝 Persist current view
  useEffect(() => {
    sessionStorage.setItem("lastView", view);
  }, [view]);

  // ✅ Watch Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 🚫 Redirect to login if not logged in
  useEffect(() => {
    if (!loading && !uid) {
      router.push("/auth/login");
    }
  }, [uid, loading, router]);


// 🟡 Count sessions with localStorage
useEffect(() => {
  if (typeof window === "undefined") return;

  let count = parseInt(localStorage.getItem("sessionCount") || "0", 10);
  count += 1;
  localStorage.setItem("sessionCount", count.toString());

  // ✅ Show Tomo on first session OR every 5th session
  if (count === 1 || count % 20 === 0) {
    setShowIntro(true);
  }
}, []);


  // 🔄 Show loader while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Loading...
      </div>
    );
  }

  // ⚠️ Don’t render anything while redirecting
  if (!uid) {
    return null;
  }

  return (
    <div
      className={`min-h-screen flex mood-transition ${
        darkMode ? "dark-mode" : `mood-${mood || "default"}`
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        activeView={view}
        setView={setView}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Content */}
      <main
        className={`flex-1 ml-80 p-8 text-slate-800 dark:text-slate-100 transition-colors`}
      >
        {view === "editor" && (
          <JournalEditor setView={setView} setMood={setMood} />
        )}

        {view === "dashboard" && (
          <div className="text-slate-800">
            <Dashboard setView={setView} />
          </div>
        )}

        {view === "guide" && (
          <div className="text-slate-800">
            <GuideMePanel uid={uid} onClose={() => setView("dashboard")} />
          </div>
        )}

        {view === "analytics" && (
          <div className="text-slate-800">
            <Analytics uid={uid} />
          </div>
        )}

        {view === "myentries" && (
          <div className="text-slate-800">
            <MyEntries setView={setView} />
          </div>
        )}
      </main>

      {/* 🟡 Overlay Intro */}
      {showIntro && (
        <TomoIntro
          onFinish={() => {
            setShowIntro(false);
          }}
        />
      )}
    </div>
  );
}






