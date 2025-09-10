// lib/fetchEntries.ts
import { db } from "@/firebase/firebaseConfig"; // your Firebase init
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { JournalEntry } from "@/types/JournalEntry";

export const fetchEntries = async (
  uid: string,
  days: number
): Promise<JournalEntry[]> => {
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - days);

  const entriesRef = collection(db, "users", uid, "journalEntries");
  const q = query(
    entriesRef,
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      userId: uid,
      title: data.title ?? "",
      content: data.content,
      mood: data.mood,
      tags: data.tags ?? [],
      aiSummary: data.aiSummary ?? "",
      createdAt: data.createdAt?.toDate() ?? null,
    } as JournalEntry;
  });
};

export const fetchPreviousEntries = async (
  uid: string,
  days: number
): Promise<JournalEntry[]> => {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();

  startDate.setDate(now.getDate() - days * 2); // start = 2 periods ago
  endDate.setDate(now.getDate() - days);       // end = start of current period

  const entriesRef = collection(db, "users", uid, "journalEntries");
  const q = query(
    entriesRef,
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    where("createdAt", "<", Timestamp.fromDate(endDate)),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      userId: uid,
      title: data.title ?? "",
      content: data.content,
      mood: data.mood,
      tags: data.tags ?? [],
      aiSummary: data.aiSummary ?? "",
      createdAt: data.createdAt?.toDate() ?? null,
    } as JournalEntry;
  });
};

