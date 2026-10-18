import { describe, expect, it } from "vitest";
import type { Problem } from "@/lib/types";
import { check_answer } from "./checkAnswer";

const ratioProblem: Problem = {
  id: "ratio-table",
  skill_id: "6.RP.A.3",
  prompt:
    "For every 2 cups of concentrate, use 3 cups of water. If there are 8 cups of concentrate, how many cups of water?",
  answer: "12",
};

const cases: Array<[string, Problem, string, boolean, string?]> = [
  ["integer answer", ratioProblem, "12", true],
  ["decimal integer answer", ratioProblem, "12.0", true],
  ["number with units", ratioProblem, "12 cups", true],
  ["answer in a sentence", ratioProblem, "I got 12", true],
  ["exact equivalent fraction", { ...ratioProblem, answer: "3/4" }, "6/8", true],
  ["ratio equivalent", { ...ratioProblem, answer: "3:4" }, "6:8", true],
  ["fraction as a ratio", { ...ratioProblem, answer: "3/4" }, "3:4", true],
  ["decimal as a fraction", { ...ratioProblem, answer: "3/4" }, "0.75", true],
  ["negative exact value", { ...ratioProblem, answer: "-3/4" }, "-0.75", true],
  ["mixed-number equivalence", { ...ratioProblem, answer: "3/2" }, "1 2/4", true],
  ["answer label", { ...ratioProblem, answer: "12" }, "Answer: 12", true],
  ["adds instead of scaling", ratioProblem, "9", false, "adds-across-ratio-table"],
  ["reverses the ratio", ratioProblem, "16/3", false, "reverses-ratio"],
  ["scales only one term", ratioProblem, "3", false, "scales-only-one-ratio-term"],
  ["incorrect fraction", { ...ratioProblem, answer: "3/4" }, "5/8", false, "calculation-slip"],
  ["zero denominator answer", { ...ratioProblem, answer: "3/4" }, "3/0", false, "unrecognized-answer"],
  ["zero denominator expected value", { ...ratioProblem, answer: "3/0" }, "3/4", false, "calculation-slip"],
  ["invalid text", ratioProblem, "twelve-ish", false, "unrecognized-answer"],
  ["commas in whole numbers", { ...ratioProblem, answer: "1200" }, "1,200", true],
  ["ratio is order-sensitive", { ...ratioProblem, answer: "3:4" }, "4:3", false, "calculation-slip"],
];

describe("check_answer", () => {
  it.each(cases)("%s", (_label, problem, answer, correct, errorType) => {
    const result = check_answer(problem, answer);
    expect(result.correct).toBe(correct);
    if (errorType) expect(result.error_type).toBe(errorType);
    else expect(result.error_type).toBeUndefined();
  });

  it("classifies adding across a ratio table", () => {
    expect(check_answer(ratioProblem, "9").error_type).toBe(
      "adds-across-ratio-table",
    );
  });

  it("does not apply ratio-table errors to equivalent-fraction exercises", () => {
    const fractionProblem: Problem = {
      id: "fraction-refresher-1",
      skill_id: "4.NF.A.1",
      prompt: "Which fraction is equivalent to 2/3 when both parts are multiplied by 2?",
      answer: "4/6",
    };
    expect(check_answer(fractionProblem, "5/6")).toEqual({
      correct: false,
      error_type: "calculation-slip",
    });
  });

  it("rejects non-integer arithmetic without rounding", () => {
    expect(
      check_answer({ ...ratioProblem, answer: "1/3" }, "0.3333333333333333")
        .correct,
    ).toBe(false);
  });
});
