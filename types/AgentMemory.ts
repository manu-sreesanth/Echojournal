export interface PersonalDetails {
  firstName: string;
  lastName: string;
  nickname: string;
  age: string;
  gender?: string;
  location: string;
  hobbies: string;
  personalContext: string;
  dynamic?: Record<string, string>;
}

export type WorkStatus =
  | ""
  | "student"
  | "employed"
  | "business-owner"
  | "freelancer"
  | "unemployed"
  | "retired"
  | "other";

export interface WorkDetails {
  status?: WorkStatus;
  workContext?: string;
  dynamic?: Record<string, string>;
}

export interface AgentMemory {
  aiSummaries?: {
  [date: string]: { summary: string; timestamp: string }[];
  };
  lastWeeklySummary?: string;
  lastMonthlySummary?: string;
  lastWeeklyPopup?: string;
  lastMonthlyPopup?: string;
  lifeGoals?: string[];
  personalDetails?: Partial<PersonalDetails>;  // 👈 allow partials
  workDetails?: Partial<WorkDetails>;          // 👈 allow partials
  [key: string]: any;
}

