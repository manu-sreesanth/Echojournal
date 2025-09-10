"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./guideMePanel.css";
import { startGuideSession, downloadICSFollowUp, downloadJSONSession, downloadPDFSession } from "@/lib/guide-me/client";
import { GuideSession, MentoringOutput, PreMood, PostMood } from "@/lib/guide-me/types";
import { useCallback } from "react";
import Image from "next/image";
import { HelpingHand } from "lucide-react";
import { BarChart2, Notebook, Target, Lightbulb } from "lucide-react";
import { MessageSquareText, CheckCircle, MessageCircle, ArrowLeft } from "lucide-react";
import { CheckSquare, FileDown, BookOpen } from "lucide-react";
import {
  PartyPopper,
  FileText,
} from "lucide-react";



type Props = { uid: string; onClose?: () => void };

const GuideMePanel: React.FC<Props> = ({ uid, onClose }) => {
  // Internal state (kept minimal; DOM is driven via ids to avoid UI changes)
  const [preMood, setPreMood] = useState<PreMood | undefined>();
  const [postMood, setPostMood] = useState<PostMood | undefined>();
  const [session, setSession] = useState<GuideSession | null>(null);

  // Refs to speed DOM ops
  const refs = useMemo(() => {
    const $ = (id: string) => () => document.getElementById(id)!;
    return {
      progressContainer: $("progressContainer"),
      progressBar: $("progressBar"),
      initialState: $("initialState"),
      loadingState: $("loadingState"),
      mentoringState: $("mentoringState"),
      summaryState: $("summaryState"),
      chatState: $("chatState"),
      mentoringText: $("mentoringText"),
      actionButtonsTop: $("actionButtonsTop"),
      actionButtonsBottom: $("actionButtonsBottom"),
      actionItemsSection: $("actionItemsSection"),
      actionItems: $("actionItems"),
      keyInsights: $("keyInsights"),
      nextSteps: $("nextSteps"),
      referenceContent: $("referenceContent"),
      chatMessages: $("chatMessages"),
      quickRefs: $("quickRefs"),
      selectedPreMood: $("selectedPreMood"),
      selectedPostMood: $("selectedPostMood"),
      startBtn: $("startBtn"),
    };
  }, []);

  // Helpers
  const show = (el: HTMLElement) => el.classList.remove("hidden");
  const hide = (el: HTMLElement) => el.classList.add("hidden");
  const setProgress = (pct: number) => {
    refs.progressBar().style.width = `${pct}%`;
  };

// ⌨️ Typing effect helper (slower pace)
async function typeText(element: HTMLElement, html: string, speed = 30) {
  return new Promise<void>((resolve) => {
    let i = 0;
    const interval = setInterval(() => {
      element.innerHTML = html.slice(0, i++); // ✅ type HTML safely
      element.scrollIntoView({ behavior: "smooth", block: "end" });
      if (i > html.length) {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}



  // Stepper animation in loading phase
  async function animateLoading() {
    show(refs.loadingState());
    show(refs.progressContainer());
    const steps = [
      "analysisStep1",
      "analysisStep2",
      "analysisStep3",
      "analysisStep4",
    ];
    let pct = 0;
    for (const id of steps) {
      const el = document.getElementById(id)!;
      el.classList.remove("opacity-50");
      el.classList.add("font-medium");
      pct += 20 + Math.random() * 10;
      setProgress(Math.min(95, pct));
      // small pause
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 600));
    }
    setProgress(100);
  }

  
// 🔧 shared helper for adding one mentoring paragraph
async function appendMentoringParagraph(p: string) {
  const container = refs.mentoringText();

  const wrap = document.createElement("div");
  wrap.className = "flex items-start space-x-3 mb-4";

  const avatar = document.createElement("div");
  avatar.className =
    "w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center flex-shrink-0 relative";
  avatar.innerHTML = `
    <img src="/kai-avatar.svg" alt="Kai Avatar" class="object-contain p-1 w-8 h-8" />
  `;

  const bubble = document.createElement("div");
  bubble.className =
    "bg-purple-50 p-4 rounded-xl text-gray-700 leading-relaxed text-sm min-h-[40px]";
  bubble.textContent = "";

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  container.appendChild(wrap);

  await typeText(bubble, p, 30);

  container.scrollIntoView({ behavior: "smooth", block: "end" });
}

// 🔧 main fillMentoring
async function fillMentoring(output: MentoringOutput) {
  const container = refs.mentoringText();
  container.innerHTML = "";

  const references: string[] = [];

  hide(refs.actionItemsSection());
  hide(refs.actionButtonsTop());
  hide(refs.actionButtonsBottom());

  // render all initial mentoring paragraphs
  for (const p of output.text) {
    await appendMentoringParagraph(p);

    // add each paragraph to references as we go
    references.push(p);
    fillReferences({ ...output, references });
  }

  // ✅ Once all mentoring text is done → show Action Items
  const list = refs.actionItems();
  list.innerHTML = "";
  output.actionItems.forEach(ai => {
    const row = document.createElement("div");
    row.className =
      "flex items-center justify-between border border-purple-200 rounded-lg px-4 py-3 bg-white shadow-sm";
    row.innerHTML = `
      <label class="flex items-center space-x-3 w-full">
        <input type="checkbox" class="form-checkbox h-5 w-5 text-purple-600">
        <span class="text-gray-700 text-sm">${ai.text}</span>
      </label>
    `;
    list.appendChild(row);
  });

  show(refs.actionItemsSection());
  show(refs.actionButtonsTop());
  show(refs.actionButtonsBottom());
}



// 🔑 Fill Summary stays the same
function fillSummary(output: MentoringOutput) {
  const ki = refs.keyInsights();
  ki.innerHTML = "";
  output.insights.forEach(x => {
    const li = document.createElement("li");
    li.textContent = `• ${x}`;
    ki.appendChild(li);
  });

  const ns = refs.nextSteps();
  ns.innerHTML = "";
  output.nextSteps.forEach(x => {
    const li = document.createElement("li");
    li.textContent = `• ${x}`;
    ns.appendChild(li);
  });
}

// 🔑 References only for mentoring (live updates)
function fillReferences(output: MentoringOutput) {
  const rc = refs.referenceContent();
  rc.innerHTML = "";

  output.references.forEach(x => {
    const div = document.createElement("div");
    div.className =
      "bg-white border border-purple-200 rounded-lg p-3 text-sm text-gray-700 cursor-pointer hover:bg-purple-100";
    div.textContent = `"${x}"`;

    // instead of sending, prefill the input box
    div.onclick = () => {
      const input = document.getElementById("chatInput") as HTMLInputElement;
      if (input) {
        input.value = `Can you elaborate on: "${x}"?`;
        input.focus();
      }
    };

    rc.appendChild(div);
  });

  // Quick ref buttons
  const qr = document.getElementById("quickRefs")!;
  qr.innerHTML = "";
  output.references.forEach((x, i) => {
    const b = document.createElement("button");
    b.className =
      "text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-all";
    b.textContent = `Ref ${i + 1}`;
    b.onclick = () => {
      const input = document.getElementById("chatInput") as HTMLInputElement;
      if (input) {
        input.value = `Can you elaborate on: "${x}"?`;
        input.focus();
      }
    };
    qr.appendChild(b);
  });

  qr.classList.remove("hidden");
}

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




// 🔄 Improved split logic (paragraphs, lists, headings, immediate steps)
function splitIntoBubbles(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  // Split by double newlines → paragraph-like blocks
  const blocks = normalized.split(/\n\s*\n/);

  const bubbles: string[] = [];

  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;

    // Keep consecutive list items together
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

    // Immediate next step → highlight separately
    if (/^Immediate next step:/i.test(block)) {
      bubbles.push(block);
      continue;
    }

    // Otherwise, just push the block as one bubble
    bubbles.push(block);
  }

  return bubbles;
}

// 🔑 Chat bubble adder with Kai avatar + typing + improved split
const addChat = useCallback(
  async (role: "user" | "kai", text: string) => {
    const cm = refs.chatMessages();
    if (!cm) return;

    const chunks = splitIntoBubbles(text);

    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];

      const wrap = document.createElement("div");
      wrap.className = `flex items-start space-x-2 ${
        role === "user" ? "justify-end" : ""
      }`;

      // Kai avatar (only on first bubble of a group)
      if (role === "kai" && idx === 0) {
        const avatar = document.createElement("img");
        avatar.src = "/kai-avatar.svg";
        avatar.alt = "Kai";
        avatar.className = "w-8 h-8 rounded-full";
        wrap.appendChild(avatar);
      } else if (role === "kai") {
        const spacer = document.createElement("div");
        spacer.className = "w-8 h-8";
        wrap.appendChild(spacer);
      }

      // Bubble element
      const bubble = document.createElement("div");

      // Special highlight for "Immediate next step"
      const isNextStep = /^Immediate next step:/i.test(chunk);

      bubble.className =
        role === "kai"
          ? isNextStep
            ? "bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-xl text-sm max-w-[75%] mb-1 font-medium"
            : "bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm max-w-[75%] mb-1"
          : "bg-blue-500 text-white px-4 py-2 rounded-xl text-sm max-w-[75%] mb-1";

      wrap.appendChild(bubble);

      cm.appendChild(wrap);
      cm.scrollTop = cm.scrollHeight;

      // Typing effect for Kai
      if (role === "kai") {
        const html = formatTextToHTML(chunk);
        await typeText(bubble, html, 30);
      } else {
        bubble.innerHTML = formatTextToHTML(chunk);
      }
    }
  },
  [refs]
);

  // Mood button maps (by title attribute from your UI)
  const preMoodMap: Record<string, PreMood> = {
    "Sad": "sad",
  "Anxious": "anxious",
  "Tired": "tired",
  "Okay": "okay",
  "Happy": "happy",
  "Excited": "excited",
  "Calm": "calm",
  "Overwhelmed": "overwhelmed",
  "Angry": "angry",
  };
  const postMoodMap: Record<string, PostMood> = {
    "Motivated": "motivated",
    "Peaceful": "peaceful",
    "Inspired": "inspired",
    "Thoughtful": "thoughtful",
    "Grateful": "grateful",
  };

  useEffect(() => {
    // PRE mood capture
    const preButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>("#preMoodSelector .mood-selector")
    );
    preButtons.forEach(btn => {
      btn.onclick = () => {
        const title = btn.title?.trim() || "";
        const m = preMoodMap[title];
        setPreMood(m);
        const label = refs.selectedPreMood();
        label.textContent = `You feel: ${title}`;
        label.classList.remove("hidden");
        refs.startBtn().removeAttribute("disabled");
      };
    });

    // POST mood capture
    const postButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>("#postMoodSelector .mood-selector")
    );
    postButtons.forEach(btn => {
      btn.onclick = () => {
        const title = btn.title?.trim() || "";
        const m = postMoodMap[title];
        setPostMood(m);
        const label = refs.selectedPostMood();
        label.textContent = `Logged: ${title}`;
        label.classList.remove("hidden");
      };
    });

    // Close button
    const closeBtn = document
      .querySelector<HTMLButtonElement>(".gradient-bg button.text-white");
    if (closeBtn) closeBtn.onclick = () => onClose?.();

    // “Mentoring Session Reference” hide toggle
    const toggleBtn = document.getElementById("toggleBtn");
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        const ref = refs.referenceContent();
        if (ref.classList.contains("hidden")) {
          ref.classList.remove("hidden"); toggleBtn.textContent = "Hide";
        } else {
          ref.classList.add("hidden"); toggleBtn.textContent = "Show";
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onStart() {
    // Transition: initial → loading
    hide(refs.initialState());
    await animateLoading();

    // Fetch mentoring (server will also create the session doc)
    let s: GuideSession;
    try {
      s = await startGuideSession(uid, preMood);
      setSession(s);
    } catch (e: any) {
      // Failure fallback
      hide(refs.loadingState());
      show(refs.initialState());
      alert("Could not start session:\n" + (e?.message ?? "Unknown error"));
      return;
    }

    // Transition: loading → mentoring
    hide(refs.loadingState());
    show(refs.mentoringState());
    fillMentoring(s.output!);
  }

  // Hook Start button
  useEffect(() => {
    const start = refs.startBtn();
    start.onclick = onStart;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preMood]);

  // Button actions inside Mentoring
  useEffect(() => {
    // Reflect More (adds a small prompt into chat)
    let reflectCount = 0;

const reflectBtn = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#actionButtonsTop button")
).find(b => b.textContent?.includes("Reflect More"));

if (reflectBtn) {
  reflectBtn.onclick = async () => {
    if (reflectCount >= 2) {
      await appendMentoringParagraph("⚠️ You’ve already reflected twice — let’s put this into practice now.");
      return;
    }
    reflectCount++;

    const existingParagraphs = Array.isArray(session!.output!.text)
      ? session!.output!.text
      : [session!.output!.text];

    try {
      const res = await fetch("/api/guide-me/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          mode: "reflect",
          previousText: existingParagraphs,
        }),
      });

      const data = await res.json();

      // ✅ append new paragraphs inside mentoring bubbles
      for (const p of data.text) {
        await appendMentoringParagraph(p);
      }

      // ✅ update session so next reflect builds on updated text
      session!.output!.text = [...existingParagraphs, ...data.text];
    } catch (err) {
      console.error("Reflect more error:", err);
      await appendMentoringParagraph("⚠️ Couldn't generate more reflections, try again later.");
    }
  };
}



    // Set Reminder → download .ics 15 minutes from now
    const reminderBtn = Array.from(document.querySelectorAll<HTMLButtonElement>("#actionButtons button"))
      .find(b => b.textContent?.includes("Set Reminder"));
    if (reminderBtn) {
      reminderBtn.onclick = () => {
        const startISO = new Date(Date.now() + 15 * 60000).toISOString();
        downloadICSFollowUp(
          "Guide Me: Mid-week check-in",
          "Short check-in related to your current experiment.",
          startISO,
          15
        );
      };
    }

    // View Session Summary
    const summaryBtn = Array.from(document.querySelectorAll<HTMLButtonElement>("#actionButtonsBottom button"))
      .find(b => b.textContent?.includes("Finish Session"));
    if (summaryBtn) {
      summaryBtn.onclick = () => {
        if (!session?.output) return;
        fillSummary(session.output);
        hide(refs.mentoringState());
        show(refs.summaryState());
      };
    }

    // Continue Chatting with Kai
    const chatBtn = Array.from(document.querySelectorAll<HTMLButtonElement>("#actionButtonsBottom button"))
      .find(b => b.textContent?.includes("Continue Chatting"));
    if (chatBtn) {
      chatBtn.onclick = () => {
        if (!session?.output) return;
        hide(refs.mentoringState());
        show(refs.chatState());
        fillReferences(session.output);
        addChat("kai", "I’m here. What would you like to dive into first?");
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Summary buttons (Export / Schedule / Continue Chat)
  useEffect(() => {
    // Export Session
    const exportBtn = Array.from(document.querySelectorAll<HTMLButtonElement>("#summaryState button"))
      .find(b => b.textContent?.includes("Export Session"));
    if (exportBtn) {
      exportBtn.onclick = () => session && downloadJSONSession(session);
    }

    // Schedule Follow-up
    const followBtn = Array.from(document.querySelectorAll<HTMLButtonElement>("#summaryState button"))
      .find(b => b.textContent?.includes("Schedule Follow-up"));
    if (followBtn) {
      followBtn.onclick = () => {
        const startISO = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
        downloadICSFollowUp(
          "Guide Me: Follow-up",
          "15-minute follow-up on your experiment.",
          startISO,
          15
        );
      };
    }

// Continue Chat (from Summary → Chat)

  const contBtn = Array.from(
    document.querySelectorAll<HTMLButtonElement>("#summaryState button")
  ).find((b) => b.textContent?.includes("Continue Chat"));

  if (contBtn) {
    contBtn.onclick = () => {
      if (!session?.output) return;
      hide(refs.summaryState());
      show(refs.chatState());
      fillReferences(session.output);
      addChat("kai", "Welcome back — want me to unpack any insight further?");
    };
  }

  // Chat Phase Buttons
  const goBackBtn = document.getElementById("chatGoBackBtn");
  const finishBtn = document.getElementById("chatFinishBtn");

  if (goBackBtn) {
    goBackBtn.onclick = () => {
      hide(refs.chatState());
      show(refs.mentoringState());
    };
  }

  if (finishBtn) {
    finishBtn.onclick = () => {
      if (!session?.output) return;
      fillSummary(session.output);
      hide(refs.chatState());
      show(refs.summaryState());
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [session]);

// Chat Input (Enter key)
useEffect(() => {
  const input = document.getElementById("chatInput") as HTMLInputElement | null;
  if (!input) return;

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      const val = input.value.trim();
      if (!val) return;

      addChat("user", val);
      input.value = "";

      try {
        const res = await fetch("/api/agents/kai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, message: val, mode: "chat" }),
        });

        if (!res.ok) throw new Error(`Kai API error: ${res.status}`);
        const data = await res.json();

        addChat("kai", data.reply);
      } catch (err) {
        console.error("Kai chat error:", err);
        addChat("kai", "⚠️ Hmm, I hit a snag while responding. Try again?");
      }
    }
  };

  input.addEventListener("keydown", handleKeyDown);
  return () => input.removeEventListener("keydown", handleKeyDown);
}, [uid, addChat]);

return (
    <div className="bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="gradient-bg px-8 py-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center pulse-glow relative">
  <Image
    src="/kai-avatar.svg"
    alt="Kai Avatar"
    fill
    className="object-contain p-2"
    priority
  />
</div>
              <div>
                <h2 className="font-semibold text-xl">Kai</h2>
                <p className="text-sm opacity-90">Your AI Mentor</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Progress Indicator */}
              <div id="progressContainer" className="hidden">
                <div className="text-xs opacity-90 mb-1">Session Progress</div>
                <div className="w-24 h-2 bg-white bg-opacity-20 rounded-full">
                  <div id="progressBar" className="h-full bg-white rounded-full progress-bar" style={{ width: "0%" }}></div>
                </div>
              </div>
              <button className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

         {/* Content Area */}
        <div className="p-8 space-y-6" id="contentArea">
          {/* Initial State */}
          <div id="initialState" className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
  <HelpingHand className="w-10 h-10 text-purple-600" />
</div>
            <div>
              <h3 className="font-semibold text-xl text-gray-800 mb-3">Ready for personalized guidance?</h3>
              <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                I'll analyze your journal entries, mood patterns, and goals to provide tailored mentoring that helps you grow and achieve your aspirations.
              </p>
            </div>

            {/* Pre-session Mood Check */}
<div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto">
  <h4 className="font-medium text-gray-800 mb-4 text-center">
    How are you feeling right now?
  </h4>

  <div className="flex flex-wrap justify-center gap-3" id="preMoodSelector">
    <div className="relative group">
      <button className="mood-selector text-2xl p-3 rounded-full hover:bg-blue-100" title="Sad">😢</button>
      <div className="absolute bottom-full mb-2 w-32 bg-gray-800 text-white text-xs rounded-md p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <span className="font-medium">Sad</span>
        <br />
        <span className="text-gray-200">Feeling down or low energy</span>
      </div>
    </div>

    <div className="relative group">
      <button className="mood-selector text-2xl p-3 rounded-full hover:bg-red-100" title="Anxious">😰</button>
      <div className="absolute bottom-full mb-2 w-32 bg-gray-800 text-white text-xs rounded-md p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <span className="font-medium">Anxious</span>
        <br />
        <span className="text-gray-200">Worried or tense</span>
      </div>
    </div>

    <div className="relative group">
      <button className="mood-selector text-2xl p-3 rounded-full hover:bg-purple-100" title="Tired">😴</button>
      <div className="absolute bottom-full mb-2 w-32 bg-gray-800 text-white text-xs rounded-md p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <span className="font-medium">Tired</span>
        <br />
        <span className="text-gray-200">Sleepy or drained</span>
      </div>
    </div>

    <div className="relative group">
      <button className="mood-selector text-2xl p-3 rounded-full hover:bg-gray-100" title="Okay">😐</button>
      <div className="absolute bottom-full mb-2 w-32 bg-gray-800 text-white text-xs rounded-md p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <span className="font-medium">Okay</span>
        <br />
        <span className="text-gray-200">Neutral, nothing special</span>
      </div>
    </div>

    <div className="relative group">
      <button className="mood-selector text-2xl p-3 rounded-full hover:bg-yellow-100" title="Happy">😊</button>
      <div className="absolute bottom-full mb-2 w-32 bg-gray-800 text-white text-xs rounded-md p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <span className="font-medium">Happy</span>
        <br />
        <span className="text-gray-200">Feeling good and positive</span>
      </div>
    </div>

    <div className="relative group">
      <button className="mood-selector text-2xl p-3 rounded-full hover:bg-pink-100" title="Excited">🤩</button>
      <div className="absolute bottom-full mb-2 w-32 bg-gray-800 text-white text-xs rounded-md p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <span className="font-medium">Excited</span>
        <br />
        <span className="text-gray-200">Eager and enthusiastic</span>
      </div>
    </div>

    <div className="relative group">
      <button className="mood-selector text-2xl p-3 rounded-full hover:bg-green-100" title="Calm">😌</button>
      <div className="absolute bottom-full mb-2 w-32 bg-gray-800 text-white text-xs rounded-md p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <span className="font-medium">Calm</span>
        <br />
        <span className="text-gray-200">Relaxed and at ease</span>
      </div>
    </div>

    <div className="relative group">
      <button className="mood-selector text-2xl p-3 rounded-full hover:bg-orange-100" title="Overwhelmed">🤯</button>
      <div className="absolute bottom-full mb-2 w-32 bg-gray-800 text-white text-xs rounded-md p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <span className="font-medium">Overwhelmed</span>
        <br />
        <span className="text-gray-200">Too much on your mind</span>
      </div>
    </div>

    <div className="relative group">
      <button className="mood-selector text-2xl p-3 rounded-full hover:bg-red-200" title="Angry">😠</button>
      <div className="absolute bottom-full mb-2 w-32 bg-gray-800 text-white text-xs rounded-md p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <span className="font-medium">Angry</span>
        <br />
        <span className="text-gray-200">Upset or frustrated</span>
      </div>
    </div>
  </div>

  <div id="selectedPreMood" className="text-sm text-gray-600 mt-3 text-center hidden"></div>
</div>

<button
  id="startBtn"
  className="w-full max-w-md mx-auto bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 px-8 rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
  disabled
>
  Start Mentoring Session
</button>
</div>


          {/* Loading State */}
          <div id="loadingState" className="hidden text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
            <div>
              <h3 className="font-semibold text-xl text-gray-800 mb-4">Analyzing your journey...</h3>
              <div className="space-y-3 text-gray-600 max-w-md mx-auto">
                <div id="analysisStep1" className="opacity-50 flex items-center justify-center space-x-2">
  <BarChart2 className="w-5 h-5 text-purple-500" />
  <span>Reviewing your mood analytics</span>
</div>

<div id="analysisStep2" className="opacity-50 flex items-center justify-center space-x-2">
  <Notebook className="w-5 h-5 text-blue-500" />
  <span>Processing journal entries</span>
</div>

<div id="analysisStep3" className="opacity-50 flex items-center justify-center space-x-2">
  <Target className="w-5 h-5 text-green-500" />
  <span>Aligning with your goals</span>
</div>

<div id="analysisStep4" className="opacity-50 flex items-center justify-center space-x-2">
  <Lightbulb className="w-5 h-5 text-yellow-500" />
  <span>Crafting personalized guidance</span>
</div>

              </div>
            </div>
          </div>

{/* Mentoring State */}
<div id="mentoringState" className="hidden">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Main Mentoring Area */}
    <div className="lg:col-span-3 space-y-4">

      {/* Mentoring Feed (dynamic bubbles will be inserted here) */}
      <div id="mentoringText" className="space-y-4 max-h-96 overflow-y-auto pr-2"></div>


      {/* Top Action Buttons (Reflect + Reminder only) */}
      <div id="actionButtonsTop" className="hidden space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <button className="bg-blue-50 text-blue-600 py-3 px-6 rounded-xl font-medium hover:bg-blue-100 transition-all flex items-center justify-center space-x-2">
            <MessageSquareText className="w-5 h-5" />
            <span>Reflect More</span>
          </button>
        </div>
      </div>


   {/* Action Items */}
<div
  id="actionItemsSection"
  className="hidden bg-purple-50 rounded-xl p-6 border border-purple-200 mt-6"
>
  <div className="flex items-center justify-between mb-4">
    <h4 className="font-medium text-gray-800 flex items-center space-x-2">
      <CheckSquare className="w-5 h-5 text-purple-600" />
      <span>Action Items</span>
    </h4>

    <button
      className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-all flex items-center space-x-2"
      onClick={() => session && downloadPDFSession(session)}
    >
      <FileDown className="w-5 h-5" />
      <span>Export</span>
    </button>
  </div>

  <div id="actionItems" className="space-y-3 text-sm">
    <div className="text-gray-500 italic">
      Action items will appear as we progress...
    </div>
  </div>
</div>

  {/* Bottom Action Buttons (Summary + Chat) */}
      <div id="actionButtonsBottom" className="hidden space-y-4">
        <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 px-8 rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>Continue Chatting with Kai</span>
        </button>
        <button className="w-full bg-yellow-50 text-yellow-700 py-3 px-6 rounded-xl font-medium hover:bg-yellow-100 transition-all flex items-center justify-center space-x-2">
  <CheckCircle className="w-5 h-5" />
  <span>Finish Session</span>
</button>
      </div>
    </div>
  </div>
  </div>


    



  
        

 {/* Session Summary */}
          <div id="summaryState" className="hidden space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
      <PartyPopper className="w-8 h-8 text-green-600" />
    </div>
    <h3 className="font-semibold text-xl text-gray-800 mb-2">Session Complete!</h3>
              <p className="text-gray-600">Here's a summary of your mentoring session</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="font-medium text-blue-800 mb-3">Key Insights</h4>
                <ul id="keyInsights" className="space-y-2 text-sm text-blue-700"></ul>
              </div>

              <div className="bg-purple-50 rounded-xl p-6">
                <h4 className="font-medium text-purple-800 mb-3">Next Steps</h4>
                <ul id="nextSteps" className="space-y-2 text-sm text-purple-700"></ul>
              </div>
            </div>

            {/* Post-session Mood Check */}
<div className="bg-gray-50 rounded-xl p-6">
  <h4 className="font-medium text-gray-800 mb-4 text-center">
    How do you feel after our session?
  </h4>
  <div className="flex justify-center space-x-4" id="postMoodSelector">
    <button
      className="mood-selector px-4 py-2 rounded-full bg-green-100 hover:bg-green-200 text-green-800 font-medium"
      title="Motivated"
      data-mood="Motivated"
    >
      Motivated
    </button>
    <button
      className="mood-selector px-4 py-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium"
      title="Peaceful"
      data-mood="Peaceful"
    >
      Peaceful
    </button>
    <button
      className="mood-selector px-4 py-2 rounded-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium"
      title="Inspired"
      data-mood="Inspired"
    >
      Inspired
    </button>
    <button
      className="mood-selector px-4 py-2 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium"
      title="Thoughtful"
      data-mood="Thoughtful"
    >
      Thoughtful
    </button>
    <button
      className="mood-selector px-4 py-2 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-800 font-medium"
      title="Grateful"
      data-mood="Grateful"
    >
      Grateful
    </button>
  </div>
  <div
    id="selectedPostMood"
    className="text-sm text-gray-600 mt-3 text-center hidden"
  ></div>
</div>


             <div className="flex space-x-4">
    <button className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center space-x-2">
      <FileText className="w-5 h-5" />
      <span>Export Session</span>
    </button>
    
    <button className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center space-x-2">
      <MessageCircle className="w-5 h-5" />
      <span>Continue Chat</span>
    </button>
  </div>
</div>

{/* Chat State */}
<div id="chatState" className="hidden">
  {/* Mentoring Reference Panel */}
  <div
    id="mentoringReference"
    className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100"
  >
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-medium text-gray-700 flex items-center">
        <BookOpen className="w-5 h-5 mr-2 text-gray-700" />
        Mentoring Session Reference
      </h4>
      <button
        id="toggleBtn"
        className="text-sm text-purple-600 hover:text-purple-800 transition-all"
      >
        Hide
      </button>
    </div>
    {/* Reference Quotes */}
    <div
      id="referenceContent"
      className="space-y-3 max-h-40 overflow-y-auto"
    >
      {/* dynamically filled with quote cards */}
    </div>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
    {/* Chat Messages */}
    <div className="lg:col-span-1">
      <div
        id="chatMessages"
        className="space-y-4 mb-6 max-h-64 overflow-y-auto bg-gray-50 rounded-xl p-4"
      >
        {/* Example bubble (Kai) */}
        {/* These will be injected dynamically by addChat */}
        {/* 
        <div className="flex items-start space-x-3">
          <img
            src="/avatars/kai-avatar.svg"
            alt="Kai"
            className="w-8 h-8 rounded-full"
          />
          <div className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-xl max-w-[75%]">
            Hey, this is how Kai would answer.
          </div>
        </div>
        */}
      </div>

      {/* Chat Tips at the bottom */}
      <div className="bg-blue-50 rounded-xl p-4 mb-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-blue-800" />
          Chat Tips
        </h4>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-blue-700 list-none">
          <li>• Reference mentoring quotes</li>
          <li>• Ask for clarification</li>
          <li>• Share your progress</li>
          <li>• Request specific advice</li>
        </ul>
      </div>

      <div className="space-y-3">
        {/* Quick Reference Buttons */}
        <div id="quickRefs" className="hidden flex flex-wrap gap-2"></div>

        {/* Chat Input */}
        <div className="flex space-x-3">
          {/* Quick References trigger (optional) */}
          <button
            className="bg-gray-100 text-gray-600 p-3 rounded-xl hover:bg-gray-200 transition-all"
            title="Quick References"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM9 6v10h6V6H9z"
              />
            </svg>
          </button>

          {/* Input */}
          <input
            type="text"
            id="chatInput"
            placeholder="Ask Kai anything or reference mentoring..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />

          {/* Send button */}
          <button
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all"
            onClick={async () => {
              const input = document.getElementById(
                "chatInput"
              ) as HTMLInputElement;
              if (!input) return;
              const val = input.value.trim();
              if (!val) return;

              // Add user message
              addChat("user", val);
              input.value = "";

              try {
                // Kai API
                const res = await fetch("/api/agents/kai", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ uid, message: val, mode: "chat" }),
                });
                if (!res.ok) throw new Error(`Kai API error: ${res.status}`);
                const data = await res.json();
                addChat("kai", data.reply);
              } catch (err) {
                console.error("Kai chat error:", err);
                addChat(
                  "kai",
                  "⚠️ Hmm, I hit a snag while responding. Try again?"
                );
              }
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>

        {/* Chat Footer Actions */}
        <div className="flex space-x-4 mt-6">
          <button
            id="chatGoBackBtn"
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
          <button
            id="chatFinishBtn"
            className="flex-1 bg-yellow-50 text-yellow-700 py-3 px-6 rounded-xl font-medium hover:bg-yellow-100 transition-all flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Finish Session</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>



          {/* Other states (loadingState, mentoringState, summaryState, chatState) */}
          {/* Keep them intact as static JSX like above */}
        </div>
      </div>
    </div>
    
  );
};

export default GuideMePanel;
