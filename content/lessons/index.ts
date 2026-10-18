export interface LessonSection {
  skill_id: string;
  ref: string;
  title: string;
  text: string;
  keywords: string[];
}

export const lessonSections: LessonSection[] = [
  {
    skill_id: "6.RP.A.3",
    ref: "6.RP.A.3 · Ratio tables",
    title: "Scale both parts of a ratio",
    text: "A ratio table keeps equivalent pairs together. Multiply or divide both values in a row by the same number.",
    keywords: ["table", "scale", "multiply", "ratio", "water", "concentrate"],
  },
  {
    skill_id: "6.RP.A.1",
    ref: "6.RP.A.1 · Understanding ratios",
    title: "Read a ratio in order",
    text: "A ratio compares two quantities in a stated order. The first number counts the first quantity; the second counts the second.",
    keywords: ["compare", "order", "for every", "quantity"],
  },
  {
    skill_id: "4.NF.A.1",
    ref: "4.NF.A.1 · Equivalent fractions",
    title: "Make equivalent fractions",
    text: "Multiply or divide the numerator and denominator by the same nonzero number to name an equivalent fraction.",
    keywords: ["fraction", "equivalent", "numerator", "denominator"],
  },
  {
    skill_id: "3.NF.A.3",
    ref: "3.NF.A.3 · Compare fractions",
    title: "Compare fractions",
    text: "Fractions can be compared by finding equivalent fractions with a shared denominator or by using a number line.",
    keywords: ["compare", "larger", "smaller", "number line"],
  },
  {
    skill_id: "3.OA.C.7",
    ref: "3.OA.C.7 · Multiplication facts",
    title: "Use multiplication facts",
    text: "Use known multiplication facts or a related fact to find a product. Multiplication can help scale equivalent ratios.",
    keywords: ["multiply", "product", "times", "facts"],
  },
];

export function find_source(
  skillId: string,
  question: string,
): { ref: string; text: string } | null {
  const sections = lessonSections.filter((section) => section.skill_id === skillId);
  if (sections.length === 0) return null;
  const normalized = question.toLowerCase();
  const section =
    sections.find((candidate) =>
      candidate.keywords.some((keyword) => normalized.includes(keyword)),
    ) ?? sections[0];
  return { ref: section.ref, text: section.text };
}
