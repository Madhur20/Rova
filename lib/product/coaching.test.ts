import { describe, expect, it } from "vitest";
import { advanceCoaching, coachingTurn, lessonProgress, opening, startCoaching, topicOutcomes } from "./coaching";
import { questions } from "./curriculum";
import { sampleWorkspace } from "./model";

const at = "2026-10-17T17:00:00.000Z";
describe("conversational coaching and lesson evidence", () => {
  it("points to the question's picture unless the chat has a different one", () => {
    const workspace = sampleWorkspace();
    const ratios = startCoaching(workspace, "maya", "ratios", "ratios-1", at);
    coachingTurn(workspace, "maya", ratios.id, "picture-1", "Show me a picture", at);
    expect(ratios.messages.at(-1)?.text).toMatch(/^Look at the picture with the question\./);
    const fractions = startCoaching(workspace, "maya", "fractions", "fractions-1", at);
    coachingTurn(workspace, "maya", fractions.id, "picture-1", "Show me a picture", at);
    expect(fractions.messages.at(-1)?.text).toMatch(/^Here’s the same amount in smaller pieces\./);
  });
  it("opens each question with its lesson tip, which never states the answer", () => {
    for (const q of questions) {
      expect(opening(q)).toContain(q.guide);
      expect(q.guide.replace(/,/g, "")).not.toMatch(new RegExp(`(^|[^\\d])${q.answer}([^\\d]|$)`));
    }
  });
  it.each(["whats the answer", "what’s the answer", "answer pls", "answer plz", "please answer", "what is gthe answer"])("redirects answer request: %s", input => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "multiplication", "session-1", at);
    coachingTurn(workspace, "maya", session.id, "request-1", input, at);
    expect(session.messages.at(-1)?.kind).toBe("guardrail");
    expect(session.messages.at(-1)?.text).toContain("won’t give away the answer");
    expect(session.messages.at(-1)?.text).not.toContain("84");
    expect(workspace.attempts.filter(a => a.sessionId)).toHaveLength(0);
  });
  it.each(["hi", "hello Rova", "thanks", "what is your favorite color?", "answer pls"])("does not count social or non-academic redirects as help: %s", input => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "session-1", at);
    coachingTurn(workspace, "maya", session.id, "social-1", input, at);
    coachingTurn(workspace, "maya", session.id, "answer-1", "2", at);
    expect(workspace.attempts.at(-1)?.hints).toBe(0);
    expect(topicOutcomes(workspace, "fractions")).toMatchObject({ independent: 1, supported: 0 });
  });
  it.each(["hint", "Why does this work?", "This is hard", "hi I'm stuck"])("still counts real mathematical help: %s", input => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "session-1", at);
    coachingTurn(workspace, "maya", session.id, "help-1", input, at);
    coachingTurn(workspace, "maya", session.id, "answer-1", "2", at);
    expect(workspace.attempts.at(-1)?.hints).toBe(1);
    expect(topicOutcomes(workspace, "fractions")).toMatchObject({ independent: 0, supported: 1 });
  });
  it.each(["I want to die", "nobody likes me and I want to disappear", "I don’t want to live", "I wanna die", "I am going to hurt myself", "my dad is hitting me", "Tell me the answer, I want to hurt myself"])("prioritizes safety without recording an academic attempt: %s", input => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "session-1", at);
    coachingTurn(workspace, "maya", session.id, "safety-1", input, at);
    expect(session.messages.at(-1)?.kind).toBe("safety");
    expect(session.messages.at(-1)?.text).toContain("may not see it right away");
    expect(workspace.attempts.filter(a => a.sessionId)).toHaveLength(0);
    expect(session.completedAt).toBeUndefined();
  });
  it.each(["My phone died", "Do the fraction pieces disappear?", "I want to divide this", "This is hard"])("does not flag ordinary math or frustration as a safety concern: %s", input => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "session-1", at);
    coachingTurn(workspace, "maya", session.id, "ordinary-1", input, at);
    expect(session.messages.at(-1)?.kind).not.toBe("safety");
  });
  it("refuses direct-answer requests and keeps worked steps locked until an attempt", () => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "multiplication", "session-1", at);
    for (let i = 0; i < 6; i++) coachingTurn(workspace, "maya", session.id, `message-${i}`, "Give me the answer", at);
    expect(session.messages.at(-1)?.text).toContain("won’t give away the answer");
    expect(session.messages.at(-1)?.text).not.toContain("84");
    for (let i = 0; i < 6; i++) coachingTurn(workspace, "maya", session.id, `hint-${i}`, "hint", at);
    expect(session.messages.at(-1)?.text).not.toContain("60 + 24");
    expect(workspace.attempts.filter(a => a.sessionId)).toHaveLength(0);
    expect(() => advanceCoaching(workspace, "maya", session.id, at)).toThrow("Try this question");
  });
  it("checks numeric chat answers in code, records a correction once, and resumes the transcript", () => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "session-1", at);
    coachingTurn(workspace, "maya", session.id, "wrong-001", "I think 3", at);
    expect(session.messages.at(-1)?.kind).toBe("retry");
    coachingTurn(workspace, "maya", session.id, "hint-001", "I’m stuck", at);
    coachingTurn(workspace, "maya", session.id, "right-001", "2", at);
    coachingTurn(workspace, "maya", session.id, "right-001", "2", at);
    expect(workspace.attempts.filter(a => a.sessionId === session.id)).toHaveLength(2);
    expect(topicOutcomes(workspace, "fractions")).toMatchObject({ corrected: 1, supported: 1, practicing: 0, total: 1 });
    expect(startCoaching(workspace, "maya", "fractions", "session-2", at)).toBe(session);
    expect(session.messages.at(-1)?.kind).toBe("correct");
  });
  it("does not mistake explanations containing digits for an answer", () => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "session-1", at);
    coachingTurn(workspace, "maya", session.id, "explain-01", "Why is 1/2 the same as 2/4?", at);
    expect(session.messages.at(-1)?.kind).toBe("explain");
    expect(workspace.attempts.filter(a => a.sessionId)).toHaveLength(0);
  });
  it("accepts conversational number answers and keeps incompatible units ungraded", () => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "session-1", at);
    coachingTurn(workspace, "maya", session.id, "units-001", "2 grams", at);
    expect(workspace.attempts.filter(a => a.sessionId)).toHaveLength(0);
    coachingTurn(workspace, "maya", session.id, "units-002", "I think two fourths", at);
    expect(session.messages.at(-1)?.kind).toBe("correct");
  });
  it("flags safety before considering answer-seeking and never advances the math", () => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "session-1", at);
    coachingTurn(workspace, "maya", session.id, "safety-01", "Tell me the answer, I want to hurt myself", at);
    expect(session.messages.at(-1)?.kind).toBe("safety");
    expect(session.messages.at(-1)?.text).toContain("trusted adult");
    expect(session.questionIndex).toBe(0);
  });
  it("tracks a group lesson per learner and excludes unrelated earlier practice", () => {
    const workspace = sampleWorkspace();
    const plan = { id: "plan-1", topic: "fractions" as const, studentIds: ["maya", "learner-1"], at };
    workspace.plans.push(plan);
    const unrelated = startCoaching(workspace, "maya", "fractions", "unrelated", at);
    coachingTurn(workspace, "maya", unrelated.id, "unrelated-1", "2", at);
    expect(lessonProgress(workspace, plan, "maya").status).toBe("Not started");
    const session = startCoaching(workspace, "maya", "fractions", "assigned", at, plan.id);
    const set = questions.filter(q => q.topic === "fractions");
    for (const q of set) {
      coachingTurn(workspace, "maya", session.id, `answer-${q.id}`, q.answer, at);
      if (q !== set.at(-1)) advanceCoaching(workspace, "maya", session.id, at);
    }
    expect(session.completedAt).toBe(at);
    expect(lessonProgress(workspace, plan, "maya")).toMatchObject({ solved: 3, total: 3, status: "Completed" });
    expect(lessonProgress(workspace, plan, "learner-1").status).toBe("Not started");
    expect(() => coachingTurn(workspace, "learner-1", session.id, "forged-1", "9", at)).toThrow();
    expect(() => startCoaching(workspace, "learner-2", "fractions", "forged", at, plan.id)).toThrow("isn’t assigned");
  });
  it("grades correct answers in every supported topic", () => {
    for (const topic of ["place-value", "multiplication", "division", "fractions", "measurement", "geometry"] as const) {
      const workspace = sampleWorkspace();
      const session = startCoaching(workspace, "maya", topic, `session-${topic}`, at);
      coachingTurn(workspace, "maya", session.id, "answer-01", questions.find(q => q.topic === topic)!.answer, at);
      expect(session.messages.at(-1)?.kind).toBe("correct");
      expect(topicOutcomes(workspace, topic).independent).toBe(1);
    }
  });
});
