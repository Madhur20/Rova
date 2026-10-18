"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ClassHeatmap } from "@/components/teacher/ClassHeatmap";
import { LoopTracker } from "@/components/teacher/LoopTracker";
import { TeacherAlertCard } from "@/components/teacher/TeacherAlertCard";
import {
  alertSummary,
  inboxOrder,
  isClosedAlert,
  keyboardShortcutForKey,
  moveSelection,
} from "@/components/teacher/teacherWorkspace";
import { recheck, teacherAction, useRovaState } from "@/lib/data/store";
import type { Alert, TeacherAction } from "@/lib/types";

function isTeacherReport(alert: Alert): boolean {
  return alert.signal === "safety_concern" || alert.signal === "student_question";
}

function alertTime(alert: Alert): string {
  if (!alert.created_at) return "Now";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(alert.created_at));
}

function InboxRow({
  alert,
  studentName,
  selected,
  onSelect,
}: {
  alert: Alert;
  studentName: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const safety = alert.signal === "safety_concern" && alert.status === "open";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative w-full border-b border-rule px-4 py-3 text-left transition-colors last:border-b-0 ${
        selected ? "bg-accent-soft" : "hover:bg-paper-deep/55"
      }`}
    >
      {selected ? <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 bg-accent" /> : null}
      <span className="flex items-start justify-between gap-3">
        <span className={`text-sm font-semibold ${safety ? "text-danger" : "text-ink"}`}>
          {studentName}
        </span>
        <span className="shrink-0 text-[11px] text-ink-muted">{alertTime(alert)}</span>
      </span>
      <span className="mt-1 block text-xs leading-5 text-ink-muted">{alertSummary(alert)}</span>
    </button>
  );
}

export function TeacherLiveView() {
  const state = useRovaState();
  const inbox = useMemo(
    () => inboxOrder(state.alerts.filter((alert) => alert.signal !== "class_gap")),
    [state.alerts],
  );
  const activeAlerts = useMemo(() => inbox.filter((alert) => !isClosedAlert(alert)), [inbox]);
  const closedAlerts = useMemo(() => inbox.filter(isClosedAlert), [inbox]);
  const needsAction = activeAlerts.filter((alert) => alert.status === "open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    inbox.find((alert) => alert.id === selectedId) ?? activeAlerts[0] ?? inbox[0] ?? null;
  const nameOf = (id: string) => state.students.find((student) => student.id === id)?.first_name ?? id;

  const runAction = useCallback(
    (alert: Alert, action: TeacherAction) => {
      teacherAction(alert.id, action);
      if (action === "done" && isTeacherReport(alert)) {
        setSelectedId(activeAlerts.find((item) => item.id !== alert.id)?.id ?? alert.id);
      }
    },
    [activeAlerts],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      const shortcut = keyboardShortcutForKey(event.key);
      if (!shortcut) return;
      event.preventDefault();

      const navigable = activeAlerts.length > 0 ? activeAlerts : inbox;
      if (shortcut === "next" || shortcut === "previous") {
        setSelectedId(moveSelection(navigable, selected?.id ?? null, shortcut === "next" ? 1 : -1));
        return;
      }

      if (!selected || selected.status !== "open") return;
      runAction(selected, shortcut === "done" ? "done" : "snooze");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeAlerts, inbox, runAction, selected]);

  const learningAlerts = state.alerts.filter(
    (alert) => alert.signal !== "class_gap" && !isTeacherReport(alert),
  );
  const heatmapAlert = selected && !isTeacherReport(selected) ? selected : (learningAlerts.at(-1) ?? null);

  return (
    <>
      <section aria-labelledby="action-inbox-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-accent-strong">
              {needsAction.length} {needsAction.length === 1 ? "alert needs" : "alerts need"} action
            </p>
            <h2 id="action-inbox-heading" className="font-display text-2xl font-semibold text-ink">
              Action inbox
            </h2>
          </div>
          <p className="text-xs text-ink-muted">About 5 minutes</p>
        </div>

        {inbox.length === 0 ? (
          <div className="rounded-panel border border-dashed border-rule bg-surface p-6 text-ink-muted">
            <p className="font-semibold text-ink">No alerts yet.</p>
            <p className="mt-1 text-sm">
              Alerts appear here when a student repeats a mistake or gets stuck. Try it in the{" "}
              <Link href="/student" className="font-semibold text-accent-strong hover:underline">
                Student view
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-panel border border-rule bg-surface lg:grid lg:grid-cols-[340px_minmax(0,1fr)]">
            <aside aria-label="Alert inbox" className="border-b border-rule lg:border-r lg:border-b-0">
              <div className="border-b border-rule px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-ink-muted">Open and in progress</p>
                  <p className="hidden text-[11px] text-ink-muted sm:block">
                    <kbd>J</kbd>/<kbd>K</kbd> move · <kbd>D</kbd> done · <kbd>S</kbd> snooze
                  </p>
                </div>
              </div>

              <div>
                {activeAlerts.map((alert) => (
                  <InboxRow
                    key={alert.id}
                    alert={alert}
                    studentName={nameOf(alert.student_id)}
                    selected={alert.id === selected?.id}
                    onSelect={() => setSelectedId(alert.id)}
                  />
                ))}
                {activeAlerts.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-ink-muted">Everything is handled for now.</p>
                ) : null}
              </div>

              {closedAlerts.length > 0 ? (
                <details className="border-t border-rule">
                  <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-ink-muted hover:text-ink">
                    Done today ({closedAlerts.length})
                  </summary>
                  <div className="border-t border-rule">
                    {closedAlerts.map((alert) => (
                      <InboxRow
                        key={alert.id}
                        alert={alert}
                        studentName={nameOf(alert.student_id)}
                        selected={alert.id === selected?.id}
                        onSelect={() => setSelectedId(alert.id)}
                      />
                    ))}
                  </div>
                </details>
              ) : null}
            </aside>

            <div className="min-w-0 bg-paper-deep/25 p-3 sm:p-5">
              {selected ? (
                <TeacherAlertCard
                  alert={selected}
                  studentName={nameOf(selected.student_id)}
                  skills={state.skillMap}
                  badge="Live"
                  onAction={(action) => runAction(selected, action)}
                  loopTracker={
                    !isTeacherReport(selected) ? (
                      <LoopTracker
                        alert={selected}
                        averageDaysToFix={6.2}
                        onFastForward={() =>
                          recheck(
                            selected.id,
                            selected.recheck_at ? new Date(selected.recheck_at) : undefined,
                          )
                        }
                      />
                    ) : undefined
                  }
                />
              ) : null}
            </div>
          </div>
        )}
      </section>

      <ClassHeatmap
        alert={heatmapAlert}
        classroom={state.classroom}
        students={state.students}
        skillMap={state.skillMap}
        skillStates={state.skillStates}
      />
    </>
  );
}
