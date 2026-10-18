// Seeded demo state (D-005): JSON files in lib/data/seed/, typed here. Import seed data from this module.
// The 25-student class and Maya's earlier-grade history are Simulated (README section 8).
// Persona facts come from README section 1 (Maya, 11, 6th grade; mom's first language is Spanish).
// Mastery values are invented demo data. Exactly 5 students (Maya + 4) share the 4.NF.A.1 gap
// ("group of 5 share this root cause", README section 17); s14 and s18 have a separate 3.OA.C.7 gap.
// Classmates are labeled "Student 2"…"Student 25" (no person names); only Maya, the README persona, is named.
// TODO(team): interests are not in the README yet; agree on them and update students.json.

import type { Classroom, LearnerProfile, SkillMap, SkillState, Student } from "@/lib/types";
import classroomJson from "./seed/classroom.json";
import skillMapJson from "./seed/skillMap.json";
import skillStatesJson from "./seed/skillStates.json";
import studentsJson from "./seed/students.json";

export const skillMap: SkillMap = skillMapJson;
export const students: Student[] = studentsJson;
export const skillStates: SkillState[] = skillStatesJson;
export const classroom: Classroom = classroomJson;

export function profileFor(studentId: string): LearnerProfile {
  const student = students.find((s) => s.id === studentId);
  if (!student) throw new Error(`Unknown student: ${studentId}`);
  return {
    student,
    skills: skillStates.filter((s) => s.student_id === studentId),
    preferences: [],
  };
}

export const maya: Student = profileFor("maya").student;
export const mayaProfile: LearnerProfile = profileFor("maya");
