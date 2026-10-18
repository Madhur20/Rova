import { describe, expect, it } from "vitest";
import { visibleWorkspace } from "./server";
import { sampleWorkspace } from "./model";
import { startCoaching, coachingTurn } from "./coaching";

describe("workspace conversation visibility", () => {
  it("shows teachers all sessions, students only their own, and parents outcomes without transcripts", () => {
    const workspace = sampleWorkspace();
    workspace.plans.push({ id: "plan-1", topic: "fractions", studentIds: ["maya", "learner-1"], at: "2026-10-17" });
    const maya = startCoaching(workspace, "maya", "fractions", "session-maya", "2026-10-17", "plan-1");
    startCoaching(workspace, "learner-1", "fractions", "session-other", "2026-10-17", "plan-1");
    coachingTurn(workspace, "maya", maya.id, "message-01", "3", "2026-10-17");
    const account = { id: "maya", role: "student" as const, name: "Maya", avatar: "sage", school: "Maplewood", goal: 10, hash: "", salt: "" };
    const student = visibleWorkspace(workspace, account);
    expect(student.sessions?.map(s => s.id)).toEqual(["session-maya"]);
    expect(student.plans[0].studentIds).toEqual(["maya"]);
    expect(student.attempts.every(a => a.studentId === "maya")).toBe(true);
    expect(visibleWorkspace(workspace, { ...account, id: "teacher", role: "teacher" }).sessions).toHaveLength(2);
    const parent = visibleWorkspace(workspace, { ...account, id: "parent", role: "parent", linkedStudentId: "maya" });
    expect(parent.sessions?.map(s => s.id)).toEqual(["session-maya"]);
    expect(parent.sessions?.every(s => s.messages.length === 0)).toBe(true);
    expect(parent.attempts.every(a => a.studentId === "maya")).toBe(true);
  });
});
