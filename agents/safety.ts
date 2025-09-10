// agents/safety.ts
const CRISIS_PATTERNS = [
  /kill myself/i,
  /i want to die/i,
  /\bcommit suicide\b/i,
  /\bi can't go on\b/i,
  /\bhurting myself\b/i,
  /\bi will end my life\b/i,
];

export function detectCrisis(text: string): boolean {
  if (!text) return false;
  return CRISIS_PATTERNS.some(rx => rx.test(text));
}

export function getCrisisResponse() {
  return `I’m really sorry you’re feeling this way. If you are in immediate danger, please call your local emergency number right now. If you can, tell me whether you have a plan or means — I’m here to listen and stay with you. Would you like me to connect you to local emergency or crisis resources?`;
}

/** Placeholder — map user location -> hotline; implement country list in production. */
export function getLocalHotline(location?: string) {
  // production: map ISO country -> hotline numbers
  return location ? `Local hotline for ${location}: [add hotline list here]` : "If you are in the US, call 988; otherwise lookup local crisis hotline.";
}
