import { describe, expect, it } from "vitest";
import { classroom, skillMap, skillStates } from "@/lib/data/seed";
import { find_root_cause, students_with_gap, trace_prerequisites } from "@/lib/rules/trace";

describe("trace_prerequisites", () => {
  it("walks the skill map back, nearest first, each skill once", () => {
    expect(trace_prerequisites("6.RP.A.3", skillMap)).toEqual([
      "6.RP.A.1",
      "4.NF.A.1",
      "3.OA.C.7",
      "3.NF.A.3",
    ]);
  });

  it("returns nothing for a skill with no prerequisites or not in the map", () => {
    expect(trace_prerequisites("3.OA.C.7", skillMap)).toEqual([]);
    expect(trace_prerequisites("8.EE.C.7", skillMap)).toEqual([]);
  });
});

describe("find_root_cause", () => {
  it("finds Maya's equivalent-fractions gap behind ratio tables", () => {
    expect(find_root_cause("maya", "6.RP.A.3", skillMap, skillStates)).toBe("4.NF.A.1");
  });

  it("finds the multiplication gap for s14", () => {
    expect(find_root_cause("s14", "6.RP.A.3", skillMap, skillStates)).toBe("3.OA.C.7");
  });

  it("returns null when no prerequisite is weak", () => {
    expect(find_root_cause("s02", "6.RP.A.3", skillMap, skillStates)).toBeNull();
  });
});

describe("students_with_gap", () => {
  it("lists Maya's 4 classmates with the same gap (D-007)", () => {
    const classmates = classroom.student_ids.filter((id) => id !== "maya");
    expect(students_with_gap("4.NF.A.1", classmates, skillStates)).toEqual(["s04", "s12", "s15", "s24"]);
  });
});
