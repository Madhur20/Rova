import { describe, expect, it } from "vitest";
import { coachingTurn, startCoaching } from "./coaching";
import { sampleWorkspace } from "./model";
import { interventionLogCsv, progressReport } from "./report";

const at = "2026-10-18T15:00:00.000Z";
describe("principal and MTSS progress report", () => {
  it("counts only live evidence and starts empty on the sample class", () => {
    const report = progressReport(sampleWorkspace());
    expect(report.metrics).toMatchObject({ coachedLessons: 0, questionsChecked: 0, rootCausesFound: 0, liveAttempts: 0 });
    expect(report.rows).toEqual([]);
    expect(report.tiers.priority).toContain("James Walker");
  });
  it("logs a traced ratios lesson as one intervention row with its refresher", () => {
    const workspace = sampleWorkspace();
    const ratios = startCoaching(workspace, "maya", "ratios", "ratios-1", at);
    coachingTurn(workspace, "maya", ratios.id, "miss-0001", "7", at);
    coachingTurn(workspace, "maya", ratios.id, "miss-0002", "8", at);
    startCoaching(workspace, "maya", "fractions", "refresher-1", at, undefined, ratios.id);
    const report = progressReport(workspace);
    expect(report.metrics).toMatchObject({ coachedLessons: 2, refreshers: 1, rootCausesFound: 1, automaticFamilyUpdates: 1, stillPracticing: 1 });
    expect(report.rows).toHaveLength(1);
    expect(report.rows[0]).toMatchObject({ learner: "Maya Chen", date: "2026-10-18" });
    expect(report.rows[0].focus).toBe("Ratios → root cause Equivalent fractions");
    expect(report.rows[0].tried).toContain("fractions refresher");
    expect(report.sharedGaps[0].classmates).toBeGreaterThan(0);
  });
  it("escapes CSV cells", () => {
    const csv = interventionLogCsv([{ learner: "Lee, Ana", focus: "Ratios", tried: "Said \"hi\"", date: "2026-10-18", result: "1/3", next: "Resume" }]);
    expect(csv.split("\n")[1]).toBe('"Lee, Ana",Ratios,"Said ""hi""",2026-10-18,1/3,Resume');
  });
});
