import { AgentMemory } from "@/types/AgentMemory";

export type AgentId = "tomo" | "kai";
export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  role: Role;
  content: string;
  timestamp: string;
  emotion?: string;
  intent?: string;
}

export interface AiSummaryItem {
  author: AgentId;
  summary: string;
  timestamp: string;
}

export interface AgentConfig {
  id: AgentId;
  name: string;
  description: string;
  systemPrompt: string;
}

export interface AgentContext {
  memory: AgentMemory;
  history: ChatMessage[];
}

// types.ts
export interface GuideSession {
  id: string;
  startedAt: FirebaseFirestore.Timestamp;
  output?: {
    text?: string[];
    actionItems?: { id: string; text: string }[];
    insights?: string[];
    nextSteps?: string[];
    references?: string[];
  };
}
