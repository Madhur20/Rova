import type { Problem, SkillId } from "@/lib/types";
import { check_answer } from "@/lib/math/checkAnswer";

export interface RatioTable {
  firstLabel: string;
  secondLabel: string;
  firstStart: number;
  secondStart: number;
  targetSide: "first" | "second";
  target: number;
}

const ratioTables: Record<string, RatioTable> = {
  "ratio-main": {
    firstLabel: "Concentrate (cups)",
    secondLabel: "Water (cups)",
    firstStart: 2,
    secondStart: 3,
    targetSide: "first",
    target: 8,
  },
  "ratio-practice-2": {
    firstLabel: "Raisins (scoops)",
    secondLabel: "Cereal (scoops)",
    firstStart: 3,
    secondStart: 2,
    targetSide: "first",
    target: 9,
  },
  "ratio-practice-3": {
    firstLabel: "Blue paint (cups)",
    secondLabel: "White paint (cups)",
    firstStart: 4,
    secondStart: 1,
    targetSide: "second",
    target: 3,
  },
};

const practiceBySkill: Record<SkillId, Problem[]> = {
  "6.RP.A.3": [
    {
      id: "ratio-main",
      skill_id: "6.RP.A.3",
      prompt:
        "For every 2 cups of concentrate, use 3 cups of water. If there are 8 cups of concentrate, how many cups of water?",
      answer: "12",
      source: "6.RP.A.3 · Ratio tables",
    },
    {
      id: "ratio-practice-2",
      skill_id: "6.RP.A.3",
      prompt:
        "A trail mix uses 3 scoops of raisins for every 2 scoops of cereal. How many scoops of cereal go with 9 scoops of raisins?",
      answer: "6",
      source: "6.RP.A.3 · Ratio tables",
    },
    {
      id: "ratio-practice-3",
      skill_id: "6.RP.A.3",
      prompt:
        "A paint mix uses 4 cups of blue for every 1 cup of white. How many cups of blue go with 3 cups of white?",
      answer: "12",
      source: "6.RP.A.3 · Ratio tables",
    },
  ],
  "6.RP.A.1": [
    {
      id: "ratio-meaning-1",
      skill_id: "6.RP.A.1",
      prompt: "There are 2 red beads for every 5 blue beads. How many blue beads are in the ratio 2:5?",
      answer: "5",
      source: "6.RP.A.1 · Understanding ratios",
    },
    {
      id: "ratio-meaning-2",
      skill_id: "6.RP.A.1",
      prompt: "A team has 3 players wearing red for every 4 wearing blue. How many players wear red in the ratio 3:4?",
      answer: "3",
      source: "6.RP.A.1 · Understanding ratios",
    },
    {
      id: "ratio-meaning-3",
      skill_id: "6.RP.A.1",
      prompt: "A bowl has 1 apple for every 2 pears. How many pears are in the ratio 1:2?",
      answer: "2",
      source: "6.RP.A.1 · Understanding ratios",
    },
  ],
  "4.NF.A.1": [
    {
      id: "fraction-refresher-1",
      skill_id: "4.NF.A.1",
      prompt: "Which fraction is equivalent to 2/3 when both parts are multiplied by 2?",
      answer: "4/6",
      source: "4.NF.A.1 · Equivalent fractions",
    },
    {
      id: "fraction-refresher-2",
      skill_id: "4.NF.A.1",
      prompt: "Which fraction is equivalent to 3/5 when both parts are multiplied by 2?",
      answer: "6/10",
      source: "4.NF.A.1 · Equivalent fractions",
    },
    {
      id: "fraction-refresher-3",
      skill_id: "4.NF.A.1",
      prompt: "Which fraction is equivalent to 1/4 when both parts are multiplied by 3?",
      answer: "3/12",
      source: "4.NF.A.1 · Equivalent fractions",
    },
  ],
  "3.NF.A.3": [
    {
      id: "fraction-compare-1",
      skill_id: "3.NF.A.3",
      prompt: "Which is larger: 3/4 or 1/2?",
      answer: "3/4",
      source: "3.NF.A.3 · Compare fractions",
    },
    {
      id: "fraction-compare-2",
      skill_id: "3.NF.A.3",
      prompt: "Which is smaller: 1/3 or 2/3?",
      answer: "1/3",
      source: "3.NF.A.3 · Compare fractions",
    },
    {
      id: "fraction-compare-3",
      skill_id: "3.NF.A.3",
      prompt: "Which is larger: 2/5 or 4/5?",
      answer: "4/5",
      source: "3.NF.A.3 · Compare fractions",
    },
  ],
  "3.OA.C.7": [
    {
      id: "multiplication-1",
      skill_id: "3.OA.C.7",
      prompt: "What is 7 times 8?",
      answer: "56",
      source: "3.OA.C.7 · Multiplication facts",
    },
    {
      id: "multiplication-2",
      skill_id: "3.OA.C.7",
      prompt: "What is 6 times 9?",
      answer: "54",
      source: "3.OA.C.7 · Multiplication facts",
    },
    {
      id: "multiplication-3",
      skill_id: "3.OA.C.7",
      prompt: "What is 8 times 8?",
      answer: "64",
      source: "3.OA.C.7 · Multiplication facts",
    },
  ],
};

export const demoProblems = practiceBySkill["6.RP.A.3"];

export function getProblem(problemId: string): Problem | null {
  return Object.values(practiceBySkill)
    .flat()
    .find((problem) => problem.id === problemId) ?? null;
}

export function getRatioTable(problemId: string): RatioTable | null {
  return ratioTables[problemId] ?? null;
}

export function make_practice(
  skillId: SkillId,
  level: number,
  interest: string,
): Problem[] {
  const problems = practiceBySkill[skillId];
  if (!problems) return [];
  const offset = Math.max(0, Math.floor(level)) % problems.length;
  const ordered = [...problems.slice(offset), ...problems.slice(0, offset)];
  const selected = ordered.map((problem) => ({
    ...problem,
    prompt: interest.trim()
      ? `Think of ${interest.trim()} as an example: ${problem.prompt}`
      : problem.prompt,
  }));

  for (const problem of selected) {
    if (!check_answer(problem, problem.answer).correct) {
      throw new Error(`Invalid answer in practice fixture: ${problem.id}`);
    }
  }
  return selected;
}
