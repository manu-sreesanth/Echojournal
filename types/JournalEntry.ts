export interface JournalEntry {
  id: string;
  userId: string;
  title?: string;
  content: string;
  mood: string;
  tags?: string[];
  aiSummary?: string;
  createdAt: Date | null;
  favorite?: boolean;
};
