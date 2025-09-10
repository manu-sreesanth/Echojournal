import { db } from "@/firebase/firebaseConfig";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export const getLatestJournalEntry = async (uid: string) => {
  const entriesRef = collection(db, `users/${uid}/journalentries`);
  const q = query(entriesRef, orderBy("timestamp", "desc"), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].data();
  }

  return null;
};
