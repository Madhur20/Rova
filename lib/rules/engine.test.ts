import { beforeEach, describe, expect, it } from "vitest";
import { resetLLM } from "@/lib/llm";
import {
  apply_teacher_action,
  get_learner_profile,
  log_event,
  run_recheck,
  seedState,
  type RovaState,
} from "@/lib/rules/engine";
import type { Event } from "@/lib/types";

const t0 = new Date("2026-10-17T19:00:00.000Z");
let tick = 0;
function at(): string {
  tick += 1;
  return new Date(t0.getTime() + tick * 1000).toISOString();
}
function attempt(correct: boolean, error_type?: string): Event {
  return {
    student_id: "maya",
    skill_id: "6.RP.A.3",
    type: "attempt",
    correct,
    ...(error_type ? { error_type } : {}),
    seconds: 20,
    ts: at(),
  };
}
function refresher(correct: boolean): Event {
  return { student_id: "maya", skill_id: "4.NF.A.1", type: "refresher", correct, seconds: 15, ts: at() };
}
function run(state: RovaState, events: Event[]): RovaState {
  return events.reduce((s, e) => log_event(s, e, new Date(e.ts)).state, state);
}

describe("the loop: detect → diagnose → alert → act → verify", () => {
  beforeEach(() => {
    resetLLM();
    tick = 0;
  });

  it("creates no alert for a single mistake", () => {
    const { newAlerts } = log_event(seedState(), attempt(false, "adds-across-ratio-table"), t0);
    expect(newAlerts).toEqual([]);
  });

  it("alerts on Maya's repeated mistake with the root cause and her 4 classmates (D-007)", () => {
    const first = log_event(seedState(), attempt(false, "adds-across-ratio-table"), t0).state;
    const { state, newAlerts } = log_event(first, attempt(false, "adds-across-ratio-table"), t0);
    expect(newAlerts).toHaveLength(1); // 5 of 25 is below the 30% class-gap rule
    expect(newAlerts[0]).toMatchObject({
      student_id: "maya",
      skill_id: "6.RP.A.3",
      signal: "repeated_misconception",
      root_cause: "4.NF.A.1",
      others_with_gap: ["s04", "s12", "s15", "s24"],
      status: "open",
    });
    expect(newAlerts[0].evidence).toBe(
      "Maya added across the ratio table instead of multiplying both values (2 times).",
    );
    expect(newAlerts[0].action).toContain("fraction strips");
    expect(state.alerts).toHaveLength(1);
  });

  it("does not raise a second alert while one is unresolved", () => {
    const events = [1, 2, 3, 4].map(() => attempt(false, "adds-across-ratio-table"));
    expect(run(seedState(), events).alerts).toHaveLength(1);
  });

  it("updates mastery and misconceptions from answers", () => {
    const state = run(seedState(), [attempt(false, "adds-across-ratio-table"), refresher(true)]);
    const profile = get_learner_profile(state, "maya");
    expect(profile.skills.find((s) => s.skill_id === "6.RP.A.3")?.misconceptions).toEqual([
      "adds-across-ratio-table",
    ]);
    expect(profile.skills.find((s) => s.skill_id === "4.NF.A.1")?.mastery).toBe(0.45);
  });

  it("Done → parent activity in Spanish → fixed after the refresher → verified and parent win", () => {
    let state = run(seedState(), [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]);
    const alertId = state.alerts[0].id;
    state = run(state, [refresher(true), refresher(true), refresher(true), attempt(true)]);

    state = apply_teacher_action(state, alertId, "done", t0);
    expect(state.alerts[0].status).toBe("acted");
    expect(state.alerts[0].recheck_at).toBe("2026-10-24T19:00:00.000Z");
    expect(state.parentMessages).toHaveLength(1);
    expect(state.parentMessages[0]).toMatchObject({ student_id: "maya", language: "es", kind: "activity" });
    expect(state.parentMessages[0].text).toContain("receta");

    state = run_recheck(state, alertId, new Date(state.alerts[0].recheck_at!));
    expect(state.alerts[0].status).toBe("verified");
    expect(state.parentMessages.at(-1)?.kind).toBe("win");
    expect(state.parentMessages.at(-1)?.text).toContain("Maya");
  });

  it("escalates when the re-check runs before the gap is fixed", () => {
    let state = run(seedState(), [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]);
    const alertId = state.alerts[0].id;
    state = apply_teacher_action(state, alertId, "done", t0);
    state = run_recheck(state, alertId);
    expect(state.alerts[0].status).toBe("escalated");
    expect(state.parentMessages.map((m) => m.kind)).toEqual(["activity"]);
  });

  it("snooze keeps the alert open; different strategy changes the reteach", () => {
    let state = run(seedState(), [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]);
    const alertId = state.alerts[0].id;
    state = apply_teacher_action(state, alertId, "snooze", t0);
    expect(state.alerts[0].status).toBe("open");
    expect(state.alerts[0].recheck_at).toBe("2026-10-18T19:00:00.000Z");
    state = apply_teacher_action(state, alertId, "different_strategy", t0);
    expect(state.alerts[0].status).toBe("acted");
    expect(state.alerts[0].action).toContain("double number line");
  });

  it("ignores re-checks on alerts that are not acted on", () => {
    const state = run(seedState(), [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]);
    expect(run_recheck(state, state.alerts[0].id)).toBe(state);
    expect(run_recheck(state, "missing")).toBe(state);
  });

  it.each(["done", "different_strategy"] as const)(
    "ignores repeated Done and Snooze after %s, preserving the parent message and seven-day re-check",
    (initialAction) => {
      const state = run(seedState(), [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]);
      const alertId = state.alerts[0].id;
      const acted = apply_teacher_action(state, alertId, initialAction, t0);
      const later = new Date("2026-10-18T19:00:00.000Z");

      expect(apply_teacher_action(acted, alertId, "done", later)).toBe(acted);
      expect(apply_teacher_action(acted, alertId, "snooze", later)).toBe(acted);
      expect(acted.parentMessages).toHaveLength(1);
      expect(acted.alerts[0].recheck_at).toBe("2026-10-24T19:00:00.000Z");
    },
  );

  it("starts every demo from the same seed", () => {
    const a = seedState();
    a.skillStates[0].misconceptions.push("x");
    expect(seedState().skillStates[0].misconceptions).toEqual([]);
  });
});

describe("reports from the student view", () => {
  beforeEach(() => resetLLM());
  const safety = {
    student_id: "maya",
    skill_id: "6.RP.A.3",
    kind: "safety_concern" as const,
    message: "I want to hurt myself",
  };

  it("creates a safety alert with what the student wrote and no root cause", async () => {
    const { report_to_teacher } = await import("@/lib/rules/engine");
    const { state, alert } = report_to_teacher(seedState(), safety, t0);
    expect(alert).toMatchObject({
      signal: "safety_concern",
      status: "open",
      root_cause: null,
      others_with_gap: [],
      recheck_at: null,
    });
    expect(alert?.evidence).toBe('Maya wrote something that may need a check-in: "I want to hurt myself"');
    expect(alert?.action).toContain("Check in with Maya");
    expect(state.alerts).toHaveLength(1);
  });

  it("ignores the same open report sent twice", async () => {
    const { report_to_teacher } = await import("@/lib/rules/engine");
    const first = report_to_teacher(seedState(), safety, t0).state;
    const second = report_to_teacher(first, safety, t0);
    expect(second.alert).toBeNull();
    expect(second.state.alerts).toHaveLength(1);
  });

  it("closes a question on Done, without a re-check or parent message", async () => {
    const { report_to_teacher } = await import("@/lib/rules/engine");
    const { state, alert } = report_to_teacher(
      seedState(),
      { ...safety, kind: "student_question", message: "Can you write a poem?" },
      t0,
    );
    expect(alert?.evidence).toBe('Maya asked: "Can you write a poem?"');
    const done = apply_teacher_action(state, alert!.id, "done", t0);
    expect(done.alerts[0]).toMatchObject({ status: "verified", recheck_at: null });
    expect(done.parentMessages).toEqual([]);
  });

  it("does not block learning alerts for the same skill", async () => {
    const { report_to_teacher } = await import("@/lib/rules/engine");
    let state = report_to_teacher(seedState(), safety, t0).state;
    state = run(state, [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]);
    expect(state.alerts.map((a) => a.signal)).toEqual(["safety_concern", "repeated_misconception"]);
  });
});

describe("after an alert is resolved", () => {
  beforeEach(() => {
    resetLLM();
    tick = 0;
  });

  function verifiedState(): RovaState {
    let state = run(seedState(), [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]);
    const id = state.alerts[0].id;
    state = run(state, [refresher(true), refresher(true), attempt(true)]);
    state = apply_teacher_action(state, id, "done", t0);
    return run_recheck(state, id, new Date(state.alerts[0].recheck_at!));
  }

  it("clears the student's misconceptions on that skill when verified", () => {
    const state = verifiedState();
    expect(state.alerts[0].status).toBe("verified");
    expect(get_learner_profile(state, "maya").skills.find((s) => s.skill_id === "6.RP.A.3")?.misconceptions).toEqual([]);
  });

  it("does not re-alert on one new mistake; old mistakes no longer count", () => {
    const state = run(verifiedState(), [attempt(false, "adds-across-ratio-table")]);
    expect(state.alerts).toHaveLength(1);
  });

  it("alerts again if the same mistake comes back twice", () => {
    const state = run(verifiedState(), [
      attempt(false, "adds-across-ratio-table"),
      attempt(false, "adds-across-ratio-table"),
    ]);
    expect(state.alerts).toHaveLength(2);
    expect(state.alerts[1]).toMatchObject({ status: "open", signal: "repeated_misconception" });
  });

  it("gives every seed the same session id; Reset demo changes it in the store", () => {
    expect(seedState().session).toBe("seed");
  });
});

describe("resolution point (review P1)", () => {
  beforeEach(() => {
    resetLLM();
    tick = 0;
  });

  it("ignores a mistake made while the alert was open when counting after verification", () => {
    let state = run(seedState(), [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]);
    const id = state.alerts[0].id;
    // A third mistake while the alert is open (no new alert: one is unresolved).
    state = run(state, [attempt(false, "adds-across-ratio-table"), refresher(true), refresher(true), attempt(true)]);
    state = apply_teacher_action(state, id, "done", t0);
    state = run_recheck(state, id, new Date(state.alerts[0].recheck_at!));
    expect(state.alerts[0]).toMatchObject({ status: "verified", resolved_after_event: 6 });

    state = run(state, [attempt(false, "adds-across-ratio-table")]);
    expect(state.alerts).toHaveLength(1); // one in-cycle + one new mistake must not re-alert
    state = run(state, [attempt(false, "adds-across-ratio-table")]);
    expect(state.alerts).toHaveLength(2); // two new mistakes do
  });

  it("uses the event count, not the simulated re-check date, so later real mistakes still count", () => {
    let state = run(seedState(), [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]);
    const id = state.alerts[0].id;
    state = apply_teacher_action(state, id, "done", t0);
    state = run_recheck(state, id, new Date("2030-01-01T00:00:00.000Z")); // escalates, far-future clock
    expect(state.alerts[0].status).toBe("escalated");
    state = run(state, [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]);
    expect(state.alerts).toHaveLength(2);
  });
});

describe("migrating state saved by an older version (review P2, follow-up)", () => {
  beforeEach(() => {
    resetLLM();
    tick = 0;
  });

  it("does not let old mistakes behind a resolved alert trigger a new alert", async () => {
    const { migrate_state } = await import("@/lib/rules/engine");
    // Build an old-style state: a verified alert with no resolved_after_event and no session.
    let state = run(seedState(), [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]);
    const id = state.alerts[0].id;
    state = run(state, [refresher(true), refresher(true), attempt(true)]);
    state = apply_teacher_action(state, id, "done", t0);
    state = run_recheck(state, id, new Date(state.alerts[0].recheck_at!));
    const legacy = JSON.parse(JSON.stringify(state));
    delete legacy.session;
    delete legacy.alerts[0].resolved_after_event;
    // Without migration, the two old mistakes plus one new one would re-alert.
    expect(run(legacy, [attempt(false, "adds-across-ratio-table")]).alerts).toHaveLength(2);

    const migrated = migrate_state(legacy);
    expect(migrated.session).toBe("seed");
    expect(migrated.alerts[0].resolved_after_event).toBe(legacy.events.length);
    expect(run(migrated, [attempt(false, "adds-across-ratio-table")]).alerts).toHaveLength(1);
    expect(
      run(migrated, [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]).alerts,
    ).toHaveLength(2);
  });

  it("leaves open alerts and already-migrated alerts unchanged", async () => {
    const { migrate_state } = await import("@/lib/rules/engine");
    const state = run(seedState(), [attempt(false, "adds-across-ratio-table"), attempt(false, "adds-across-ratio-table")]);
    const migrated = migrate_state(state);
    expect(migrated.alerts[0]).toEqual(state.alerts[0]);
    expect(migrated.session).toBe("seed");
  });
});
