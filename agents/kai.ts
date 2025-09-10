// agents/kai.ts

import { KAI_PROMPT } from "./prompts/kaiPrompt";
import { KAI_SUMMARY_PROMPT } from "./prompts/kaiSummaryPrompt";
import { KAI_CHATDOCK_PROMPT } from "./prompts/kaiChatPrompt";
import { AgentConfig } from "./types";
import { callGroq, LLMMessage } from "@/lib/llm/groqClient";
import {
  saveChatMessageAdmin,
  getChatHistoryAdmin,
  historyToMessagesAdmin,
} from "@/lib/data/chatHistoryRepo"; // ✅ use Admin version
import { pruneByTokenBudget } from "./prune";
import { detectCrisis } from "./safety";
import { getAgentMemoryAdmin, appendAiSummaryToMemoryAdmin, getLastGuideSession } from "@/firebase/firestoreFunctionsAdmin";

export const KaiConfig: AgentConfig = {
  id: "kai",
  name: "Kai",
  description: "Direct, pragmatic, structured, and highly skilled at solving problems.",
  systemPrompt: KAI_PROMPT, // ✅ now using chatdock prompt
};


export async function generateKaiResponse(uid: string, userMessage: string) {
  try {
    console.log("🟦 [Kai] generateKaiResponse called", { uid, userMessage });

    if (detectCrisis(userMessage)) {
      console.warn("⚠️ [Kai] Crisis detected in user message");
      return "I detect this might be a crisis. I won't give a long plan here. Let me connect you to Tomo and safety resources.";
    }

    // ✅ get history
    const fullHistory = await getChatHistoryAdmin(uid, "kai");
    console.log("📜 [Kai] Full history length:", fullHistory?.length);

    const history = pruneByTokenBudget(fullHistory, 1400);
    console.log("✂️ [Kai] Pruned history length:", history?.length);

    const mem = await getAgentMemoryAdmin(uid);
    console.log("🧠 [Kai] Retrieved memory:", JSON.stringify(mem, null, 2));

    const lastSession = await getLastGuideSession(uid);
    console.log("📘 [Kai] Last mentoring session:", JSON.stringify(lastSession, null, 2));

    const messages: LLMMessage[] = [
      { role: "system", content: KAI_CHATDOCK_PROMPT },

      // 🔹 Personal details
      ...(mem?.personalDetails
        ? [
            {
              role: "system" as const,
              content: `User details: 
                Name: ${mem.personalDetails.firstName ?? "User"} ${mem.personalDetails.lastName ?? ""} 
                Nickname: ${mem.personalDetails.nickname ? `"${mem.personalDetails.nickname}"` : ""}
                Age: ${mem.personalDetails.age ?? "Unknown"} 
                Gender: ${mem.personalDetails.gender ?? "Unknown"} 
                Location: ${mem.personalDetails.location ?? "Unknown"} 
                Hobbies: ${mem.personalDetails.hobbies ?? "Unknown"} 
                Context: ${mem.personalDetails.personalContext ?? ""}`,
            },
          ]
        : []),

      // 🔹 Work details
      ...(mem?.workDetails
        ? [
            {
              role: "system" as const,
              content: `Work details: 
                Status: ${mem.workDetails.status ?? "Unknown"} 
                Context: ${mem.workDetails.workContext ?? ""}`,
            },
          ]
        : []),

      // 🔹 Life goals
      ...(mem?.lifeGoals?.length
        ? [
            {
              role: "system" as const,
              content: `User life goals: ${mem.lifeGoals.join(", ")}`,
            },
          ]
        : []),

      // 🔹 Journal context
      {
        role: "system",
        content: `Recent journal context: ${
          mem?.journalContext ?? "No recent journal data available."
        }`,
      },

      // 🔹 Latest mood
      ...(mem?.latestMood
        ? [
            {
              role: "system" as const,
              content: `User's most recent mood: ${mem.latestMood}. 
                Adjust your tone and style according to this mood (e.g., structured if calm, simplified if overwhelmed, short & tactical if tired, etc.).`,
            },
          ]
        : []),

      // 🔹 Last 3 journal entries
      ...(mem?.recentEntries?.length
        ? [
            {
              role: "system" as const,
              content: `Recent journal entries (latest first):\n${mem.recentEntries
                .slice(0, 3)
                .map(
                  (e: any) =>
                    `• [${e.createdAt?.toLocaleDateString?.() ?? "Unknown"}] Mood: ${
                      e.mood ?? "n/a"
                    } | Title: ${e.title ?? "Untitled"} | Summary: ${
                      e.aiSummary ?? e.content?.slice(0, 100) + "..."
                    }`
                )
                .join("\n")}`,
            },
          ]
        : []),

      // 🔹 Last mentoring session
      ...(lastSession
        ? [
            {
              role: "system" as const,
              content: `Last mentoring session (context for continuity): 
                Summary: ${lastSession.output?.text?.join(" ") ?? "No text"}
                Action items: ${
                  lastSession.output?.actionItems
                    ?.map((i: any) => i.text)
                    .join(" • ") ?? "None"
                }
                Insights: ${lastSession.output?.insights?.join(" | ") ?? "None"}
                Next steps: ${
                  lastSession.output?.nextSteps?.join(" | ") ?? "None"
                }
                References: ${
                  lastSession.output?.references?.join(" | ") ?? "None"
                }`,
            },
          ]
        : []),

      // 🔹 History + user message
      ...historyToMessagesAdmin(history),
      { role: "user", content: userMessage },
    ];

    console.log(
      "📨 [Kai] Messages being sent to Groq:",
      JSON.stringify(messages, null, 2)
    );

    const reply = await callGroq(messages);
    console.log("🤖 [Kai] Groq reply:", reply);

    const now = new Date().toISOString();

    // ✅ save
    await saveChatMessageAdmin(uid, "kai", {
      role: "user",
      content: userMessage,
      timestamp: now,
    });
    await saveChatMessageAdmin(uid, "kai", {
      role: "assistant",
      content: reply,
      timestamp: now,
    });
    console.log("💾 [Kai] Messages saved to chat history");

    return reply;
  } catch (err: any) {
    console.error("🔥 [Kai] Error in generateKaiResponse:", err);
    throw err;
  }
}


export async function generateKaiSummary(uid: string, journalText: string, mem?: any) {
  try {
    console.log("🟦 [Kai] generateKaiSummary called", { uid, journalText, mem });

    const contextMessages: LLMMessage[] = [
      { role: "system", content: KAI_SUMMARY_PROMPT },
    ];

    // 🔹 Inject personal details if available
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
          Context: ${pd.personalContext ?? ""}`,
      });
    }

    // 🔹 Inject work details
    if (mem?.workDetails) {
      const wd = mem.workDetails;
      contextMessages.push({
        role: "system",
        content: `Work details: 
          Status: ${wd.status ?? "Unknown"} 
          Context: ${wd.workContext ?? ""}`,
      });
    }

    // 🔹 Inject life goals
    if (mem?.lifeGoals?.length) {
      contextMessages.push({
        role: "system",
        content: `User life goals: ${mem.lifeGoals.join(", ")}`,
      });
    }

    // 🔹 Add summarization instruction
    contextMessages.push({
      role: "user",
      content: `Read the journal entry below. Provide a short tactical insight (one sentence) and one immediate step the user can take in <15 minutes. 

Journal entry:
${journalText}`,
    });

    const reply = await callGroq(contextMessages);

    console.log("🤖 [Kai] Groq summary reply:", reply);

    const dateKey = new Date().toISOString().slice(0, 10);

    await appendAiSummaryToMemoryAdmin(uid, dateKey, reply, "kai");
    console.log("💾 [Kai] Summary appended to memory");

    return reply;
  } catch (err: any) {
    console.error("🔥 [Kai] Error in generateKaiSummary:", err);
    throw err;
  }
}



