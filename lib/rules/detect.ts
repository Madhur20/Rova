// Detection rules (README section 17). Pure functions over the event log, so they are
// consistent and explainable. Drop and disengagement are not built (first in the cut order,
// docs/TEAM_WORKFLOW.md).

import type { AlertSignal, Event, SkillId } from "@/lib/types";

export interface Detection {
  signal: AlertSignal;
  evidence: string; // plain facts the teacher card shows
  error_type?: string;
}

export const CLASS_GAP_SHARE = 0.3;

// Plain-language names for check_answer's error types, for the teacher card.
const errorDescriptions: Record<string, string> = {
  "adds-across-ratio-table": "added across the ratio table instead of multiplying both values",
  "reverses-ratio": "reversed the order of the ratio",
  "scales-only-one-ratio-term": "scaled only one value of the ratio",
  "calculation-slip": "made a calculation slip",
};

export function describe_error(errorType: string): string {
  return errorDescriptions[errorType] ?? errorType.replace(/-/g, " ");
}

function attemptsFor(events: Event[], studentId: string, skillId: SkillId): Event[] {
  return events.filter(
    (e) => e.student_id === studentId && e.skill_id === skillId && e.type === "attempt",
  );
}

// Same skill wrong ≥3 of the last 4 attempts.
export function detect_stuck(events: Event[], studentId: string, skillId: SkillId): Detection | null {
  const lastFour = attemptsFor(events, studentId, skillId).slice(-4);
  const wrong = lastFour.filter((e) => e.correct === false).length;
  if (wrong < 3) return null;
  return { signal: "stuck", evidence: `was wrong on ${wrong} of the last ${lastFour.length} attempts.` };
}

// Jumps to the last hint within 20 seconds on ≥3 problems. Events carry no problem id,
// so each level-3 hint reached within 20 seconds counts as one problem.
export function detect_answer_seeking(
  events: Event[],
  studentId: string,
  skillId: SkillId,
): Detection | null {
  const fastLastHints = events.filter(
    (e) =>
      e.student_id === studentId &&
      e.skill_id === skillId &&
      e.type === "hint" &&
      e.hint_level === 3 &&
      e.seconds <= 20,
  ).length;
  if (fastLastHints < 3) return null;
  return {
    signal: "answer_seeking",
    evidence: `jumped to the last hint within 20 seconds on ${fastLastHints} problems.`,
  };
}

// Same error type ≥2 times on the skill.
export function detect_repeated_misconception(
  events: Event[],
  studentId: string,
  skillId: SkillId,
): Detection | null {
  const counts = new Map<string, number>();
  for (const e of attemptsFor(events, studentId, skillId)) {
    if (e.correct === false && e.error_type) {
      counts.set(e.error_type, (counts.get(e.error_type) ?? 0) + 1);
    }
  }
  for (const [error_type, count] of counts) {
    if (count >= 2) {
      return {
        signal: "repeated_misconception",
        evidence: `${describe_error(error_type)} (${count} times).`,
        error_type,
      };
    }
  }
  return null;
}

// Strongest signal first: a named misconception is the most actionable.
export function detect(events: Event[], studentId: string, skillId: SkillId): Detection | null {
  return (
    detect_repeated_misconception(events, studentId, skillId) ??
    detect_stuck(events, studentId, skillId) ??
    detect_answer_seeking(events, studentId, skillId)
  );
}

// ≥30% of a class shares the same root cause → group alert (D-007: the demo's 5 of 25 stays below).
export function is_class_gap(studentsWithGap: number, classSize: number): boolean {
  return classSize > 0 && studentsWithGap / classSize >= CLASS_GAP_SHARE;
}
