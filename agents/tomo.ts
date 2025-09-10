// agents/tomo.ts

import { TOMO_PROMPT } from "./prompts/tomoPrompt";
import { TOMO_CHATDOCK_PROMPT } from "./prompts/tomoChatdockPrompt";
import { TOMO_SUMMARY_PROMPT } from "./prompts/tomoSummaryPrompt";
import { AgentConfig } from "./types";
import { callGroq, LLMMessage } from "@/lib/llm/groqClient";
import {
  saveChatMessageAdmin,
  getChatHistoryAdmin,
  historyToMessagesAdmin,
} from "@/lib/data/chatHistoryRepo";
import { pruneByTokenBudget } from "./prune";
import { getAgentMemoryAdmin, appendAiSummaryToMemoryAdmin } from "@/firebase/firestoreFunctionsAdmin";
import { getJournalEntriesAdmin } from "@/firebase/firestoreFunctionsAdmin"; 

export const TomoConfig: AgentConfig = {
  id: "tomo",
  name: "Tomo",
  description: "Warm, witty, empathic younger brother.",
  systemPrompt: TOMO_PROMPT, // default fallback (journal mode)
};


// 🔹 Mode-aware response generator
export async function generateTomoResponse(
  uid: string,
  userMessage: string,
  mode: "chatdock" | "journal" = "chatdock"
) {
  // load history
  const fullHistory = await getChatHistoryAdmin(uid, "tomo");
  const history = pruneByTokenBudget(fullHistory, 1400);

  // shared memory
  const mem = await getAgentMemoryAdmin(uid);

   let recentEntries: any[] = [];
  let latestMood: string | null = null;

  try {
    const allEntries = await getJournalEntriesAdmin(uid);
    recentEntries = allEntries
      .sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0))
      .slice(0, 3); // ✅ keep only the last 3

    if (recentEntries.length > 0) {
      latestMood = recentEntries[0].mood ?? null;
    }
  } catch (err) {
    console.error("❌ Failed to load journal entries for Tomo:", err);
  }

  // build system context
  
  const contextMessages: LLMMessage[] = [];

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

  if (mem?.journalContext) {
    contextMessages.push({
      role: "system",
      content: `Recent journal context: ${mem.journalContext}`
    });
  } else {
    contextMessages.push({
      role: "system",
      content: `Recent journal context: No recent journal data available.`
    });
  }

    if (latestMood) {
    contextMessages.push({
      role: "system",
      content: `User's most recent mood: ${latestMood}. 
        Adjust your tone and style according to this mood (e.g., playful if happy, gentle if sad, calm if anxious, encouraging if uncertain).`
    });
  }


  // ✅ Inject last 3 journal entries
   if (recentEntries.length > 0) {
    const summaries = recentEntries.map(e => {
      return `• [${e.createdAt?.toLocaleDateString?.() ?? "Unknown"}] Mood: ${e.mood ?? "n/a"} | Title: ${e.title ?? "Untitled"} | Summary: ${e.aiSummary ?? e.content?.slice(0, 100) + "..."}`;
    }).join("\n");

    contextMessages.push({
      role: "system",
      content: `Recent journal entries (latest first):\n${summaries}`
    });
  }


  // 🔹 Pick system prompt based on mode
  const systemPrompt =
    mode === "chatdock" ? TOMO_CHATDOCK_PROMPT : TOMO_PROMPT;

  // ✅ Build final messages
  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    ...contextMessages,
    ...historyToMessagesAdmin(history),
    { role: "user", content: userMessage },
  ];

  // Call LLM
  const reply = await callGroq(messages);

  // Persist user + AI messages
  const now = new Date().toISOString();

  await saveChatMessageAdmin(uid, "tomo", {
    role: "user",
    content: userMessage,
    timestamp: now,
  });

  await saveChatMessageAdmin(uid, "tomo", {
    role: "assistant",
    content: reply,
    timestamp: now,
  });

  return reply;
}

// 🔹 Journal summaries still use TOMO_PROMPT directly
export async function generateTomoSummary(uid: string, journalText: string, mem?: any) {
  const contextMessages: LLMMessage[] = [
    { role: "system", content: TOMO_SUMMARY_PROMPT },
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

  // 🔹 Add the actual summarization prompt
  contextMessages.push({
    role: "user",
    content: `Summarize the following journal entry with an emotional reflection and one micro-action. Keep it short (2-3 sentences max). Journal entry: \n\n${journalText}`,
  });

  const reply = await callGroq(contextMessages);

  const dateKey = new Date().toISOString().slice(0, 10);
  await appendAiSummaryToMemoryAdmin(uid, dateKey, reply, "tomo");

  return reply;
}