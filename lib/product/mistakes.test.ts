import { describe, expect, it } from "vitest";
import { gradeAnswer, questions } from "./curriculum";
import { coachingTurn, startCoaching } from "./coaching";
import { classifyMistake, mistakes } from "./mistakes";
import { sampleWorkspace } from "./model";

describe("common-mistake catalog", () => {
  it("covers every practice question", () => {
    for (const q of questions) expect(mistakes[q.id]?.length, q.id).toBeGreaterThan(0);
  });

  it("never lists a correct answer as a mistake", () => {
    for (const q of questions)
      for (const m of mistakes[q.id]) for (const a of m.answers) expect(gradeAnswer(q.id, a), `${q.id} ${a}`).toBe(false);
  });

  it("never gives away the answer in a nudge", () => {
    for (const q of questions)
      for (const m of mistakes[q.id]) expect(m.nudge.match(/\d[\d,]*/g) ?? [], `${q.id}: ${m.nudge}`).not.toContain(q.answer);
  });

  it("matches answers with commas or spaces", () => {
    expect(classifyMistake("pv3", "42,000")?.label).toBe("Rounded down past a 7");
    expect(classifyMistake("fr2", " 5 ")?.label).toBe("Added instead of multiplied");
    expect(classifyMistake("fr2", "7")).toBeUndefined();
  });

  it("gives the coach a specific nudge for a known mistake", () => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "multiplication", "mult-1", "2026-10-18T15:00:00.000Z");
    coachingTurn(workspace, "maya", session.id, "miss-0001", "64", "2026-10-18T15:01:00.000Z");
    expect(session.messages.at(-1)).toMatchObject({ kind: "retry" });
    expect(session.messages.at(-1)?.text).toContain("Both parts get multiplied");
  });
});
