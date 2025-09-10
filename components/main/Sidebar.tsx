"use client";

import { Dispatch, SetStateAction } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { useRouter } from "next/navigation";

import Link from "next/link";

interface SidebarProps {
  activeView: "dashboard" | "editor" | "analytics" | "myentries" | "guide";
  setView: Dispatch<SetStateAction<"dashboard" | "editor" | "analytics" | "myentries" | "guide">>;
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
}

export default function Sidebar({
  activeView,
  setView,
  darkMode,
  setDarkMode,
}: SidebarProps) {

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth/login"); // redirect after logout
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

return (
  <aside className="w-80 sidebar-glass fixed left-0 top-0 h-full z-10 p-8 flex flex-col">
    {/* Logo */}
    <div className="flex items-center space-x-3 mb-12">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center pulse-glow">
        <svg
          className="w-7 h-7 text-white"
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
        <h1 className="text-2xl font-bold text-white">AI Journal</h1>
        <p className="text-sm text-white/80">Your Digital Mind</p>
      </div>
    </div>

       {/* Navigation */}
    <nav className="space-y-3 flex-1">
      {/* Write Journal */}
      <button
        onClick={() => setView("editor")}
        className={`nav-item flex items-center space-x-4 p-4 rounded-xl w-full ${
          activeView === "editor"
            ? "active text-white"
            : "text-white/80 hover:text-blue-200"
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        <span className="font-medium">Write Journal</span>
      </button>

      {/* Dashboard */}
      <button
        onClick={() => setView("dashboard")}
        className={`nav-item flex items-center space-x-4 p-4 rounded-xl w-full ${
          activeView === "dashboard"
            ? "active text-white"
            : "text-white/80 hover:text-blue-200"
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
        </svg>
        <span className="font-medium">Dashboard</span>
      </button>

      
      {/* Guide Me */}
<button
  onClick={() => setView("guide")}
  className={`nav-item guide-me-button guide-me-glow flex items-center space-x-4 p-4 rounded-xl w-full ${
    activeView === "guide"
      ? "active text-white"
      : "text-white hover:text-blue-200"
  }`}
>
  <svg
    className="w-6 h-6 guide-me-icon"
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
  <span className="font-medium">Guide Me</span>
  <div className="ml-auto">
    <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-pulse"></div>
  </div>
</button>



      {/* Analytics */}
<button
  onClick={() => setView("analytics")}
  className={`nav-item flex items-center space-x-4 p-4 rounded-xl w-full ${
    activeView === "analytics"
      ? "active text-white"
      : "text-white/80 hover:text-blue-200"
  }`}
>
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
  <span className="font-medium">Analytics</span>
</button>


      {/* My Entries */}
      <button
  onClick={() => setView("myentries")}
  className={`nav-item flex items-center space-x-4 p-4 rounded-xl w-full ${
    activeView === "myentries"
      ? "active text-white"
      : "text-white/80 hover:text-blue-200"
  }`}
>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <span className="font-medium">My Entries</span>
      </button>

      {/* Profile */}
<Link
  href="/profile"
  className="nav-item flex items-center space-x-4 p-4 rounded-xl text-white/80 hover:text-blue-200 w-full"
>
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
  <span className="font-medium">Profile</span>
</Link>

      {/* Dark Mode Toggle */}
      <div className="nav-item flex items-center justify-between p-4 rounded-xl text-white/80">
        <div className="flex items-center space-x-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          <span className="font-medium">Dark Mode</span>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none hover:bg-white/30"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              darkMode ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="nav-item w-full flex items-center space-x-4 p-4 rounded-xl text-white/80 hover:text-red-300 transition-all duration-300 group"
      >
        <svg
          className="w-6 h-6 group-hover:text-red-300 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        <span className="font-medium group-hover:text-red-300 transition-colors">
          Logout
        </span>
      </button>
      </nav>
    


      {/* AI Assistant Panel */}
      <div className="mt-12 p-6 liquid-glass rounded-2xl">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
          <span className="font-semibold text-sm text-white">AI Assistant</span>
        </div>
        <p className="text-xs text-white/80 mb-4">
          Ready to help you reflect and grow
        </p>
        <button className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-300">
          Ask AI
        </button>
      </div>
    </aside>
  );
}

