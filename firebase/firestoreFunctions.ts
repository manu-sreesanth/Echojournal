import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  Timestamp,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { AgentMemory, PersonalDetails, WorkDetails } from "@/types/AgentMemory";
import { UserProfile } from "@/types/UserProfile";


export const saveUserAgreement = async (uid: string, preferences: any) => {
  await setDoc(
    doc(db, "users", uid, "onboarding", "profile"),
    {
      userAgreement: true,
      preferences,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};


// ------------------ //
// 🧍 Save User Profile
// ------------------ //
export async function saveUserProfileAndAgentMemory(
  uid: string,
  profileData: {
    lifeGoals?: string[];
    personalDetails?: Partial<PersonalDetails>;
    workDetails?: Partial<WorkDetails>;
  }
) {
  if (!uid) throw new Error("User ID is required");

  // 🔹 Normalize structure (avoid undefined + enforce dynamic map)
  const normalizedProfile: typeof profileData = {};

  if (profileData.personalDetails && Object.keys(profileData.personalDetails).length > 0) {
    normalizedProfile.personalDetails = profileData.personalDetails;
  }

  if (profileData.workDetails && Object.keys(profileData.workDetails).length > 0) {
    normalizedProfile.workDetails = {
      ...profileData.workDetails,
      dynamic: profileData.workDetails.dynamic || {},
    };
  }

  if (profileData.lifeGoals && profileData.lifeGoals.length > 0) {
    normalizedProfile.lifeGoals = profileData.lifeGoals;
  }

  // 🔹 Prepare agent memory update
  const filteredMemoryUpdate: Partial<AgentMemory> = {};
  if (normalizedProfile.personalDetails) {
    filteredMemoryUpdate.personalDetails = normalizedProfile.personalDetails as PersonalDetails;
  }
  if (normalizedProfile.workDetails) {
    filteredMemoryUpdate.workDetails = normalizedProfile.workDetails as WorkDetails;
  }
  if (normalizedProfile.lifeGoals) {
    filteredMemoryUpdate.lifeGoals = normalizedProfile.lifeGoals;
  }
  filteredMemoryUpdate.updatedAt = serverTimestamp();

  try {
    // 1️⃣ Save complete profile (clean orphan fields)
    await setDoc(
      doc(db, "users", uid, "onboarding", "profile"),
      {
        ...normalizedProfile,
        status: deleteField(),      // cleanup legacy top-level fields
        workContext: deleteField(),
        dynamic: deleteField(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 2️⃣ Merge partial data into agent memory
    if (Object.keys(filteredMemoryUpdate).length > 1) {
      await setDoc(
        doc(db, "users", uid, "agent", "memory"),
        filteredMemoryUpdate,
        { merge: true }
      );
    }
  } catch (error) {
    console.error("❌ Error saving user profile & agent memory:", error);
    throw error;
  }
}

// 📄 Get User Profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const profileRef = doc(db, "users", uid, "onboarding", "profile");
    const docSnap = await getDoc(profileRef);
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  } catch (error) {
    console.error("❌ Failed to fetch user profile:", error);
    throw error;
  }
};


// ------------------------ //
// 📓 Add Journal Entry
// ------------------------ //
export const addJournalEntry = async (
  uid: string,
  content: string,
  mood: string,
  aiSummary: string,
  title?: string,
  tags?: string[]

) => {
  try {
    const entryRef = collection(db, "users", uid, "journalEntries");
    const docRef = await addDoc(entryRef, {
      title: title || "",
      content,
      mood,
      tags: tags || [],
      aiSummary,
      createdAt: Timestamp.now(),
    });
    console.log("✅ Journal entry added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Failed to add journal entry:", error);
    throw error;
  }
};

// ------------------------
// 📚 Get All Journal Entries
// ------------------------ //
export const getJournalEntries = async (uid: string) => {
  try {
    const entriesRef = collection(db, "users", uid, "journalEntries");
    const querySnapshot = await getDocs(entriesRef);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: uid,
        title: data.title || "",         // ✅ include title
        content: data.content,
        mood: data.mood,
        tags: data.tags || [],           // ✅ include tags
        aiSummary: data.aiSummary,
        createdAt: data.createdAt?.toDate() ?? null,
        favorite: data.favorite || false, // (optional if you want fav support in DB)
      };
    });
  } catch (error) {
    console.error("❌ Failed to fetch journal entries:", error);
    throw error;
  }
};

export const appendAiSummaryToMemory = async (
  uid: string,
  date: string,
  summary: string,
  author: "tomo" | "kai"
) => {
  const agentRef = doc(db, "users", uid, "agent", "memory");
  const timestamp = new Date().toISOString();

  try {
    await updateDoc(agentRef, {
      [`aiSummaries.${date}`]: arrayUnion({
        author,
        summary,
        timestamp,
      }),
    });
    console.log(`✅ ${author} summary appended to memory`);
  } catch (error) {
    console.error("❌ Error appending summary:", error);
    throw error;
  }
};



export const updateJournalEntry = async (
  uid: string,
  entryId: string,
  data: {
    title?: string;
    content?: string;
    mood?: string;
    tags?: string[];
    favorite?: boolean;
  }
) => {
  const ref = doc(db, "users", uid, "journalEntries", entryId);
  await updateDoc(ref, data);
  console.log("✅ Journal entry updated:", entryId);
};

export const deleteJournalEntry = async (uid: string, entryId: string) => {
  const ref = doc(db, "users", uid, "journalEntries", entryId);
  await deleteDoc(ref);
  console.log("🗑️ Journal entry deleted:", entryId);
};


// --------------------- //
// 🧠 Update Agent Memory
// --------------------- //
export const updateAgentMemory = async (
  uid: string,
  memoryUpdate: Partial<AgentMemory>
) => {
  try {
    const agentRef = doc(db, "users", uid, "agent", "memory");
    await setDoc(agentRef, memoryUpdate, { merge: true });
    console.log("✅ Agent memory updated");
  } catch (error) {
    console.error("❌ Error updating agent memory:", error);
    throw error;
  }
};

// --------------------- //
// 🔍 Get Agent Memory
// --------------------- //
export const getAgentMemory = async (uid: string): Promise<AgentMemory | null> => {
  try {
    const memoryRef = doc(db, "users", uid, "agent", "memory");
    const docSnap = await getDoc(memoryRef);
    return docSnap.exists() ? (docSnap.data() as AgentMemory) : null;
  } catch (error) {
    console.error("❌ Failed to fetch agent memory:", error);
    throw error;
  }
};


