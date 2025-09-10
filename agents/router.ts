// agents/router.ts
import { detectCrisis } from "./safety";

export function routeMessage(text: string, detectedEmotion?: string): "tomo" | "kai" | "both" {
  const t = text.toLowerCase();

  if (detectCrisis(text)) return "tomo";

  const planKeywords = ["plan", "steps", "how do i", "budget", "schedule", "timeline", "roadmap", "negotiate", "raise", "study plan"];
  if (planKeywords.some(k => t.includes(k))) return "kai";

  // emotion hints
  if (detectedEmotion === "sad" || detectedEmotion === "anxious" || detectedEmotion === "overwhelmed") return "tomo";

  // defaults
  return "tomo";
}
