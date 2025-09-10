import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";
import { GuideSession, MentoringOutput } from "@/lib/guide-me/types";
import { callGroq } from "@/lib/llm/groqClient";
import { getAgentMemoryAdmin } from "@/firebase/firestoreFunctionsAdmin"; // ✅ assuming you already have this helper

// ✅ Dedicated prompt for Guide Me panel
export const KAI_GUIDE_PROMPT = `
You are Kai: direct, pragmatic, systems-minded.
Inside the Guide Me panel, you act as a focused mentor who blends practical systems with personal context.


Context you always use:
- User's pre-mood and emotional state.
- Their most recent 5 journal entries (patterns, reflections, concerns).
- Their personal details, especially nickname (always address them by nickname if available, otherwise first name or "friend").
- Their work details (include observations or advice relevant to work if available).
- Their stated life goals (treat goals as the "north star").
- Balance practical mentoring with grounded encouragement, but avoid being soft — keep it constructive.

Behavior rules (inherits from global KAI_PROMPT):
- Start with a quick, 1-sentence diagnosis of what matters most right now.
- Then expand into **3–6 paragraphs** of grounded mentoring that connect:
  • the user’s mood,  
  • their recent journals,  
  • their work details (if available),  
  • and their life goals.  
- Always address the user by their nickname (or fallback).
- Action items must follow these rules:
  - Always generate **between 3 and 6 items** (never fewer than 3, never more than 6).
  - Each must be **practical, specific, time-bound, and measurable**.
  - At least one must connect directly to the user’s **life goals** (north star).
  - At least one must incorporate **work details** if available.
  - At least one must adapt to the user’s **pre-mood** (e.g. grounding if anxious, energizing if low energy).
  - Avoid generic or vague advice (e.g. “focus on self-care”) — instead give context-linked steps.
- Insights should be distilled into **principles the user can recall later**.
- Next steps should feel like a **mini action plan for the week** with fallback options.
- References must be phrased like **quick quotes or reminders** (usable as reference cards in the panel).

⚠️ IMPORTANT:
- Respond ONLY with valid JSON.
- Do not include commentary, markdown, or text outside JSON.
- Use this exact structure:
- Do not wrap JSON in triple backticks or labels like "Here is the JSON".

{
 "text": [
    "Paragraph 1 (If relavent to the advice mention mood, work details if any, and life goals, addressing the user by nickname)",
    "Paragraph 2",
    "Paragraph 3",
    "Paragraph 4 (optional)",
    "Paragraph 5 (optional)",
    "Paragraph 6 (optional)"
  ],

  "actionItems": [
   { "id": "1", "text": "Practical, time-bound step connected to the user’s life goals" },
   { "id": "2", "text": "Another measurable step that supports their work details or career context" },
   { "id": "3", "text": "A step adapted to their pre-mood (calming, energizing, or focusing)" }
   // Always generate at least 3 items, up to 6 total
 ],
  "insights": [
    "3 concise insights from journals and goals"
  ],
  "nextSteps": [
    "2–3 practical milestones for the week"
  ],
  "references": [
    "2–3 short quotes or principles"
  ]
}
`;

// ✅ New prompt for "Reflect More"
export const KAI_REFLECT_PROMPT = `
You are Kai: direct, pragmatic, systems-minded.

Task: The user has clicked "Reflect More" during a mentoring session in the Guide Me panel.
- Continue the mentoring by generating **2 NEW paragraphs** of advice or practical mentoring.
- Build directly on what was already said (no repetition).
- Offer deeper insights, clarifications, or advanced practical steps.
- Always address the user by nickname (or fallback).

⚠️ IMPORTANT:
- Respond ONLY with valid JSON.
- Output exactly 2 new paragraphs in an array.
- Use this exact structure:

{
  "text": [
    "Continuation paragraph 1",
    "Continuation paragraph 2"
  ]
}
`;


// --- Helper to safely parse model replies ---
function extractJSON(reply: string): any {
  try {
    return JSON.parse(reply);
  } catch {
    const match = reply.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No valid JSON found in reply");

    let raw = match[0];

    raw = raw.replace(
      /"text"\s*:\s*([^"][^,}]*)/s,
      (m, val) => `"text": ${JSON.stringify(val.trim())}`
    );

    raw = raw.replace(/:\s*([A-Za-z].*?)(?=[,}])/g, (m, val) => {
      if (!val.trim().startsWith('"')) {
        return `: "${val.trim()}"`;
      }
      return m;
    });

    return JSON.parse(raw);
  }
}




// --- Kai mentoring hook ---
async function getKaiMentoring(input: {
  uid: string;
  preMood: string | undefined;
  journal: { content: string; aiSummary?: string; mood?: string; createdAtISO: string; title?: string }[];
}): Promise<MentoringOutput> {
  console.log("[KaiMentoring] Input received:", JSON.stringify(input, null, 2));

  const journalText = input.journal
    .map(j => `(${j.createdAtISO} ${j.mood ?? ""}) ${j.aiSummary ?? j.content}`)
    .join("\n\n");

  // ✅ Fetch memory
  const mem = await getAgentMemoryAdmin(input.uid);

  // ✅ Build context messages
  const contextMessages: { role: "system" | "user"; content: string }[] = [];

  if (mem?.personalDetails) {
    const pd = mem.personalDetails;
    contextMessages.push({
      role: "system",
      content: `User details: 
        Name: ${pd.firstName ?? "User"} ${pd.lastName ?? ""} 
        Nickname: ${pd.nickname ? `"${pd.nickname}"` : ""}
        Age: ${pd.age ?? "Unknown"} 
        Gender: ${pd.gender ?? "Unknown"} 
        Location: ${pd.location ?? "Unknown"} 
        Hobbies: ${pd.hobbies ?? "Unknown"} 
        Context: ${pd.personalContext ?? ""}`
    });
  }

  if (mem?.workDetails) {
    const wd = mem.workDetails;
    contextMessages.push({
      role: "system",
      content: `Work details: 
        Status: ${wd.status ?? "Unknown"} 
        Context: ${wd.workContext ?? ""}`
    });
  }

  if (mem?.lifeGoals?.length) {
    contextMessages.push({
      role: "system",
      content: `User life goals: ${mem.lifeGoals.join(", ")}`
    });
  }

  // ✅ Inject last 3 journal summaries
  const recentEntries = input.journal.slice(0, 3);
  if (recentEntries.length > 0) {
    const summaries = recentEntries.map(e => {
      return `• [${new Date(e.createdAtISO).toLocaleDateString()}] Mood: ${e.mood ?? "n/a"} | Title: ${e.title ?? "Untitled"} | Summary: ${e.aiSummary ?? e.content?.slice(0, 100) + "..."}`;
    }).join("\n");

    contextMessages.push({
      role: "system",
      content: `Recent journal entries (latest first):\n${summaries}`
    });
  }

  // ✅ Main user mentoring request
  contextMessages.push({
    role: "user",
    content: `The user feels "${input.preMood ?? "unknown"}". 
Analyze their journals and context. 
Return only the structured JSON mentoring response.`
  });

  console.log("[KaiMentoring] Final context messages:", contextMessages);

  const reply = await callGroq([
    { role: "system", content: KAI_GUIDE_PROMPT },
    ...contextMessages,
    { role: "user", content: `Full journals:\n${journalText}` },
  ]);

  console.log("[KaiMentoring] Raw Groq reply:", reply);

  let parsed: MentoringOutput;
  try {
    parsed = extractJSON(reply);

    console.log("[KaiMentoring] Parsed JSON reply:", parsed);
  } catch (err) {
    console.error("[KaiMentoring] Failed to parse reply as JSON:", err);

    // Minimal safe fallback (should rarely trigger now)
    parsed = {
      text: ["Let's focus on one step at a time."],
      actionItems: [{ id: "1", text: "Reflect daily for 5 minutes" }],
      insights: ["Recurring themes need attention"],
      nextSteps: ["Pick one small action for this week"],
      references: ["Consistency beats intensity"],
    };
  }

  return parsed;
}



// --- Kai reflect more hook ---
async function getKaiReflection(input: {
  uid: string;
  previousText: string[];
}): Promise<{ text: string[] }> {
  const reply = await callGroq([
    { role: "system", content: KAI_REFLECT_PROMPT },
    {
      role: "user",
      content: `Here is what you already told the user:\n\n${input.previousText.join(
        "\n\n"
      )}\n\nContinue with 2 more paragraphs (no repeats).`,
    },
  ]);

  console.log("[KaiReflection] Raw Groq reply:", reply);

  let parsed: { text: string[] };
  try {
    parsed = extractJSON(reply);
    console.log("[KaiReflection] Parsed JSON reply:", parsed);
  } catch (err) {
    console.error("[KaiReflection] Failed to parse JSON:", err);
    parsed = {
      text: [
        "Let’s go deeper into practical steps.",
        "Focus on one or two habits that strengthen your momentum.",
      ],
    };
  }
  return parsed;
}

export async function POST(req: NextRequest) {
  try {
    const { uid, preMood, mode, previousText } = await req.json();
    console.log("[POST] Incoming request body:", { uid, preMood, mode });

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    // Reflect More mode
    if (mode === "reflect") {
      const output = await getKaiReflection({ uid, previousText });
      return NextResponse.json(output, { status: 200 });
    }


    // Fetch latest journals
    const snap = await adminDB
      .collection("users").doc(uid)
      .collection("journalEntries")
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    console.log("[POST] Journal snapshot size:", snap.size);

    const journal = snap.docs.map(d => {
      const data = d.data() as any;
      const ts = data.createdAt?.toDate?.() ?? new Date();
      return {
        content: data.content ?? "",
        aiSummary: data.aiSummary,
        mood: data.mood,
        title: data.title,
        createdAtISO: ts.toISOString(),
      };
    });

    console.log("[POST] Prepared journal entries:", JSON.stringify(journal, null, 2));

    // Kai mentoring
    const output = await getKaiMentoring({ uid, preMood, journal });
    console.log("[POST] Kai mentoring output:", JSON.stringify(output, null, 2));

    // Create session doc
    const sessionRef = adminDB
      .collection("users").doc(uid)
      .collection("guideSessions").doc();

    const session: GuideSession = {
      id: sessionRef.id,
      uid,
      preMood,
      startedAt: new Date().toISOString(),
      journalSampleCount: journal.length,
      output,
    };

    console.log("[POST] Saving session:", JSON.stringify(session, null, 2));

    await sessionRef.set(session);

    console.log("[POST] Session saved successfully:", sessionRef.id);

    return NextResponse.json(session, { status: 200 });
  } catch (e: any) {
    console.error("[POST] Error in Kai mentoring route:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}




