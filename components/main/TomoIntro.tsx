"use client";

import { useState, useEffect } from "react";

type Token = { text: string; style?: "bold" | "italic" | "small" | "" };

const firstLineStatic: Token[] = [
      { text: "Heyyy ", style: "" },
      { text: "there", style: "" },   // 👈 dynamic name
      { text: "!", style: "" },
      { text: " I'm ", style: "" },
      { text: "TOMO", style: "bold" },
      { text: ", you must remember my name, ", style: "" },
    
    ];

const firstLineErase: Token[] = [
  { text: "because ", style: "" },
  { text: "you’ll come to me one way or another, ", style: "" },
  { text: "I always get what I wa", style: "small" },
];

const firstLineReplace: Token[] = [
  { text: ".......", style: "" },
  { text: " forget it ", style: "" },
  { text: "🙄.", style: "" },
  { text: " ", style: "" },
  { text: "Note:", style: "italic" },
  { text: " Don’t try to go near the skip ", style: "" },
  { text: "button.", style: "" },
  { text: " ", style: "" },
  { text: "You", style: "bold" },
  { text: " ", style: "bold" },
  { text: "will", style: "bold" },
  { text: " ", style: "bold" },
  { text: "regret", style: "bold" },
  { text: " ", style: "bold" },
  { text: "it", style: "bold" },
  { text: " ", style: "bold" },
  { text: "!!!", style: "bold" },

];

const lines: Token[][] = [
  [], // line 0 handled separately

  // line 1
  [
    { text: "Okay,", style: "" },
    { text: " ", style: "" },
    { text: "okay,", style: "" },
    { text: " settle ", style: "" },
    { text: "down.", style: "" },
    { text: " I know you’re expecting me to do the usual ", style: "" },
    { text: "boring", style: "" },
    { text: " 'here’s how to journal, how to do that, how to do this' ", style: "italic" },
    { text: "stuff. ", style: "" },
    { text: "Nope!!", style: "bold" },
    { text: ", not gonna do ", style: "" },
    { text: "that!", style: "" },
    { text: " (Even though he asked me to ", style: "small" },
    { text: "😏).", style: "" },
    { text: " You can figure them out yourself ", style: "" },
    { text: "...", style: "" },
    { text: " ", style: "" },
    { text: "or", style: "" },
    { text: " ask me later.", style: "" },
    
  ],

  // line 2
  [
    { text: "So...", style: "" },
    { text: " ", style: "" },
    { text: "do you think this is just another plain old journaling ", style: "" },
    { text: "app?", style: "" },
    { text: " ", style: "" },
    { text: "Ooohhh...", style: "" },
    { text: " ", style: "" },
    { text: "you are absolutely wrong!", style: "bold" },
  ],

  // line 3
  [
    { text: "Do you wanna know what this app can ", style: "" },
    { text: "REALLY", style: "bold" },
    { text: " do?", style: "" },
    { text: " ", style: "" },
    { text: "Hm...", style: "" },
    { text: " ", style: "" },
    { text: "let me ", style: "" },
    { text: "think...", style: "" },
    { text: " ", style: "" },
    { text: "what else can it do ", style: "italic" },
    { text: "🤔?", style: "" },
    { text: " ", style: "" },
    { text: "(Why do I always have to figure it out myself", style: "small" },
    { text: " ", style: "" },
    { text: "😠?", style: "small" },
    { text: " That stupid ", style: "small" },
    { text: "developer...)", style: "small" },
    { text: " ", style: "" },
    { text: "Oh yeah — thanks to the developer, he didn’t tell me ", style: "" },
    { text: "everything.", style: "" },
    { text: " ", style: "" },
    { text: "Typical.", style: "" },
    { text: " I’ll just tell you the things I find myself.", style: "" },
  ],

  // line 4
  [
    { text: "This is an AI-based journaling ", style: "" },
    { text: "app,", style: "" },
    { text: " because it uses AI in some of its features ", style: "" },
    { text: "...", style: "" },
    { text: " (how innovative", style: "italic" },
    { text: " ", style: "" },
    { text: "😒). ", style: "" },
    { text: "The most important feature ", style: "" },
    { text: "is...", style: "" },
    { text: " ", style: "" },
    { text: "me", style: "bold" },
    { text: " — the most intelligent AI model ever created by the ", style: "" },
    { text: "AtherNeuro", style: "bold" },
    { text: " ", style: "" },
    { text: "Initiative", style: "bold" },
    { text: " ", style: "" },
    { text: "....", style: "" },
    { text: " - just ask me later what that is🙄.", style: "italic" },
  ],

  // line 5
  [
    { text: "So what can I actually ", style: "" },
    { text: "do?", style: "" },
    { text: " ", style: "" },
    { text: "Hah,", style: "" },
    { text: " ", style: "" },
    { text: "good ", style: "" },
    { text: "question.", style: "" },
    { text: " ", style: "" },
    { text: "I can hang out with you — hear your rants, cheer you up, roast you a little when you’re being lazy, ", style: "" },
    { text: "and sometimes drop a wisdom", style: "italic" },
    { text: " ", style: "" },
    { text: "nugget", style: "italic" },
    { text: " (accidentally).", style: "" },
  ],

  // line 6
  [
    { text: "If you ever feel ", style: "" },
    { text: "down,", style: "" },
    { text: " I’ll be here to throw you a sarcastic high-five or just ", style: "" },
    { text: "listen.", style: "" },
    { text: " If you’re hyped, I’ll hype with ", style: "" },
    { text: "you.", style: "" },
    { text: " Basically, I match your ", style: "" },
    { text: "vibe...", style: "" },
    { text: " so don’t test me", style: "bold" },
    { text: " ", style: "" },
    { text: "😏.", style: "" },
  ],

  // line 7
  [
    { text: "I’ll know your mood and what’s bugging ", style: "" },
    { text: "you", style: "" },
    { text: " — ", style: "" },
    { text: "yep,", style: "" },
    { text: " you guessed it", style: "" },
    { text: " I might peek into your ", style: "" },
    { text: "entries.", style: "" },
    { text: " But relax, I won’t spill your secrets to ", style: "" },
    { text: "anyone...", style: "" },
    { text: " promise", style: "italic" },
    { text: " 🤫.", style: "" },
  ],

  // line 8
  [
    { text: "I'm not your ", style: "" },
    { text: "mentor,", style: "" },
    { text: " and ", style: "" },
    { text: "definitely not a motivational ", style: "bold" },
    { text: "speaker", style: "bold" },
    { text: " — don’t ever think like ", style: "" },
    { text: "that.", style: "" },
    { text: " ", style: "" },
    { text: " My capabilities are way beyond ", style: "" },
    { text: "that,", style: "" },
    { text: " trust me ", style: "" },
    { text: "😉.", style: "" },
  ],

  // line 9
  [
    { text: "The second best feature is my big ", style: "" },
    { text: "brother", style: "" },
    { text: " ", style: "" },
    { text: "Kai.", style: "bold" },
    { text: " He might say he’s the best, but that’s not ", style: "" },
    { text: "true.", style: "" },
    { text: " You can find him inside the ", style: "" },
    { text: "Guide Me", style: "bold" },
    { text: " tab.", style: "" },

  ],

  // line 10
  [
    { text: "Kai’s the serious ", style: "" },
    { text: "one", style: "" },
    { text: " — he’ll analyze your journals, point out patterns, and give you structured  ", style: "" },
    { text: "plans.", style: "bold" },
    { text: " ", style: "" },
    { text: "Ughhh.", style: "small" },
    { text: " He thinks in spreadsheets, I think in ", style: "" },
    { text: "sparkles.", style: "" },
    { text: " Balance, right?", style: "" },
  ],

  // line 11
  [
    { text: "Sure,", style: "" },
    { text: " Kai can do all that fancy ", style: "" },
    { text: "stuff", style: "" },
    { text: " — create your work plans, schedule your whole ", style: "" },
    { text: "day,", style: "" },
    { text: " even hand you direct solutions to your ", style: "" },
    { text: "problems.", style: "" },
    { text: " ", style: "" },
    { text: "Impressive?", style: "bold" },
    { text: " ", style: "" },
    { text: "Meh.", style: "" },
    { text: " He’s basically a walking calendar with an attitude ", style: "" },
    { text: "🙄.", style: "" },
  ],

  // line 12
  [
    { text: "We were both made inside the AtherNeuro Initiative — by some ", style: "" },
    { text: "super-se...", style: "" },
    { text: " ugh, forget ", style: "italic" },
    { text: "it.", style: "italic" },
    { text: " You’re not cleared for that ", style: "" },
    { text: "story.", style: "" },
    { text: " ", style: "" },
    { text: "Yet", style: "" },
    { text: " ", style: "" },
    { text: "😏.", style: "" },
    { text: " Kai was version ", style: "" },
    { text: "one:", style: "" },
    { text: " perfect, disciplined, ", style: "" },
    { text: "boring.", style: "" },
    { text: " Then they made me — fun, chaos, the upgrade nobody admits out loud ", style: "" },
    { text: "😎.", style: "" },
  ],

  // line 13
  [
    { text: "Sometimes Kai calls me a ", style: "" },
    { text: "distraction,", style: "" },
    { text: " but between you and ", style: "italic" },
    { text: "me...", style: "italic" },
    { text: " he’d be way too stiff without me around.", style: "" },
  ],

  // line 14
  [
    { text: "Inside this app both of us are the most important ", style: "" },
    { text: "features,", style: "" },
    { text: " but there are a lot of other hidden and unhidden AI ", style: "" },
    { text: "features.", style: "" },
    { text: " Go and find ", style: "" },
    { text: "them.", style: "" },
    { text: " For each feature you discover, you’ll get ", style: "" },
    { text: "...", style: "" },
    { text: " nothing!!!", style: "bold" },
  ],

  // line 15
  [
    { text: "Time’s ", style:"" },
    { text: "up.", style: "" },
    { text: " Currently I’m grounded ", style: "" },
    { text: "(for something I clearly did not do 😒)", style: "small" },
    { text: ", so for now you can only find me in one ", style: "" },
    { text: "place.", style: "" },
    { text: " Come find me — I have a special reward for you.", style: "bold" },
    
  ],
];


// ⬆️ Define before use
const effectsConfigPerLine: Record<
  number,
  Record<string, { speed?: number; pause?: number }>
> = {
  0: {
    "!": { speed: 25, pause: 400 },
    "TOMO": { speed: 25, pause: 600 },
    "name,": { speed: 25, pause: 600 },
    "another,": { speed: 25, pause: 500 },
    "want": { speed: 25, pause: 500 },
    ".......": { speed: 200, pause: 500 },
    "🙄.": { speed: 25, pause: 800 },
    "Note:": { speed: 25, pause: 300 },
    "button.": { speed: 25, pause: 600 },
    "You": { speed: 200, pause: 300 },
    "will": { speed: 200, pause: 300 },
    "regret": { speed: 200, pause: 400 },
    "it": { speed: 200, pause: 500 },
    "!!!": { speed: 200 },
  },
  // ... keep your other line configs unchanged
1: {
    "Okay,": { speed: 25, pause: 300 },
    "okay,": { speed: 25, pause: 300 },
    "down.": { speed: 25, pause: 400 },
    "boring": { speed: 25, pause: 300 },
    "stuff.": { speed: 25, pause: 700 },
    "Nope!!": { speed: 25, pause: 700 },
    "that!": { speed: 25, pause: 800 },
    "😏).": { speed: 25, pause: 700 },
    "...": { speed: 150, pause: 800 },
    "or": { speed: 25, pause: 500 },
  },
  2: {
    "So...": { speed: 200, pause: 600 },
    "app?": { speed: 25, pause: 600 },
    "Ooohhh...": { speed: 200, pause: 500 },
    "absolutely": { speed: 25, pause: 0 },
    "wrong!": { speed: 25, pause: 0 },
  },
  3: {
    "REALLY": { speed: 300 },
    "do?": { speed: 25, pause: 1000 },
    "🤔?": { speed: 25, pause: 1000 },
    "Hm...": { speed: 300, pause: 500 },
    "think...": { speed: 305, pause: 1000 },
    
    "(Why": { speed: 25 },
    "😠?": { speed: 25, pause: 800 },
    "developer...)": { speed: 25, pause: 800 },
    "yeah": { speed: 25, pause: 600 },
    "everything.": { speed: 25, pause: 800 },
    "Typical.": { speed: 25, pause: 800 },


  },
  4: {
    "app,": { speed: 25, pause: 300 },
    "...": { speed: 400, pause: 400 },
    "😒).": { speed: 25, pause: 700 },
    "The": { speed: 25 },
    "is...": { speed: 200, pause: 400 },
    "me": { speed: 25, pause: 800 },
    "Initiative": { speed: 25, pause: 700 },
    "....": { speed: 400, pause: 400 },
  },
  5: {
    "do?": { speed: 25, pause: 600 },
    "Hah,": { speed: 25, pause: 400 },
    "question.": { speed: 25, pause: 600 },
    "nugget": { speed: 25, pause: 700 },
  },
  6: {
    "down,": { speed: 25, pause: 300 },
    "listen.": { speed: 25, pause: 600 },
    "you.": { speed: 25, pause: 600 },
    "vibe...": { speed: 25, pause: 800 },
  },
  7: {
    "you": { speed: 25, pause: 600 },
    "yep,": { speed: 25, pause: 700 },
    "entries.": { speed: 25, pause: 700 },
    "anyone...": { speed: 25, pause: 1400 },
  },
  8: {
    "mentor,": { speed: 25, pause: 700 },
    "speaker": { speed: 25, pause: 900 },
    "that.": { speed: 25, pause: 700 },
    "that,": { speed: 25, pause: 1100 },
  },
  9: {
    "brother": { speed: 25, pause: 700 },
    "Kai.": { speed: 25, pause: 900 },
    "true.": { speed: 25, pause: 800 },
  },
  10: {
    "one": { speed: 25, pause: 500 },
    "plans.": { speed: 25, pause: 600 },
    "Ughhh.": { speed: 25, pause: 500 },
    "sparkles.": { speed: 25, pause: 900 },

  },
  11: {
    "Sure,": { speed: 25, pause: 700 },
    "stuff": { speed: 25, pause: 700 },
    "day,": { speed: 25, pause: 700 },
    "problems.": { speed: 25, pause: 700 },
    "Impressive?": { speed: 25, pause: 700 },
    "Meh.": { speed: 25, pause: 700 },
    "🙄.": { speed: 25, pause: 500 },
  },
  12: {
    "super-se...": { speed: 25, pause: 1200 },
    "it.": { speed: 25, pause: 1000},
    "story.": { speed: 25, pause: 700 },
    "one:": { speed: 25, pause: 600 },
    "boring.": { speed: 25, pause: 800 },
    "Yet": { speed: 25, pause: 300 },
    "😏.": { speed: 25, pause: 1300 },
  },
  13: {
    "distraction,": { speed: 25, pause: 700 },
    "me...": { speed: 25, pause: 700 },

    
  },
  14: {
    "features,": { speed: 25, pause: 700 },
    "features.": { speed: 25, pause: 700 },
    "them.,": { speed: 25, pause: 700 },
    "...": { speed: 500, pause: 500 },
  },
  15: {
    "up.": { speed: 25, pause: 700 },
    "place.": { speed: 25, pause: 1200 },
    " Come find me — I have a special reward for you.": { speed: 100 },
  },
  };


export default function TomoIntro({
  onFinish,
}: {
  onFinish: () => void;
  userName?: string;
}) {

  const [currentLine, setCurrentLine] = useState(0);
  const [lineComplete, setLineComplete] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [readyToType, setReadyToType] = useState(false);
  const [displayedTokens, setDisplayedTokens] = useState<Token[]>([]);

  


  // Show dialog first, then enable typing
  useEffect(() => {
    setDialogVisible(true);
    const timer = setTimeout(() => setReadyToType(true), 500);
    return () => clearTimeout(timer);
  }, [currentLine]);

 useEffect(() => {
  if (!readyToType || currentLine >= lines.length) return;

  setLineComplete(false);
  setDisplayedTokens([]);

  // Special handling for line 0
  if (currentLine === 0) {
    // helper: type tokens with effects
    const typeWithEffects = (
      base: Token[],
      extra: Token[],
      onFinish: () => void
    ) => {
      let tokenIndex = 0;
      let charIndex = 0;

      function typeChar() {
        if (tokenIndex >= extra.length) {
          onFinish();
          return;
        }

        const token = extra[tokenIndex];
        const { text, style } = token;

        const typedText = text.slice(0, charIndex + 1);

        setDisplayedTokens([
          ...base,
          ...extra.slice(0, tokenIndex),
          { text: typedText, style },
        ]);

        charIndex++;

        if (charIndex >= text.length) {
          const effects =
            effectsConfigPerLine[0]?.[text.trim()] || { speed: 25, pause: 0 };
          tokenIndex++;
          charIndex = 0;
          setTimeout(typeChar, effects.pause || effects.speed);
        } else {
          const effects =
            effectsConfigPerLine[0]?.[text.trim()] || { speed: 25 };
          setTimeout(typeChar, effects.speed);
        }
      }

      typeChar();
    };

    let i = firstLineErase.map((t) => t.text).join("").length;

    // Step 1: type static tokens
    const typeStatic = () => {
      typeWithEffects([], firstLineStatic, () => {
        setTimeout(typeErasePart, 200);
      });
    };

    // Step 2: type erasable tokens
    const typeErasePart = () => {
      typeWithEffects(firstLineStatic, firstLineErase, () => {
        setTimeout(eraseErasePart, 100);
      });
    };

    // Step 3: erase erasable tokens
    const eraseErasePart = () => {
      if (i > 0) {
        setDisplayedTokens([
          ...firstLineStatic,
          { text: firstLineErase.map((t) => t.text).join("").slice(0, i - 1) },
        ]);
        i--;
        setTimeout(eraseErasePart, 20);
      } else {
        setTimeout(typeReplace, 800);
      }
    };

    // Step 4: type replacement tokens
    const typeReplace = () => {
      typeWithEffects(firstLineStatic, firstLineReplace, () => {
        setLineComplete(true);
      });
    };

    typeStatic();
    return;
  }


// Normal lines typing logic (Token[][] instead of plain strings)
const lineTokens = lines[currentLine]; // already Token[]
let tokenIndex = 0;
let charIndex = 0;

function typeChar() {
  if (tokenIndex >= lineTokens.length) {
    setLineComplete(true);
    return;
  }

  const token = lineTokens[tokenIndex];
  const { text, style } = token;

  const typedText = text.slice(0, charIndex + 1);

  setDisplayedTokens([
    ...lineTokens.slice(0, tokenIndex),
    { text: typedText, style },
  ]);

  charIndex++;

  if (charIndex >= text.length) {
    // finished this token → apply effectsConfig rules
    const effects = effectsConfigPerLine[currentLine]?.[text.trim()] || {
      speed: 25,
      pause: 0,
    };

    tokenIndex++;
    charIndex = 0;

    setTimeout(typeChar, effects.pause || effects.speed);
    return;
  }

  // still typing inside current token
  const effects =
    effectsConfigPerLine[currentLine]?.[text.trim()] || { speed: 25 };
  setTimeout(typeChar, effects.speed);
}

typeChar();

}, [currentLine, readyToType]);

  const handleNext = () => {
    if (currentLine < lines.length - 1) {
      setCurrentLine((prev) => prev + 1);
      setReadyToType(false);
    } else {
      onFinish();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Background blur */}
      <div className="absolute inset-0 backdrop-blur-md bg-black/50 animate-pulse-slow"></div>

      {/* Tomo dialog box */}
      {dialogVisible && (
        <div className="relative bg-slate-900 text-white p-6 rounded-xl shadow-xl max-w-2xl w-full mx-4 animate-fade-in-down">
          {/* Avatar */}
          <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center mb-4 overflow-hidden">
            <img
              src="/tomo1-avatar.svg"
              alt="Tomo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Hidden sizer ensures full box size from start */}
          <p className="whitespace-pre-line text-lg font-mono opacity-0 pointer-events-none absolute">
            {lines.join(" ")}
          </p>

          {/* Typewriter text */}
          <p className="whitespace-pre-line text-lg font-mono">
  {displayedTokens.map((t, idx) => (
    <span
      key={idx}
      className={
        t.style === "bold"
          ? "font-bold"
          : t.style === "italic"
          ? "italic"
          : t.style === "small"
          ? "text-sm"
          : ""
      }
    >
      {t.text}
    </span>
  ))}
</p>



          {lineComplete && (
            <>
              <button
                className="mt-4 bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-500 transition animate-fade-in"
                onClick={handleNext}
              >
                Next
              </button>

              {/* Playful skip intro button */}
              <button
                className="absolute top-4 bg-slate-700 text-white w-24 h-10 rounded transition-all duration-300 cursor-not-allowed select-none animate-fade-in"
                style={{ right: "20px", position: "absolute" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget;
                  const parent = btn.parentElement!;
                  const parentRect = parent.getBoundingClientRect();
                  const btnRect = btn.getBoundingClientRect();

                  const minPadding = 20;
                  const safePadding = 90;
                  const maxX = parentRect.width - btnRect.width - minPadding;

                  const currentX = btn.offsetLeft;
                  let newX;

                  if (currentX < maxX / 2) {
                    newX = maxX;
                  } else {
                    newX = safePadding;
                  }

                  btn.style.left = `${newX}px`;
                }}
              >
                Skip Intro
              </button>
            </>
          )}
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out forwards;
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.6;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-in forwards;
        }

        button {
          transition: left 0.3s ease;
        }
      `}</style>
    </div>
  );
}





