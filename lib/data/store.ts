"use client";

// Browser store (D-005): starts from the JSON seed, keeps the demo's live state in
// localStorage, and syncs open tabs, so the Student, Teacher, and Parent views share one state
// on the same laptop. All state changes go through the pure functions in lib/rules/engine.ts.

import { useSyncExternalStore } from "react";
import { resetLLM } from "@/lib/llm";
import {
  apply_teacher_action,
  log_event,
  migrate_state,
  report_to_teacher,
  run_recheck,
  seedState,
  type RovaState,
} from "@/lib/rules/engine";
import type { Alert, Event, TeacherAction, TeacherReport } from "@/lib/types";

const STORAGE_KEY = "rova-demo-v1";
const serverSnapshot = seedState();
const listeners = new Set<() => void>();
const resetListeners = new Set<() => void>();
let current: RovaState | null = null;

function read(): RovaState {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as RovaState;
      // Older saved state: fill in session and resolved-alert cut-offs (see migrate_state).
      if (parsed?.version === 1) return migrate_state(parsed);
    }
  } catch {
    // Private window or blocked storage: run from the seed without saving.
  }
  return seedState();
}

function notify() {
  for (const listener of listeners) listener();
}

function commit(next: RovaState) {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: the state still works for this tab.
  }
  notify();
}

function notifyReset() {
  for (const listener of resetListeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  const before = current?.session;
  current = read();
  notify();
  // Reset demo pressed in another tab.
  if (before !== undefined && current.session !== before) notifyReset();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0 && resetListeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && resetListeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getState(): RovaState {
  current ??= read();
  return current;
}

export function useRovaState(): RovaState {
  return useSyncExternalStore(subscribe, getState, () => serverSnapshot);
}

// log_event for each event in order; returns the alerts they created.
export function logEvents(events: Event[]): Alert[] {
  let state = getState();
  const created: Alert[] = [];
  for (const event of events) {
    const result = log_event(state, event);
    state = result.state;
    created.push(...result.newAlerts);
  }
  commit(state);
  return created;
}

// For the student view: the safety screen and "Send to my teacher". Returns the new alert,
// or null if the same report is already open.
export function reportToTeacher(report: TeacherReport): Alert | null {
  const result = report_to_teacher(getState(), report);
  if (result.alert) commit(result.state);
  return result.alert;
}

export function teacherAction(alertId: string, action: TeacherAction) {
  commit(apply_teacher_action(getState(), alertId, action));
}

// The loop tracker's "fast-forward 7 days" passes the alert's scheduled recheck time.
export function recheck(alertId: string, nowOverride?: Date) {
  commit(run_recheck(getState(), alertId, nowOverride));
}

export function resetDemo() {
  resetLLM();
  commit({ ...seedState(), session: String(Date.now()) });
  notifyReset();
}

// Runs the listener whenever Reset demo is pressed, in this tab or another one, so a view can
// clear its own local state (chat, current screen). Returns an unsubscribe function, so it
// fits straight into useEffect: useEffect(() => onDemoReset(clearChat), []).
export function onDemoReset(listener: () => void): () => void {
  if (listeners.size === 0 && resetListeners.size === 0) window.addEventListener("storage", onStorage);
  resetListeners.add(listener);
  return () => {
    resetListeners.delete(listener);
    if (listeners.size === 0 && resetListeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}
