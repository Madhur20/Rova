import { describe, expect, it } from "vitest";
import { classroom, mayaProfile, skillMap, skillStates, students } from "@/lib/data/seed";

const skillIds = Object.keys(skillMap);

describe("seed data", () => {
  it("has the README skill map with valid prerequisites", () => {
    expect(skillIds).toEqual(["6.RP.A.3", "6.RP.A.1", "4.NF.A.1", "3.NF.A.3", "3.OA.C.7"]);
    for (const skill of Object.values(skillMap)) {
      for (const need of skill.needs) expect(skillIds).toContain(need);
    }
  });

  it("has a class of 25 with unique ids, all in Ms. Rivera's classroom", () => {
    expect(students).toHaveLength(25);
    expect(new Set(students.map((s) => s.id)).size).toBe(25);
    expect(classroom.teacher).toBe("Ms. Rivera");
    expect(classroom.student_ids).toEqual(students.map((s) => s.id));
  });

  it("gives every student exactly one state per skill, mastery within 0–1", () => {
    for (const student of students) {
      const mine = skillStates.filter((s) => s.student_id === student.id);
      expect(mine.map((s) => s.skill_id).sort()).toEqual([...skillIds].sort());
    }
    for (const state of skillStates) {
      expect(state.mastery).toBeGreaterThanOrEqual(0);
      expect(state.mastery).toBeLessThanOrEqual(1);
    }
  });

  it("has exactly 5 students, including Maya, with the 4.NF.A.1 gap", () => {
    const gap = skillStates
      .filter((s) => s.skill_id === "4.NF.A.1" && s.mastery < 0.5)
      .map((s) => s.student_id);
    expect(gap).toHaveLength(5);
    expect(gap).toContain("maya");
  });

  it("matches Maya's persona: grade 6, Spanish at home, buddy Rova", () => {
    expect(mayaProfile.student).toMatchObject({ first_name: "Maya", grade: 6, language_home: "es", buddy_name: "Rova" });
    expect(mayaProfile.skills).toHaveLength(5);
  });
});
