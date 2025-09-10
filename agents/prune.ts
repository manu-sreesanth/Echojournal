// agents/prune.ts
import type { ChatMessage } from "./types";

/** approximate tokens by chars; rough estimate (1 token ~ 4 chars). */
export function approxTokensFromString(s: string) {
  return Math.ceil(s.length / 4);
}

/** Prune history by max messages (simple) */
export function pruneByMessageCount(history: ChatMessage[], max = 40) {
  if (history.length <= max) return history;
  return history.slice(history.length - max);
}

/** Prune by approximate token budget */
export function pruneByTokenBudget(history: ChatMessage[], maxTokens = 1600) {
  let total = 0;
  const out: ChatMessage[] = [];
  // walk backward to keep most recent
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    const t = approxTokensFromString(h.content || "");
    if (total + t > maxTokens) break;
    out.unshift(h);
    total += t;
  }
  return out;
}
