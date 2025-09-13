// components/main/TomoChatDock.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth } from "firebase/auth"; // optional, only if you use Firebase Auth client
import Image from "next/image";

interface Message {
  sender: "user" | "tomo";
  text: string;
  timestamp?: string | null;
  isTyping?: boolean;
}

// ---------- Utils: text formatting & splitting ----------
function formatTextToHTML(text: string) {
  // Escape HTML first
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Bullets (* at line start)
  html = html.replace(/(^|\n)\* (.*?)(?=\n|$)/g, "$1<li>$2</li>");

  // Wrap consecutive <li> lines into <ul>
  html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");

  // Convert double line breaks into paragraphs
  html = html.replace(/\n\n+/g, "</p><p>");

  // Convert remaining single line breaks into <br>
  html = html.replace(/\n/g, "<br>");

  // Ensure everything is wrapped in <p>
  if (!/^<p>/.test(html)) {
    html = `<p>${html}</p>`;
  }
  html = html.replace(/<\/ul>\s*<p>/g, "</ul><p>");

  return html;
}

function splitIntoBubbles(text: string, maxWords = 30, splitAfter = 25): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const blocks = normalized.split(/\n\s*\n/);

  const bubbles: string[] = [];

  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;

    // ✅ Keep consecutive list items together
    if (/^\* /m.test(block)) {
      const listItems = block
        .split(/\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith("*"));

      if (listItems.length > 1) {
        bubbles.push(listItems.join("\n"));
        continue;
      }
    }

    // ✅ Split block into sentences by punctuation
    const sentences = block.split(/(?<=[.!?])\s+/);

    for (let sentence of sentences) {
      sentence = sentence.trim();
      if (!sentence) continue;

      const words = sentence.split(/\s+/);

      if (words.length <= maxWords) {
        // short sentence → 1 bubble
        bubbles.push(sentence);
      } else {
        // long sentence → try split after 25th word if there's a comma
        let splitIndex = -1;

        for (let i = splitAfter; i < words.length; i++) {
          if (words[i].includes(",")) {
            splitIndex = i;
            break;
          }
        }

        if (splitIndex !== -1) {
          const firstPart = words.slice(0, splitIndex + 1).join(" ");
          const secondPart = words.slice(splitIndex + 1).join(" ");
          if (firstPart.trim()) bubbles.push(firstPart);
          if (secondPart.trim()) bubbles.push(secondPart);
        } else {
          // fallback → whole long sentence in one bubble
          bubbles.push(sentence);
        }
      }
    }
  }

  return bubbles;
}



export default function TomoChatDock() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "tomo", text: "Hey 👋 I'm Tomo, your AI journaling buddy!" },
    { sender: "tomo", text: "Need help getting started or reflecting on your thoughts?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);


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
          const expanded: Message[] = [];
          for (const m of data.messages as { sender: "user" | "tomo"; text: string }[]) {
            if (m.sender === "tomo") {
              const chunks = splitIntoBubbles(m.text);
              chunks.forEach((chunk) => expanded.push({ sender: "tomo", text: chunk, isTyping: false }));
            } else {
              expanded.push({ sender: "user", text: m.text, isTyping: false });
            }
          }
          setMessages(expanded);
          messagesRef.current = expanded;
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


  // keep a mutable ref of messages so async flows can read the latest length/state
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // auto scroll when messages array changes (keeps previous behaviour for quick pushes)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // helper: scroll container to bottom (instant)
 function scrollToBottomInstant() {
  const c = messagesContainerRef.current;
  if (c) {
    c.scrollTop = c.scrollHeight;
  }
}

 // check if user is already near bottom
function isNearBottom(container: HTMLElement, threshold = 50) {
  return (
    container.scrollHeight - container.scrollTop - container.clientHeight <
    threshold
  );
}

// helper: type text into an element with smart scroll
async function typeAndScroll(el: HTMLElement, text: string, delay = 20) {
  const container = messagesContainerRef.current;
  el.textContent = "";

  for (let i = 0; i < text.length; i++) {
    el.textContent = text.slice(0, i + 1);

    // ✅ only scroll if user is near bottom
    if (container && isNearBottom(container)) {
      container.scrollTop = container.scrollHeight;
    }

    await new Promise((r) => setTimeout(r, delay));
  }
}


async function sendMessage() {
  if (!input.trim() || isLoading) return;

  const userText = input.trim();
  setInput("");

  // Push only the user message
  setMessages((prev) => {
    const next: Message[] = [...prev, { sender: "user", text: userText }];
    messagesRef.current = next;
    return next;
  });
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

    // Split reply into bubbles and type each sequentially
    const chunks = splitIntoBubbles(reply);

    for (const chunk of chunks) {
      const targetIndex = messagesRef.current.length;

      // Add a typing bubble
      const newMessage: Message = { sender: "tomo", text: chunk, isTyping: true };
      const appended: Message[] = [...messagesRef.current, newMessage];
      setMessages(appended);
      messagesRef.current = appended;

      // Wait for DOM render
      await new Promise((r) => setTimeout(r, 30));

      // Animate typing into the last bubble
      const nodes = document.querySelectorAll(".tomo-typing");
const el = nodes[nodes.length - 1] as HTMLElement | undefined;
if (el) {
  await typeAndScroll(el, chunk, 35);          // smart scroll inside typing
  el.innerHTML = formatTextToHTML(chunk);
  scrollToBottomInstant();                     // ✅ always scroll at end of bubble
}


      // Mark this bubble as finished
      setMessages((prev) => {
        const copy: Message[] = [...prev];
        if (copy[targetIndex]) {
          copy[targetIndex] = { ...copy[targetIndex], isTyping: false };
        }
        messagesRef.current = copy;
        return copy;
      });

      // Small pause before next bubble
      await new Promise((r) => setTimeout(r, 80));
    }
  } catch (e) {
    // On error: push a fallback bubble
    setMessages((prev) => {
      const copy: Message[] = [
        ...prev,
        {
          sender: "tomo",
          text: "Hmm, I hit a snag reaching the server. Try again?",
          isTyping: false,
        },
      ];
      messagesRef.current = copy;
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
              src="/tomo-avatar.svg" // make sure it's inside /public
              alt="Tomo Avatar"
              fill // 👈 fills parent container
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
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2"
        >
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
                    src="/tomo-avatar.svg" // 👈 adjust if in /avatars/tomo.png etc.
                    alt="Tomo Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Bubble */}
              {m.sender === "tomo" ? (
                m.isTyping ? (
                  // while typing: keep whitespace, set textContent while animating
                  <div
                    className="glass-effect rounded-xl p-3 max-w-xs text-sm text-slate-700 tomo-typing whitespace-pre-wrap"
                    // content populated via JS while typing
                  />
                ) : (
                  <div
                    className="glass-effect rounded-xl p-3 max-w-xs text-sm text-slate-700"
                    dangerouslySetInnerHTML={{ __html: formatTextToHTML(m.text) }}
                  />
                )
              ) : (
                <div
                  className="glass-effect rounded-xl p-3 max-w-xs text-sm bg-gradient-to-r from-emerald-500 to-cyan-600 text-black ml-auto"
                  dangerouslySetInnerHTML={{ __html: formatTextToHTML(m.text) }}
                />
              )}
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
