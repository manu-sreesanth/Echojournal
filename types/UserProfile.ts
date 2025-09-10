// types/UserProfile.ts
import { PersonalDetails, WorkDetails } from "./AgentMemory";

export interface UserProfile {
  lifeGoals?: string[]; // made optional for flexibility
  personalDetails?: Partial<PersonalDetails>; // 👈 allow partial
  workDetails?: Partial<WorkDetails>;         // 👈 allow partial
  updatedAt?: any; // Firestore timestamp
  userAgreement?: boolean; 

  preferences?: {
    newsletter?: boolean;
    alerts?: boolean;
    reminders?: boolean;
  };
  email?: string;

}


