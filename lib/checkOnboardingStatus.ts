import { db } from "@/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export const checkOnboardingStatus = async (uid: string) => {
  const goalsDoc = await getDoc(doc(db, "users", uid, "onboarding", "goals"));
  const profileDoc = await getDoc(doc(db, "users", uid, "onboarding", "profile"));

  const hasGoals = goalsDoc.exists() && goalsDoc.data()?.goals?.length > 0;
  const hasProfile = profileDoc.exists();

  if (!hasGoals) return "/onboarding/goals";
  if (!hasProfile) return "/onboarding/details";

  return "/main";
};
