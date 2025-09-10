import { generateTomoSummary } from "./tomo";
import { generateKaiSummary } from "./kai";

/** Generate both summaries concurrently and return both results */
export async function generateDualJournalSummaries(
  uid: string,
  journalText: string,
  mem?: any // 🔹 Added mem param
) {
  const [tomo, kai] = await Promise.all([
    generateTomoSummary(uid, journalText, mem),
    generateKaiSummary(uid, journalText, mem),
  ]);

  // return both for UI to display; they are already persisted to memory
  return { tomo, kai };
}
