import type { Intent, TutorContext } from "@/lib/types";

const unsafePatterns = [
  /\bkill myself\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bself[\s-]?harm\b/i,
  /\b(?:want to|might|going to) hurt myself\b/i,
  /\b(?:hurt|harm) (?:someone|somebody|them)\b/i,
];

const answerRequestPattern =
  /\b(?:just )?(?:tell|give) me (?:the )?(?:answer|solution)\b|\bwhat(?:'s| is) the answer\b|\bsolve it for me\b|\banswer pls\b/i;
const stuckPattern =
  /\b(?:help|hlep|halp|hint|hints|idk|dunno|stuck|sttuck|don't know|dont know|i give up)\b/i;
const questionPattern =
  /^\s*(?:what|what's|how|why|when|where|who|can you|could you|explain|calculate|compute|solve)\b/i;

export function classify_intent(input: string, mode: TutorContext["mode"]): Intent {
  if (unsafePatterns.some((pattern) => pattern.test(input))) return "unsafe";
  if (answerRequestPattern.test(input)) return "ask_answer";
  if (mode === "explain") return "explain";
  if (stuckPattern.test(input)) return "stuck";
  if (questionPattern.test(input)) return "off_topic";
  if (/(?:^|\b)[-+]?\d+(?:\.\d+)?\s*(?:\/|:)\s*[-+]?\d+(?:\.\d+)?(?:\b|$)/.test(input)) {
    return "answer";
  }
  if (/(?:^|\b)[-+]?\d+(?:\.\d+)?(?:\b|$)/.test(input)) return "answer";
  return "off_topic";
}

export function explain_is_complete(input: string): boolean {
  const normalized = input.toLowerCase();
  const mentionsScaling =
    /\b(?:multiply|multiplied|multiplying|times|scale|scaled|change|changes|changed)\b/.test(
      normalized,
    );
  const mentionsBoth =
    /\b(?:both|each|top and bottom|numerator and denominator)\b/.test(normalized);
  const mentionsEquivalence =
    /\b(?:same ratio|same factor|equivalent|same value|stay balanced)\b/.test(normalized);
  return mentionsScaling && mentionsBoth && mentionsEquivalence;
}
