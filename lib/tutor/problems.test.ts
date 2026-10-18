import { describe, expect, it } from "vitest";
import { check_answer } from "@/lib/math/checkAnswer";
import { skillMap } from "@/lib/data/seed";
import { find_source } from "@/content/lessons";
import { getProblem, make_practice } from "./problems";

describe("student lesson and practice content", () => {
  it("provides three code-verified problems for each demo skill", () => {
    for (const skillId of Object.keys(skillMap)) {
      const problems = make_practice(skillId, 0, "");
      expect(problems).toHaveLength(3);
      for (const problem of problems) {
        expect(problem.skill_id).toBe(skillId);
        expect(check_answer(problem, problem.answer).correct).toBe(true);
        expect(find_source(skillId, problem.prompt)).not.toBeNull();
      }
    }
  });

  it("rotates the practice set and uses the optional interest context", () => {
    const first = make_practice("6.RP.A.3", 0, "basketball");
    const second = make_practice("6.RP.A.3", 1, "");
    expect(first[0].prompt).toContain("Think of basketball as an example:");
    expect(second[0].id).not.toBe(first[0].id);
  });

  it("returns no practice for a skill outside the demo map", () => {
    expect(make_practice("8.EE.C.7", 0, "")).toEqual([]);
    expect(getProblem("unknown-problem")).toBeNull();
    expect(find_source("8.EE.C.7", "solve it")).toBeNull();
  });
});
