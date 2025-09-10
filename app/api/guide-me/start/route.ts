import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";
import { GuideSession, MentoringOutput } from "@/lib/guide-me/types";
import { callGroq } from "@/lib/llm/groqClient";
import { getAgentMemoryAdmin } from "@/firebase/firestoreFunctionsAdmin"; // ✅ assuming you already have this helper
import { KAI_GUIDE_PROMPT, KAI_REFLECT_PROMPT } from "@/agents/prompts/guideme";




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




