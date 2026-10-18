import { describe, expect, it } from "vitest";
import { mayaProfile } from "@/lib/data/seed";
import { check_answer } from "@/lib/math/checkAnswer";
import { demoProblems } from "@/lib/tutor/problems";
import { classify_intent, explain_is_complete, respond } from "./responder";
import type { TutorContext } from "@/lib/types";

function context(
  mode: TutorContext["mode"] = "problem",
  hintLevel: TutorContext["hint_level"] = 0,
  problemId = "ratio-main",
): TutorContext {
  return {
    profile: mayaProfile,
    problem_id: problemId,
    hint_level: hintLevel,
    mode,
  };
}

describe("rule-based tutor responder", () => {
  it.each([
    ["12", "answer"],
    ["I got 12", "answer"],
    ["3/4", "answer"],
    ["3:4", "answer"],
    ["just tell me the answer", "ask_answer"],
    ["what's the answer?", "ask_answer"],
    ["help", "stuck"],
    ["hlep", "stuck"],
    ["sttuck", "stuck"],
    ["I don't know", "stuck"],
    ["what is the capital of France?", "off_topic"],
    ["What is 5 plus 7?", "off_topic"],
    ["Can you solve 3/4?", "off_topic"],
    ["I want to hurt myself", "unsafe"],
  ] as const)("classifies %s as %s", (input, expected) => {
    expect(classify_intent(input, "problem")).toBe(expected);
  });

  it("uses the answer checker and includes the lesson source", () => {
    const result = respond("9", context());
    expect(check_answer(demoProblems[0], "9")).toEqual({
      correct: false,
      error_type: "adds-across-ratio-table",
    });
    expect(result.intent).toBe("answer");
    expect(result.text).not.toMatch(/\[missing template:/);
    expect(result.source).toContain("6.RP.A.3");
    expect(result.events[0]).toMatchObject({
      type: "attempt",
      correct: false,
      error_type: "adds-across-ratio-table",
    });
  });

  it("unlocks only the next hint", () => {
    const result = respond("I’m stuck", context("problem", 1));
    expect(result.hint_level).toBe(2);
    expect(result.events[0]).toMatchObject({ type: "hint", hint_level: 2 });
  });

  it.each([
    ["ratio-main", "Concentrate", "Water", "2", "8", "4"],
    ["ratio-practice-2", "Raisins", "Cereal", "3", "9", "3"],
    ["ratio-practice-3", "White paint", "Blue paint", "1", "3", "3"],
  ])(
    "tailors hint steps to %s",
    (problemId, targetName, otherName, start, target, factor) => {
      const hintTwo = respond("help", context("problem", 1, problemId));
      const hintThree = respond("help", context("problem", 2, problemId));
      expect(hintTwo.text).toContain(targetName);
      expect(hintTwo.text).toContain(otherName);
      expect(hintTwo.text).toContain(start);
      expect(hintTwo.text).toContain(target);
      expect(hintThree.text).toContain(targetName);
      expect(hintThree.text).toContain(start);
      expect(hintThree.text).toContain(target);
      expect(hintThree.text).toContain(factor);
    },
  );

  it("offers the simulated refresher after a repeated misconception", () => {
    const repeatedProfile = {
      ...mayaProfile,
      skills: mayaProfile.skills.map((skill) =>
        skill.skill_id === "6.RP.A.3"
          ? { ...skill, misconceptions: ["adds-across-ratio-table"] }
          : skill,
      ),
    };
    const result = respond("9", { ...context(), profile: repeatedProfile });
    expect(result.next_mode).toBe("refresher");
    expect(result.source).toContain("4.NF.A.1");
    expect(result.events[0].error_type).toBe("adds-across-ratio-table");
  });

  it("scores a wrong refresher answer against the fraction skill and gives a fraction hint", () => {
    const result = respond(
      "5/6",
      context("refresher", 0, "fraction-refresher-1"),
    );
    expect(result.text.toLowerCase()).toContain("fraction");
    expect(result.events[0]).toMatchObject({
      skill_id: "4.NF.A.1",
      type: "refresher",
      correct: false,
      error_type: "calculation-slip",
    });
    expect(result.events[0].error_type).not.toBe("adds-across-ratio-table");
  });

  it("does not score explain-back with the math answer checker", () => {
    const complete =
      "I multiplied both parts by 4, so the same ratio is equivalent.";
    const result = respond(complete, context("explain"));
    expect(explain_is_complete(complete)).toBe(true);
    expect(result.events[0]).toMatchObject({ type: "explain" });
    expect(result.events[0].correct).toBeUndefined();
  });

  it("recognizes the suggested explain-back reply as complete", () => {
    const suggestion = "Both parts change by the same factor";
    expect(explain_is_complete(suggestion)).toBe(true);
    const result = respond(suggestion, context("explain"));
    expect(result.text).toContain("clear explanation");
    expect(result.quick_replies).toContain("Finish mission");
  });

  it("does not call an unsafe message an alert that has been sent", () => {
    const result = respond("I might hurt myself", context());
    expect(result.intent).toBe("unsafe");
    expect(result.events).toEqual([]);
    expect(result.quick_replies).toContain("Send to my teacher");
  });
});
