// lib/data/agentMemoryRepo.ts
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import type { AgentMemory, AiSummaryItem, AgentId } from "@/agents/types";

/**
 * Get memory document specific to an agent (not the shared memory).
 * Path: users/{uid}/agents/{agentId}
 */
export async function getIndividualAgentMemory(uid: string, agentId: AgentId): Promise<AgentMemory | null> {
  const ref = doc(db, "users", uid, "agents", agentId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as AgentMemory) : null;
}

/**
 * Set memory specific to an agent (merge mode).
 */
export async function setIndividualAgentMemory(uid: string, agentId: AgentId, memory: AgentMemory) {
  const ref = doc(db, "users", uid, "agents", agentId);
  await setDoc(ref, memory, { merge: true });
}

/**
 * Append an aiSummary only for this agent’s personal memory.
 * Example use: Kai’s long-term task tracking, Tomo’s emotional theme logs.
 */
export async function appendIndividualAiSummary(uid: string, agentId: AgentId, dateKey: string, item: AiSummaryItem) {
  const ref = doc(db, "users", uid, "agents", agentId);
  await updateDoc(ref, {
    [`aiSummaries.${dateKey}`]: arrayUnion(item),
  });
}

