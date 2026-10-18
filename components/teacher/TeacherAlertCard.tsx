import type { ReactNode } from "react";

import type { Alert, AlertStatus, SkillMap, TeacherAction } from "@/lib/types";

interface TeacherAlertCardProps {
  alert: Alert;
  studentName: string;
  skills: SkillMap;
  onAction?: (action: TeacherAction) => void;
  badge?: string;
  loopTracker?: ReactNode;
}

const statusLabels: Record<AlertStatus, string> = {
  open: "Needs action",
  acted: "Waiting for re-check",
  verified: "Fixed",
  escalated: "Escalated",
};

export function TeacherAlertCard({
  alert,
  studentName,
  skills,
  onAction,
  badge = "Simulated fixture",
  loopTracker,
}: TeacherAlertCardProps) {
  const isReport = alert.signal === "safety_concern" || alert.signal === "student_question";
  const statusLabel = isReport && alert.status === "verified" ? "Closed" : statusLabels[alert.status];
  const reportLabel =
    alert.signal === "safety_concern"
      ? "Safety concern"
      : alert.signal === "student_question"
        ? "Question for you"
        : null;
  const canAct = Boolean(onAction) && (alert.status === "open" || alert.status === "acted");
  const canHandle = Boolean(onAction) && alert.status === "open";
  const handleTitle = alert.status === "acted" ? "Waiting for re-check" : undefined;
  const actionTitle = canAct
    ? undefined
    : onAction
      ? "This alert is closed"
      : "Connects to apply_teacher_action";
  const sharedGapCount = alert.others_with_gap.length + 1;
  const skillName = skills[alert.skill_id]?.name ?? alert.skill_id;
  const rootCauseName = alert.root_cause
    ? (skills[alert.root_cause]?.name ?? alert.root_cause)
    : "Still checking";

  return (
    <article
      className={`overflow-hidden rounded-panel border bg-surface shadow-lifted ${
        alert.signal === "safety_concern" ? "border-danger/35" : "border-rule"
      }`}
    >
      <header className="border-b border-rule px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="font-display text-3xl font-semibold tracking-[-0.025em] text-ink">
                {studentName}
              </h3>
              {reportLabel ? (
                <span
                  className={`text-xs font-semibold ${
                    alert.signal === "safety_concern" ? "text-danger" : "text-accent-strong"
                  }`}
                >
                  {reportLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm font-medium text-ink-muted">
              {skillName} · {alert.skill_id}
            </p>
          </div>
          <div className="text-right text-xs">
            <p
              className={`font-semibold ${
                alert.status === "verified"
                  ? "text-success"
                  : alert.status === "escalated" || alert.signal === "safety_concern"
                    ? "text-danger"
                    : "text-accent-strong"
              }`}
            >
              {statusLabel}
            </p>
            <p className="mt-1 text-ink-muted">{badge}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.65fr)]">
        <div>
          <p className="text-xs font-semibold text-ink-muted">
            {isReport ? "What the student wrote" : "What Rova noticed"}
          </p>
          <p className="mt-2 leading-7 text-ink">{alert.evidence}</p>
        </div>

        {!isReport ? (
          <div className="border-l-2 border-accent pl-4">
            <p className="text-xs font-semibold text-ink-muted">Root cause</p>
            <p className="mt-2 font-display text-xl font-semibold text-ink">{rootCauseName}</p>
            <p className="mt-1 text-xs text-ink-muted">{alert.root_cause}</p>
          </div>
        ) : null}
      </div>

      <div className="mx-5 mb-6 border-l-2 border-accent bg-accent-soft/55 px-4 py-4 sm:mx-7">
        <p className="text-xs font-semibold text-accent-strong">
          {isReport ? "Suggested next step" : "Suggested 5-minute reteach"}
        </p>
        <p className="mt-2 text-sm leading-6 text-ink">{alert.action}</p>
        {alert.others_with_gap.length > 0 ? (
          <p className="mt-3 text-sm font-semibold text-accent-strong">
            {sharedGapCount} students share this root cause · try a small group
          </p>
        ) : null}
      </div>

      {loopTracker}

      <div className="flex flex-wrap gap-2 border-t border-rule px-5 py-4 sm:px-7">
        <button
          type="button"
          disabled={!canHandle}
          onClick={() => onAction?.("done")}
          title={handleTitle ?? actionTitle}
          className="rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors enabled:hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-45"
        >
          Done <span aria-hidden="true" className="ml-1 text-white/65">D</span>
        </button>
        <button
          type="button"
          disabled={!canHandle}
          onClick={() => onAction?.("snooze")}
          title={handleTitle ?? actionTitle}
          className="rounded-control border border-rule bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors enabled:hover:border-accent disabled:cursor-not-allowed disabled:opacity-45"
        >
          Snooze <span aria-hidden="true" className="ml-1 text-ink-muted">S</span>
        </button>
        {!isReport ? (
          <button
            type="button"
            disabled={!canAct}
            onClick={() => onAction?.("different_strategy")}
            title={actionTitle}
            className="rounded-control border border-rule bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors enabled:hover:border-accent disabled:cursor-not-allowed disabled:opacity-45"
          >
            Different strategy
          </button>
        ) : null}
      </div>
    </article>
  );
}
