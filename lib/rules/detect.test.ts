import { describe, expect, it } from "vitest";
import {
  detect,
  detect_answer_seeking,
  detect_repeated_misconception,
  detect_stuck,
  is_class_gap,
} from "@/lib/rules/detect";
import type { Event } from "@/lib/types";

const skill = "6.RP.A.3";
let clock = 0;
function attempt(correct: boolean, error_type?: string): Event {
  clock += 1;
  return {
    student_id: "maya",
    skill_id: skill,
    type: "attempt",
    correct,
    ...(error_type ? { error_type } : {}),
    seconds: 30,
    ts: new Date(Date.UTC(2026, 9, 17, 19, 0, clock)).toISOString(),
  };
}
function hint(level: 1 | 2 | 3, seconds: number): Event {
  clock += 1;
  return { student_id: "maya", skill_id: skill, type: "hint", hint_level: level, seconds, ts: `t${clock}` };
}

describe("detection rules", () => {
  it("stuck: wrong on 3 of the last 4 attempts", () => {
    expect(detect_stuck([attempt(false), attempt(true), attempt(false)], "maya", skill)).toBeNull();
    expect(
      detect_stuck([attempt(false), attempt(true), attempt(false), attempt(false)], "maya", skill)?.signal,
    ).toBe("stuck");
  });

  it("stuck: only the last 4 attempts count", () => {
    const old = [attempt(false), attempt(false), attempt(false)];
    expect(detect_stuck([...old, attempt(true), attempt(true), attempt(false), attempt(true)], "maya", skill)).toBeNull();
  });

  it("repeated misconception: the same error type twice", () => {
    const once = [attempt(false, "adds-across-ratio-table"), attempt(false, "reverses-ratio")];
    expect(detect_repeated_misconception(once, "maya", skill)).toBeNull();
    const twice = [...once, attempt(false, "adds-across-ratio-table")];
    expect(detect_repeated_misconception(twice, "maya", skill)).toMatchObject({
      signal: "repeated_misconception",
      error_type: "adds-across-ratio-table",
    });
  });

  it("answer-seeking: last hint within 20 seconds on 3 problems", () => {
    expect(detect_answer_seeking([hint(3, 10), hint(3, 15), hint(3, 40)], "maya", skill)).toBeNull();
    expect(detect_answer_seeking([hint(3, 10), hint(3, 15), hint(3, 20)], "maya", skill)?.signal).toBe(
      "answer_seeking",
    );
  });

  it("ignores other students and other skills", () => {
    const other = { ...attempt(false, "adds-across-ratio-table"), student_id: "s04" };
    expect(detect([other, attempt(false, "adds-across-ratio-table")], "maya", skill)).toBeNull();
  });

  it("prefers a named misconception over stuck", () => {
    const events = [1, 2, 3].map(() => attempt(false, "adds-across-ratio-table"));
    expect(detect(events, "maya", skill)?.signal).toBe("repeated_misconception");
  });

  it("class gap: 30% or more of the class", () => {
    expect(is_class_gap(5, 25)).toBe(false); // the demo's group of 5 (D-007)
    expect(is_class_gap(8, 25)).toBe(true);
    expect(is_class_gap(0, 0)).toBe(false);
  });
});
