import { describe, expect, it } from "vitest";
import { coachingTurn, startCoaching } from "./coaching";
import { sampleWorkspace } from "./model";
import { classmatesWithGap, traceStatus, tracedSessions } from "./rootCause";

const at = "2026-10-18T15:00:00.000Z";
function ratiosAfterTwoMisses() {
  const workspace = sampleWorkspace();
  const ratios = startCoaching(workspace, "maya", "ratios", "ratios-1", at);
  coachingTurn(workspace, "maya", ratios.id, "miss-0001", "7", at);
  coachingTurn(workspace, "maya", ratios.id, "miss-0002", "8 cups", at);
  return { workspace, ratios };
}

describe("root-cause trace from ratios to fractions", () => {
  it("names the additive misconception on a wrong ratio answer", () => {
    const workspace = sampleWorkspace();
    const ratios = startCoaching(workspace, "maya", "ratios", "ratios-1", at);
    coachingTurn(workspace, "maya", ratios.id, "miss-0001", "7", at);
    expect(ratios.messages.at(-1)?.text).toContain("added the same amount");
    expect(ratios.trace).toBeUndefined();
  });
  it("traces two checked misses on one question to equivalent fractions", () => {
    const { workspace, ratios } = ratiosAfterTwoMisses();
    expect(ratios.trace).toMatchObject({ prerequisite: "fractions", standard: "4.NF.A.1", questionId: "ra1", wrongAnswers: ["7", "8 cups"] });
    expect(ratios.messages.at(-1)).toMatchObject({ kind: "trace", source: "4.NF.A.1" });
    expect(traceStatus(ratios.trace!)).toBe("Refresher suggested");
    expect(workspace.notes.at(-1)).toMatchObject({ studentId: "maya", automatic: true });
    expect(workspace.notes.at(-1)?.text).toContain("equivalent fractions (4.NF.A.1)");
    expect(ratios.messages.at(-1)?.text).toContain("built on equivalent fractions");
  });
  it("does not trace from non-answer messages or from topics without a prerequisite", () => {
    const workspace = sampleWorkspace();
    const ratios = startCoaching(workspace, "maya", "ratios", "ratios-1", at);
    for (const [i, text] of ["I'm stuck", "hint", "just tell me the answer"].entries()) coachingTurn(workspace, "maya", ratios.id, `talk-000${i}`, text, at);
    expect(ratios.trace).toBeUndefined();
    const fractions = startCoaching(workspace, "maya", "fractions", "fractions-1", at);
    coachingTurn(workspace, "maya", fractions.id, "miss-0001", "1", at);
    coachingTurn(workspace, "maya", fractions.id, "miss-0002", "3", at);
    expect(fractions.trace).toBeUndefined();
  });
  it("traces once, even after more misses", () => {
    const { workspace, ratios } = ratiosAfterTwoMisses();
    coachingTurn(workspace, "maya", ratios.id, "miss-0003", "10", at);
    expect(ratios.trace?.wrongAnswers).toHaveLength(2);
    expect(workspace.notes.filter(n => n.automatic)).toHaveLength(1);
  });
  it("runs the refresher, then records the original question as solved after it", () => {
    const { workspace, ratios } = ratiosAfterTwoMisses();
    const refresher = startCoaching(workspace, "maya", "fractions", "refresher-1", at, undefined, ratios.id);
    expect(refresher.refresherFor).toBe(ratios.id);
    expect(traceStatus(ratios.trace!)).toBe("Refresher in progress");
    expect(startCoaching(workspace, "maya", "fractions", "other-1", at).id).not.toBe(refresher.id);
    coachingTurn(workspace, "maya", refresher.id, "fr-a", "2", at);
    refresher.questionIndex = 1; coachingTurn(workspace, "maya", refresher.id, "fr-b", "4", at);
    refresher.questionIndex = 2; coachingTurn(workspace, "maya", refresher.id, "fr-c", "9", at);
    expect(refresher.completedAt).toBe(at);
    expect(traceStatus(ratios.trace!)).toBe("Refresher completed");
    coachingTurn(workspace, "maya", ratios.id, "fix-0001", "9", at);
    expect(ratios.trace?.fixedAt).toBe(at);
    expect(traceStatus(ratios.trace!)).toBe("Solved after refresher");
    expect(workspace.notes.filter(n => n.automatic)).toHaveLength(2);
    expect(workspace.notes.at(-1)?.text).toContain("after a fractions refresher");
  });
  it("only opens a refresher for the learner's own traced session and its prerequisite", () => {
    const { workspace, ratios } = ratiosAfterTwoMisses();
    expect(() => startCoaching(workspace, "learner-1", "fractions", "x-1", at, undefined, ratios.id)).toThrow();
    expect(() => startCoaching(workspace, "maya", "geometry", "x-2", at, undefined, ratios.id)).toThrow();
  });
  it("lists classmates who share the earlier gap, excluding the learner", () => {
    const { workspace } = ratiosAfterTwoMisses();
    const others = classmatesWithGap(workspace, "maya", "fractions");
    expect(others.length).toBeGreaterThan(0);
    expect(others.some(s => s.id === "maya")).toBe(false);
    expect(tracedSessions(workspace)).toHaveLength(1);
  });
});
