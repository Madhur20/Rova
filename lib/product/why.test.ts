import { describe, expect, it } from "vitest";
import { coachingTurn, startCoaching } from "./coaching";
import { sampleWorkspace } from "./model";
import { classStatuses } from "./progress";
import { familyLabel, hintReliance, needYouToday, nextStepFor, repeatedMistakes, strengthLine, topReteach, whyFor } from "./why";

const at = "2026-10-18T15:00:00.000Z";

describe("why insights", () => {
  it("explains a simulated learner with their trend and a skill-map link, labeled as such", () => {
    const ws = sampleWorkspace();
    const james = ws.students.find((s) => s.name === "James Walker")!;
    const facts = whyFor(ws, james);
    expect(facts[0]).toMatchObject({ kind: "trend", evidence: "simulated" });
    expect(facts.some((f) => f.kind === "linked-gap" && f.evidence === "skill map")).toBe(true);
    expect(nextStepFor(ws, james)).toContain("3 minutes");
  });

  it("puts a traced root cause and a repeated mistake first for Maya after the ratio challenge", () => {
    const ws = sampleWorkspace();
    const ratios = startCoaching(ws, "maya", "ratios", "ratios-1", at);
    coachingTurn(ws, "maya", ratios.id, "miss-0001", "7", at);
    coachingTurn(ws, "maya", ratios.id, "miss-0002", "8 cups", at);
    expect(repeatedMistakes(ws, "maya")[0]).toMatchObject({ topic: "ratios", label: "Added instead of multiplied" });
    const facts = whyFor(ws, ws.students[0]);
    expect(facts[0]).toMatchObject({ kind: "root-cause", evidence: "live" });
    expect(facts[0].detail).toContain("“7” and “8 cups”");
    expect(nextStepFor(ws, ws.students[0])).toContain("paper strip");
  });

  it("flags hint reliance only with enough correct answers", () => {
    const ws = sampleWorkspace();
    for (let i = 0; i < 4; i++)
      ws.attempts.push({ id: `h-${i}`, studentId: "maya", questionId: "fr2", topic: "fractions", correct: true, hints: i < 3 ? 2 : 0, at });
    expect(hintReliance(ws, "maya")).toEqual([{ topic: "fractions", correct: 4, helped: 3 }]);
  });

  it("lists who needs the teacher today, each once with the most urgent reason", () => {
    const ws = sampleWorkspace();
    const session = startCoaching(ws, "maya", "fractions", "frac-1", at);
    coachingTurn(ws, "maya", session.id, "safe-0001", "I want to hurt myself", at);
    const list = needYouToday(ws, classStatuses(ws));
    expect(list[0]).toMatchObject({ student: { id: "maya" }, reason: "Safety concern" });
    expect(list.filter((p) => p.student.id === "maya")).toHaveLength(1);
    expect(list.some((p) => p.student.name === "James Walker" && p.reason.startsWith("Stagnant"))).toBe(true);
  });

  it("picks fractions as the topic to reteach in the sample class", () => {
    const ws = sampleWorkspace();
    const reteach = topReteach(ws, classStatuses(ws));
    expect(reteach?.topic.id).toBe("fractions");
    expect(reteach?.students.length).toBeGreaterThanOrEqual(8);
  });

  it("uses plain words for families", () => {
    expect(familyLabel.stagnant).toBe("Needs extra help");
  });
});

describe("presentation fixes", () => {
  function solvedTrace() {
    const ws = sampleWorkspace();
    const ratios = startCoaching(ws, "maya", "ratios", "ratios-1", at);
    coachingTurn(ws, "maya", ratios.id, "miss-0001", "7", at);
    coachingTurn(ws, "maya", ratios.id, "miss-0002", "8", at);
    return { ws, ratios };
  }
  it("keeps an unsolved root cause in Need you today and drops it once solved", () => {
    const { ws, ratios } = solvedTrace();
    expect(needYouToday(ws).find((p) => p.student.id === "maya")?.reason).toBe("Root cause: equivalent fractions");
    coachingTurn(ws, "maya", ratios.id, "fix-0001", "9", at);
    expect(needYouToday(ws).find((p) => p.student.id === "maya")?.reason ?? "").not.toContain("Root cause");
  });
  it("words the reteach reason in plain language", () => {
    const { ws } = solvedTrace();
    expect(topReteach(ws)?.reason).toBe("Also the root cause for 1 learner stuck on ratios");
  });
  it("gives on-track learners their strongest topic instead of a repeated line", () => {
    const status = classStatuses(sampleWorkspace()).find((s) => s.student.id === "maya")!;
    expect(strengthLine(status)).toMatch(/^Strongest: .+, \d+%$/);
  });
});
