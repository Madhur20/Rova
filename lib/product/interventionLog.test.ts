import { describe, expect, it } from "vitest";
import { filterLog, paginate } from "./interventionLog";
import type { InterventionRow } from "./report";

const row = (i: number, extra: Partial<InterventionRow> = {}): InterventionRow => ({
  learner: `Learner ${i}`, focus: "Fractions (4.NF.A.1)", tried: "Coached practice", date: `2026-10-${String(10 + i).padStart(2, "0")}`,
  result: "1/3", next: "Resume", studentIds: [`s${i}`], topic: "fractions", type: "Coached practice", outcome: "In progress", ...extra,
});
const all = { search: "", topic: "all", type: "all", outcome: "all" } as const;

describe("intervention log", () => {
  it("shows 5 rows per page and reports the range", () => {
    const rows = Array.from({ length: 12 }, (_, i) => row(i));
    expect(paginate(rows, 1)).toMatchObject({ page: 1, pages: 3, from: 1, to: 5, total: 12 });
    expect(paginate(rows, 3).items).toHaveLength(2);
    expect(paginate(rows, 9).page).toBe(3);
    expect(paginate([], 1)).toMatchObject({ pages: 1, from: 0, to: 0 });
  });

  it("filters by search, topic, type, outcome, date, and learners", () => {
    const rows = [
      row(1),
      row(2, { topic: "division", focus: "Division", outcome: "Solved" }),
      row(3, { type: "Assigned lesson", refresher: true }),
    ];
    expect(filterLog(rows, { ...all, search: "learner 2" })).toHaveLength(1);
    expect(filterLog(rows, { ...all, topic: "division" })[0].learner).toBe("Learner 2");
    expect(filterLog(rows, { ...all, type: "Assigned lesson" })).toHaveLength(1);
    expect(filterLog(rows, { ...all, type: "Refresher" })[0].learner).toBe("Learner 3");
    expect(filterLog(rows, { ...all, outcome: "Solved" })).toHaveLength(1);
    expect(filterLog(rows, { ...all, since: "2026-10-12" })).toHaveLength(2);
    expect(filterLog(rows, { ...all, studentIds: ["s1", "s3"] })).toHaveLength(2);
  });
});
