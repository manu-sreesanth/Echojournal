// firebase/firestoreFunctionsAdmin.ts
import { adminDB } from "@/lib/firebaseAdmin";
import { AgentMemory } from "@/types/AgentMemory";
import { GuideSession } from "@/agents/types";


// --------------------- //
// 🧠 Update Agent Memory
// --------------------- //
export const updateAgentMemoryAdmin = async (
  uid: string,
  memoryUpdate: Partial<AgentMemory>
) => {
  try {
    const agentRef = adminDB.collection("users").doc(uid).collection("agent").doc("memory");
    await agentRef.set(memoryUpdate, { merge: true });
    console.log("✅ [Admin] Agent memory updated");
  } catch (error) {
    console.error("❌ [Admin] Error updating agent memory:", error);
    throw error;
  }
};

// --------------------- //
// 🔍 Get Agent Memory
// --------------------- //
export const getAgentMemoryAdmin = async (uid: string): Promise<AgentMemory | null> => {
  try {
    const agentRef = adminDB.collection("users").doc(uid).collection("agent").doc("memory");
    const snap = await agentRef.get();
    if (!snap.exists) return null;
    return snap.data() as AgentMemory;
  } catch (error) {
    console.error("❌ [Admin] Failed to fetch agent memory:", error);
    throw error;
  }
};

// --------------------------- //
// 📝 Append AI Summary to Memory
// --------------------------- //
export const appendAiSummaryToMemoryAdmin = async (
  uid: string,
  date: string,
  summary: string,
  author: "tomo" | "kai"
) => {
  try {
    const agentRef = adminDB.collection("users").doc(uid).collection("agent").doc("memory");
    const timestamp = new Date().toISOString();
    await agentRef.set(
      {
        aiSummaries: {
          [date]: {
            ...(author ? { [author]: [{ summary, timestamp }] } : {}),
          },
        },
      },
      { merge: true }
    );
    console.log(`✅ [Admin] ${author} summary appended to memory`);
  } catch (error) {
    console.error("❌ [Admin] Error appending summary:", error);
    throw error;
  }
};

// --------------------------- //
// 📒 Get Journal Entries (Admin)
// --------------------------- //
export const getJournalEntriesAdmin = async (uid: string) => {
  try {
    const entriesRef = adminDB.collection("users").doc(uid).collection("journalEntries");
    const snapshot = await entriesRef.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: uid,
        title: data.title || "",
        content: data.content,
        mood: data.mood,
        tags: data.tags || [],
        aiSummary: data.aiSummary,
        createdAt: data.createdAt?.toDate() ?? null,
        favorite: data.favorite || false,
      };
    });
  } catch (error) {
    console.error("❌ [Admin] Failed to fetch journal entries:", error);
    throw error;
  }
};

export async function getLastGuideSession(uid: string): Promise<GuideSession | null> {
  try {
    const ref = adminDB
      .collection("users")
      .doc(uid)
      .collection("guideSessions")
      .orderBy("startedAt", "desc")
      .limit(1);

    const snap = await ref.get();
    if (snap.empty) {
      console.log("ℹ️ No guideSessions found for user:", uid);
      return null;
    }

    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as GuideSession;
  } catch (err) {
    console.error("🔥 Error fetching last guide session:", err);
    throw err;
  }
}