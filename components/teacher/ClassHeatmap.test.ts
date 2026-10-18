import { describe, expect, it } from "vitest";

import { alertGroupStudentIds } from "@/components/teacher/ClassHeatmap";
import { mayaAlertFixture } from "@/components/teacher/mayaAlertFixture";
import { classroom, skillMap, skillStates } from "@/lib/data/seed";

describe("ClassHeatmap data", () => {
  it("uses all five shared skills", () => {
    expect(Object.keys(skillMap)).toHaveLength(5);
    expect(Object.keys(skillMap)).toContain("3.OA.C.7");
  });

  it("uses Maya's alert as the source of truth for the five-person group", () => {
    expect(alertGroupStudentIds(mayaAlertFixture)).toEqual([
      "maya",
      "s04",
      "s12",
      "s15",
      "s24",
    ]);
  });

  it("keeps every alert group member inside the shared classroom", () => {
    expect(
      alertGroupStudentIds(mayaAlertFixture).every((id) => classroom.student_ids.includes(id)),
    ).toBe(true);
  });

  it("shows the separate multiplication gap from the shared seed", () => {
    const multiplicationGap = skillStates
      .filter((state) => state.skill_id === "3.OA.C.7" && state.mastery < 0.5)
      .map((state) => state.student_id);

    expect(multiplicationGap).toEqual(["s14", "s18"]);
  });
});
