import { describe, expect, it } from "vitest";
import { familyActivities, summarizeLesson, supportTopics } from "./insights";
import { sampleWorkspace, upgradeSampleWorkspace } from "./model";
import { advanceCoaching, coachingTurn, startCoaching } from "./coaching";
import { topics } from "./curriculum";

const at = "2026-10-17T19:00:00Z";
describe("evidence-based lesson summaries", () => {
  it("does not describe greetings as mathematical support", () => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "session-1", at);
    coachingTurn(workspace, "maya", session.id, "hello-1", "hi", at);
    coachingTurn(workspace, "maya", session.id, "answer-1", "2", at);
    expect(summarizeLesson(workspace, session)).toMatchObject({ independent: 1, nudges: 0, explanations: 0, redirects: 0 });
  });
  it("does not invent progress before an answer is checked", () => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "session-1", at);
    const summary = summarizeLesson(workspace, session);
    expect(summary.solved).toBe(0);
    expect(summary.overview).toContain("No answers have been checked");
    expect(summary.nextStep).toContain("remaining 3 questions");
  });
  it("summarizes actual corrections, support, independent answers, and learner quotes", () => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "session-1", at);
    coachingTurn(workspace, "maya", session.id, "request-01", "what is gthe answer", at);
    coachingTurn(workspace, "maya", session.id, "wrong-01", "3", at);
    coachingTurn(workspace, "maya", session.id, "picture-01", "Show me a picture", at);
    coachingTurn(workspace, "maya", session.id, "right-01", "2", at);
    advanceCoaching(workspace, "maya", session.id, at);
    coachingTurn(workspace, "maya", session.id, "right-02", "4", at);
    const summary = summarizeLesson(workspace, session);
    expect(summary).toMatchObject({ solved: 2, corrected: 1, independent: 1, redirects: 1, nudges: 2 });
    expect(summary.challenge).toContain("original halves");
    expect(summary.firstResponse?.text).toBe("what is gthe answer");
    expect(summary.lastResponse?.text).toBe("4");
    expect(summary.nextStep).toContain("remaining 1 question.");
    expect(session.messages.find(m => m.id === "request-01-reply")?.kind).toBe("guardrail");
  });
  it("puts safety review above an academic next step", () => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "session-1", at);
    coachingTurn(workspace, "maya", session.id, "safety-01", "I want to hurt myself", at);
    expect(summarizeLesson(workspace, session).nextStep).toContain("personal check-in");
  });
});

describe("family activity progression", () => {
  it("moves past completed activities and keeps a history for the right parent", () => {
    const workspace = sampleWorkspace();
    const child = workspace.students[0];
    expect(familyActivities(workspace, "alex", child).next?.id).toBe("fractions");
    workspace.checks = ["alex:fractions-0", "alex:fractions-1"];
    expect(familyActivities(workspace, "alex", child).next?.id).toBe("fractions");
    workspace.checks.push("alex:fractions-2");
    expect(familyActivities(workspace, "alex", child).next?.id).toBe("division");
    expect(familyActivities(workspace, "alex", child).completed).toHaveLength(1);
    expect(familyActivities(workspace, "another-parent", child).next?.id).toBe("fractions");
  });
  it("returns a finished state after all activities without recycling completed work", () => {
    const workspace = sampleWorkspace();
    workspace.checks = topics.flatMap(t => t.steps.map((_, i) => `alex:${t.id}-${i}`));
    const activities = familyActivities(workspace, "alex", workspace.students[0]);
    expect(activities.next).toBeUndefined();
    expect(activities.completed).toHaveLength(6);
  });
});

describe("simulated across-topic priority learner", () => {
  it("has one explicitly seeded learner below the support threshold in all six topics", () => {
    const workspace = sampleWorkspace();
    const priority = workspace.students.filter(s => supportTopics(s, workspace).length === 6);
    expect(priority.map(s => s.name)).toEqual(["James Walker"]);
  });
  it("upgrades an old untouched seed but preserves edited or practiced profiles", () => {
    function oldSeed() {
      const workspace = sampleWorkspace();
      const student = workspace.students.find(s => s.id === "learner-17")!;
      topics.forEach((t, j) => { student.scores[t.id] = 58 + ((17 * 17 + j * 11) % 40); });
      return workspace;
    }
    const original = oldSeed();
    upgradeSampleWorkspace(original);
    expect(supportTopics(original.students[17], original)).toHaveLength(6);
    const edited = oldSeed(); edited.students[17].scores.fractions = 99;
    upgradeSampleWorkspace(edited);
    expect(edited.students[17].scores.fractions).toBe(99);
    const practiced = oldSeed();
    practiced.attempts.push({ id: "actual-01", studentId: "learner-17", questionId: "fr1", topic: "fractions", correct: true, hints: 0, at });
    const scores = { ...practiced.students[17].scores };
    upgradeSampleWorkspace(practiced);
    expect(practiced.students[17].scores).toEqual(scores);
  });
});

describe("family activity order", () => {
  it("puts the root cause Rova traced first, ahead of the lowest score", () => {
    const workspace = sampleWorkspace();
    const maya = workspace.students.find(s => s.id === "maya")!;
    const before = familyActivities(workspace, "alex", maya).next?.id;
    const ratios = startCoaching(workspace, "maya", "ratios", "ratios-1", at);
    coachingTurn(workspace, "maya", ratios.id, "miss-0001", "7", at);
    coachingTurn(workspace, "maya", ratios.id, "miss-0002", "8", at);
    expect(familyActivities(workspace, "alex", maya).next?.id).toBe("fractions");
    expect(before).toBeDefined();
  });
});
