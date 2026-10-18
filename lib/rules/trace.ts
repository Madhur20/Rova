// Root-cause tracing over the skill map (README section 6, step 3). Code only, no AI.

import type { SkillId, SkillMap, SkillState } from "@/lib/types";

// A prerequisite below this mastery counts as a gap.
export const GAP_THRESHOLD = 0.5;

// All prerequisites of a skill, nearest first (breadth-first), each listed once.
export function trace_prerequisites(skillId: SkillId, skillMap: SkillMap): SkillId[] {
  const order: SkillId[] = [];
  const seen = new Set<SkillId>([skillId]);
  const queue: SkillId[] = [...(skillMap[skillId]?.needs ?? [])];
  while (queue.length > 0) {
    const next = queue.shift()!;
    if (seen.has(next)) continue;
    seen.add(next);
    order.push(next);
    queue.push(...(skillMap[next]?.needs ?? []));
  }
  return order;
}

// Where the gap started: the earliest-grade prerequisite the student hasn't mastered
// (nearest first among equal grades), or null if none is weak.
export function find_root_cause(
  studentId: string,
  skillId: SkillId,
  skillMap: SkillMap,
  skillStates: SkillState[],
): SkillId | null {
  const weak = trace_prerequisites(skillId, skillMap).filter((prerequisite) =>
    skillStates.some(
      (s) =>
        s.student_id === studentId && s.skill_id === prerequisite && s.mastery < GAP_THRESHOLD,
    ),
  );
  let root: SkillId | null = null;
  for (const prerequisite of weak) {
    if (root === null || skillMap[prerequisite].grade < skillMap[root].grade) root = prerequisite;
  }
  return root;
}

// Other students in the class with the same gap (D-007: shown on the alert as others_with_gap).
export function students_with_gap(
  skillId: SkillId,
  studentIds: string[],
  skillStates: SkillState[],
): string[] {
  return studentIds.filter((id) =>
    skillStates.some(
      (s) => s.student_id === id && s.skill_id === skillId && s.mastery < GAP_THRESHOLD,
    ),
  );
}
