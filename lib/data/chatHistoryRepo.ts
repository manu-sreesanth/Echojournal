import { adminDB } from "@/lib/firebaseAdmin";
import type { AgentId, ChatMessage } from "@/agents/types";
import { LLMMessage } from "@/lib/llm/groqClient";

export async function saveChatMessageAdmin(
  uid: string,
  agentId: AgentId,
  message: Omit<ChatMessage, "id">
) {
  const col = adminDB.collection(`users/${uid}/agents/${agentId}/chatHistory`);
  await col.add({
    ...message,
    timestamp: message.timestamp || new Date().toISOString(),
    createdAt: new Date(), // Admin SDK can just set Date
  });
}

export async function getChatHistoryAdmin(
  uid: string,
  agentId: AgentId,
  opts?: { limit?: number }
) {
  let q = adminDB.collection(`users/${uid}/agents/${agentId}/chatHistory`).orderBy("createdAt", "asc");
  if (opts?.limit) q = q.limit(opts.limit);

  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ChatMessage) }));
}

/** Convert Firestore chat history -> LLM messages (system excluded) */
export function historyToMessagesAdmin(history: ChatMessage[]): LLMMessage[] {
  return history.map((h): LLMMessage => ({
    role: h.role === "assistant" ? "assistant" : "user",
    content: h.content,
  }));
}

