import { describe, expect, it } from "vitest";
import { sampleWorkspace, type Learner } from "./model";
import {
  classStatuses,
  countByStatus,
  currentUnit,
  momentumHistory,
  planImpact,
  studentStatus,
  topicStatus,
  type Point,
} from "./progress";

const now = new Date("2026-10-18T15:00:00.000Z");
const week = 7 * 86_400_000;
const learner: Learner = { id: "new-1", name: "Test Learner", avatar: "sage", scores: {} };
const points = (...scores: number[]): Point[] =>
  scores.map((score, i) => ({ at: new Date(now.getTime() - (scores.length - 1 - i) * week).toISOString(), score, simulated: true }));
const status = (...scores: number[]) => topicStatus(learner, "fractions", sampleWorkspace(), now, points(...scores));

describe("on track / behind schedule / stagnant", () => {
  it("uses a three-week unit with two weeks left", () => {
    const unit = currentUnit(now);
    expect((unit.end.getTime() - unit.start.getTime()) / week).toBe(3);
    expect(unit.start.getTime()).toBeLessThan(now.getTime() - week + 86_400_000);
  });

  it("is on track at or above the 70% target", () => {
    expect(status(60, 65, 72)).toMatchObject({ status: "on_track", score: 72 });
  });

  it("is on track below the target when the pace reaches it by the unit's end", () => {
    const s = status(50, 56, 62);
    expect(s.status).toBe("on_track");
    expect(s.projected).toBeGreaterThanOrEqual(70);
    expect(s.reason).toContain("on pace");
  });

  it("is behind schedule when rising, but too slowly", () => {
    const s = status(34, 38, 42);
    expect(s.status).toBe("behind");
    expect(s.perWeek).toBe(4);
    expect(s.reason).toMatch(/needs about \+\d+ a week/);
  });

  it("is stagnant when flat or falling", () => {
    expect(status(41, 41, 41)).toMatchObject({ status: "stagnant", perWeek: 0 });
    expect(status(71, 69, 67).status).toBe("stagnant");
  });

  it("says when there isn't enough data instead of guessing", () => {
    const s = topicStatus(learner, "fractions", sampleWorkspace(), now, []);
    expect(s.status).toBe("no_data");
    expect(s.reason).toContain("answers needed");
  });

  it("gives the sample class a realistic mix, with fractions as the shared gap", () => {
    const ws = sampleWorkspace();
    const counts = countByStatus(classStatuses(ws, now));
    expect(counts).toEqual({ on_track: 8, behind: 5, stagnant: 5, no_data: 0 });
    const maya = studentStatus(ws.students[0], ws, now);
    expect(maya).toMatchObject({ status: "behind", focus: { topic: "fractions", score: 42 } });
    const james = studentStatus(ws.students.find((s) => s.name === "James Walker")!, ws, now);
    expect(james.status).toBe("stagnant");
  });

  it("shows momentum from the unit start to today", () => {
    const [start, today] = momentumHistory(sampleWorkspace(), now);
    expect(start.label).toBe("Unit start");
    expect(today.counts.on_track).toBeGreaterThan(start.counts.on_track);
  });
});

describe("did a group lesson help?", () => {
  it("compares confidence before the lesson with now, for learners who practiced", () => {
    const ws = sampleWorkspace();
    const plan = { id: "plan-1", topic: "fractions" as const, studentIds: ["maya", "learner-2"], at: now.toISOString() };
    expect(planImpact(ws, plan).verdict).toBe("No practice yet");
    for (const [i, correct] of [true, true, true].entries())
      ws.attempts.push({ id: `a-${i}`, studentId: "maya", questionId: "fr1", topic: "fractions", correct, hints: 0, at: new Date(now.getTime() + 60_000 * (i + 1)).toISOString() });
    const impact = planImpact(ws, plan);
    expect(impact).toMatchObject({ practiced: 1, improved: 1, verdict: "Improved" });
    expect(impact.members[0].after! - impact.members[0].before!).toBeGreaterThanOrEqual(5);
  });
});
