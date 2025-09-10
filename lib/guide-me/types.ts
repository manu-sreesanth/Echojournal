export type PreMood =
  | "sad"
  | "anxious"
  | "tired"
  | "okay"
  | "happy"
  | "excited"
  | "calm"
  | "overwhelmed"
  | "angry";



export type PostMood =
  | "motivated" | "peaceful" | "inspired" | "thoughtful" | "grateful";

export interface JournalEntry {
  id: string;
  content: string;
  aiSummary?: string;
  createdAt: { seconds: number; nanoseconds: number } | Date;
  mood?: string;
}

export interface MentoringActionItem {
  id: string;
  text: string;
  done?: boolean;
  dueISO?: string | null;
}

export interface MentoringOutput {
  text: string[];   // ✅ enforce array now
  actionItems: { id: string; text: string }[];
  insights: string[];
  nextSteps: string[];
  references: string[];
}

export interface GuideSession {
  id: string;
  uid: string;
  startedAt: string;               // ISO
  endedAt?: string;                // ISO
  preMood?: PreMood;
  postMood?: PostMood;
  journalSampleCount: number;
  output?: MentoringOutput;
}
