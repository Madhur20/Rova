import { describe, expect, it } from "vitest";
import { sampleWorkspace } from "./model";
import { allTopics, questions } from "./curriculum";
import { bankFor, gradeQuestion, inBankOrder, pickQuestionIds, suggestedQuestions, validateDraft } from "./bank";
import { lessonProgress, startCoaching, coachingTurn, advanceCoaching } from "./coaching";

const custom = { id: "custom-1", topic: "fractions" as const, prompt: "Fill in the missing numerator: 1/2 = ?/8", answer: "4", hints: ["What did you multiply 2 by?", "Same number on top.", "2 × 4 = 8, so 1 × 4."], explanation: "Both parts were multiplied by 4.", guide: "Same whole, smaller pieces.", simple: "Cut each piece into 4.", origin: "teacher" as const, at: "2026-10-18T00:00:00.000Z" };

describe("question bank", () => {
  it("merges built-in questions with the teacher's own", () => {
    const workspace = { ...sampleWorkspace(), questions: [custom] };
    expect(bankFor(workspace, "fractions").map(q => q.id)).toEqual(["fr1", "fr2", "fr3", "custom-1"]);
    expect(bankFor(workspace, "geometry")).toHaveLength(3);
  });
  it("picks a bounded random set in bank order", () => {
    const workspace = { ...sampleWorkspace(), questions: [custom] };
    expect(pickQuestionIds(workspace, "fractions", 3, () => 0.99)).toEqual(["fr2", "fr3", "custom-1"]);
    expect(pickQuestionIds(workspace, "fractions", 0)).toHaveLength(3);
    expect(pickQuestionIds(workspace, "fractions", 50)).toHaveLength(4);
    expect(pickQuestionIds(workspace, "geometry", -2)).toHaveLength(1);
    expect(inBankOrder(workspace, "fractions", ["custom-1", "fr1"])).toEqual(["fr1", "custom-1"]);
  });
  it("suggests gradeable questions that never state their own answer", () => {
    const workspace = sampleWorkspace();
    for (const topic of allTopics) {
      const suggestions = suggestedQuestions(workspace, topic.id);
      expect(suggestions.length).toBeGreaterThan(0);
      for (const s of suggestions) {
        expect(validateDraft(s)).toBeNull();
        const q = { ...s, id: s.key };
        expect(gradeQuestion(q, s.answer)).toBe(true);
        expect(gradeQuestion(q, String(Number(s.answer) + 1))).toBe(false);
        expect(questions.some(q => q.prompt === s.prompt)).toBe(false);
        expect(s.basis).toContain("standard");
      }
    }
  });
  it("references a course material when one covers the topic", () => {
    const workspace = { ...sampleWorkspace(), materials: [{ id: "m1", title: "Grade 4 Handbook", kind: "handbook" as const, topics: ["fractions" as const], notes: "", at: "" }] };
    expect(suggestedQuestions(workspace, "fractions").every(s => s.source === "m1" && s.basis === "Written from Grade 4 Handbook")).toBe(true);
    expect(suggestedQuestions(workspace, "geometry").every(s => !s.source)).toBe(true);
  });
  it("validates drafts the way the form and the API expect", () => {
    expect(validateDraft({ ...custom, prompt: "Hi" })).toMatch(/question/i);
    expect(validateDraft({ ...custom, answer: "four" })).toMatch(/number/i);
    expect(validateDraft({ ...custom, hints: [] })).toMatch(/hint/i);
    expect(validateDraft({ ...custom, hints: ["The answer is 4."] })).toMatch(/answer/i);
    expect(validateDraft({ ...custom, hints: ["It is 4."] })).toMatch(/answer/i);
    expect(validateDraft({ ...custom, hints: ["So 1 × 4 = 4."] })).toMatch(/answer/i);
    expect(validateDraft({ ...custom, hints: ["2 × 4 = 8, so multiply the top by 4 too."] })).toBeNull();
    expect(validateDraft(custom)).toBeNull();
  });
  it("grades a custom question with the shared checker", () => {
    expect(gradeQuestion(custom, "4")).toBe(true);
    expect(gradeQuestion(custom, " 4 ")).toBe(true);
    expect(gradeQuestion(custom, "8/2")).toBe(true);
    expect(gradeQuestion(custom, "5")).toBe(false);
    expect(gradeQuestion(custom, "4; drop table")).toBe(false);
  });
  it("runs a lesson through the plan's chosen questions only", () => {
    const workspace = { ...sampleWorkspace(), questions: [custom] };
    workspace.plans.push({ id: "p1", topic: "fractions", studentIds: ["maya"], at: "", questionIds: ["fr2", "custom-1"] });
    const session = startCoaching(workspace, "maya", "fractions", "s1", "2026-10-18T00:00:00.000Z", "p1");
    expect(session.questionIds).toEqual(["fr2", "custom-1"]);
    expect(session.messages[0].questionId).toBe("fr2");
    expect(lessonProgress(workspace, workspace.plans[0], "maya").total).toBe(2);
    coachingTurn(workspace, "maya", "s1", "answer-1", "4", "2026-10-18T00:01:00.000Z");
    advanceCoaching(workspace, "maya", "s1", "2026-10-18T00:02:00.000Z");
    expect(session.messages.at(-1)?.questionId).toBe("custom-1");
    coachingTurn(workspace, "maya", "s1", "answer-2", "3", "2026-10-18T00:03:00.000Z");
    expect(session.messages.at(-1)?.kind).toBe("retry");
    coachingTurn(workspace, "maya", "s1", "answer-3", "4", "2026-10-18T00:04:00.000Z");
    expect(session.completedAt).toBeTruthy();
    expect(lessonProgress(workspace, workspace.plans[0], "maya").status).toBe("Completed");
  });
});
