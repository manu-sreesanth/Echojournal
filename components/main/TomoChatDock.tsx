// components/main/TomoChatDock.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth } from "firebase/auth"; // optional, only if you use Firebase Auth client
import Image from "next/image";

interface Message {
  sender: "user" | "tomo";
  text: string;
  timestamp?: string | null;
}

export default function TomoChatDock() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "tomo", text: "Hey 👋 I'm Tomo, your AI journaling buddy!" },
    { sender: "tomo", text: "Need help getting started or reflecting on your thoughts?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load existing history (if any) from Firestore via API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const auth = getAuth?.();
        const idToken = await auth?.currentUser?.getIdToken?.();
        const res = await fetch("/api/tomochatdock/history", {
          headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (mounted && data?.messages?.length) {
            setMessages(data.messages);
          }
        }
      } catch {
        // silent — keep the friendly defaults
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");

    // Push user message and a temporary "thinking…" bubble for Tomo
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userText },
      { sender: "tomo", text: "…" },
    ]);
    setIsLoading(true);

    try {
      const auth = getAuth?.();
      const idToken = await auth?.currentUser?.getIdToken?.();

      const res = await fetch("/api/tomochatdock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ message: userText }),
      });

      let reply = "I couldn’t reach the Tomo service. Want to try again?";
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.reply === "string") reply = data.reply;
      }

      // Replace the last placeholder "…" with the real reply
      setMessages((prev) => {
        const copy = [...prev];
        // Find last tomo placeholder from the end
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].sender === "tomo" && copy[i].text === "…") {
            copy[i] = { sender: "tomo", text: reply };
            return copy;
          }
        }
        // Fallback: just append
        copy.push({ sender: "tomo", text: reply });
        return copy;
      });
    } catch (e) {
      setMessages((prev) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].sender === "tomo" && copy[i].text === "…") {
            copy[i] = {
              sender: "tomo",
              text: "Hmm, I hit a snag reaching the server. Try again?",
            };
            return copy;
          }
        }
        copy.push({
          sender: "tomo",
          text: "Hmm, I hit a snag reaching the server. Try again?",
        });
        return copy;
      });
    } finally {
      setIsLoading(false);
    }
  }

return (
  <div className="w-80 liquid-glass fixed right-0 top-0 h-full z-20 tomo-chat">
    <div className="p-8 h-full flex flex-col">
      {/* Chat Header */}
<div className="flex items-center space-x-3 mb-6 pb-4 border-b border-white/20">
   {/* Avatar */}
  <div className="w-12 h-12 rounded-full overflow-hidden relative animate-pulse bg-gradient-to-r from-emerald-400 to-cyan-500">
  <Image
    src="/tomo-avatar.svg"   // make sure it's inside /public
    alt="Tomo Avatar"
    fill                      // 👈 fills parent container
    className="object-cover"
    priority
  />
</div>



  {/* Info */}
  <div>
    <h3 className="text-xl font-bold text-slate-800">Tomo</h3>
    <p className="text-sm text-slate-600">Your AI Writing Companion</p>
  </div>

  {/* Status indicator */}
  <div className="ml-auto">
    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
  </div>
</div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 ${
              m.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.sender === "tomo" && (
  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-r from-emerald-400 to-cyan-500">
    <Image
      src="/tomo-avatar.svg"   // 👈 adjust if in /avatars/tomo.png etc.
      alt="Tomo Avatar"
      fill
      className="object-cover"
    />
  </div>
)}
            <div
              className={`glass-effect rounded-xl p-3 max-w-xs text-sm ${
                m.sender === "tomo"
                  ? "text-slate-700"
                  : "bg-gradient-to-r from-emerald-500 to-cyan-600 text-black ml-auto"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {["Help me get started", "I need inspiration", "Analyze my mood"].map(
            (suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setInput(suggestion)}
                className="px-3 py-1 bg-white/20 border border-white/30 rounded-full text-xs text-slate-700 hover:bg-white/30 transition-all duration-300"
              >
                {suggestion}
              </button>
            )
          )}
        </div>
      </div>

      {/* Chat Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={isLoading ? "Tomo is thinking..." : "Ask Tomo anything..."}
          className="flex-1 p-3 bg-white/20 border border-white/30 rounded-xl 
                     text-slate-800 placeholder-slate-500 
                     focus:outline-none focus:border-emerald-500 focus:bg-white/30 
                     transition-all duration-300 text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl text-white hover:from-emerald-600 hover:to-cyan-700 transition-all duration-300 flex-shrink-0 disabled:opacity-60"
          aria-disabled={isLoading}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
);
}
