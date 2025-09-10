import { db } from "@/firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const addMessageToChatHistory = async ({
  uid,
  role,
  content,
}: {
  uid: string;
  role: "assistant" | "user";
  content: string;
}) => {
  const chatRef = collection(db, `users/${uid}/agent_chatHistory`);
  await addDoc(chatRef, {
    role,
    content,
    timestamp: serverTimestamp(),
    source: "auto", // optional tag to indicate AI-triggered
  });
};
