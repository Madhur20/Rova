// A limited, deterministic demo safeguard, not a comprehensive safety classifier.
// Keep these patterns separate from academic intent and check them first.
export function hasSafetyConcern(input: string): boolean {
  const text = input.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ");
  return /\b(suicid\w*|kill myself|self[ -]?harm|hurt myself|hurt someone|being abused)\b/.test(text)
    || /\bi\s+(?:(?:really|just)\s+)?(?:want|wanna|wish|need)\s+(?:to\s+)?(?:die|disappear|be dead|end my life|not exist)\b/.test(text)
    || /\bi\s+(?:don'?t|do not)\s+want\s+to\s+(?:live|be alive|exist)\b/.test(text)
    || /\b(?:i'?m|i am)\s+(?:going to|gonna)\s+(?:kill|hurt)\s+(?:myself|someone)\b/.test(text)
    || /\b(?:someone|my (?:mom|dad|parent|teacher))\s+(?:is\s+)?(?:hurting|hitting|abusing)\s+me\b/.test(text);
}
