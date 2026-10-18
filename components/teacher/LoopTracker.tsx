"use client";

import type { Alert, AlertStatus } from "@/lib/types";

interface LoopTrackerProps {
  alert: Alert;
  averageDaysToFix: number;
  onFastForward?: () => void;
  isRunningRecheck?: boolean;
}

const loopSteps = ["Detected", "Acted", "Verified"] as const;

export function loopStageIndex(status: AlertStatus): number {
  if (status === "verified" || status === "escalated") return 2;
  if (status === "acted") return 1;
  return 0;
}

function recheckLabel(alert: Alert): string {
  if (!alert.recheck_at) return "Available after an action is recorded";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(alert.recheck_at));
}

export function LoopTracker({
  alert,
  averageDaysToFix,
  onFastForward,
  isRunningRecheck = false,
}: LoopTrackerProps) {
  const currentStage = loopStageIndex(alert.status);
  const canRunRecheck = alert.status === "acted" && Boolean(onFastForward);
  const isVerified = alert.status === "verified";
  const isEscalated = alert.status === "escalated";

  return (
    <section aria-labelledby="loop-tracker-heading" className="border-t border-rule px-5 py-5 sm:px-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h4 id="loop-tracker-heading" className="font-semibold text-ink">
            Intervention loop
          </h4>
          <p className="mt-1 text-xs text-ink-muted">
            {averageDaysToFix.toFixed(1)} average days to fix · Simulated
          </p>
        </div>
        <p className="text-xs text-ink-muted">Next check: {recheckLabel(alert)}</p>
      </div>

      <ol className="mt-5 grid grid-cols-3" aria-label="Alert progress">
        {loopSteps.map((label, index) => {
          const isComplete = index < currentStage || (isVerified && index === currentStage);
          const isCurrent = index === currentStage && !isVerified;

          return (
            <li
              key={label}
              aria-current={isCurrent ? "step" : undefined}
              className="relative flex flex-col items-center text-center"
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={`absolute right-1/2 top-3 h-px w-full motion-safe:transition-colors ${
                    index <= currentStage ? "bg-accent" : "bg-rule"
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold motion-safe:transition-colors ${
                  isComplete
                    ? "border-success bg-success text-white"
                    : isCurrent
                      ? "border-accent bg-accent text-white"
                      : "border-rule bg-paper text-ink-muted"
                }`}
              >
                {isComplete ? "✓" : index + 1}
              </span>
              <span
                className={`mt-2 text-xs font-semibold ${
                  isCurrent ? "text-accent-strong" : "text-ink-muted"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
        <div className="text-xs font-semibold">
          {isVerified ? <span className="text-success">Mastered · parent notified</span> : null}
          {isEscalated ? (
            <span className="text-danger">Not mastered · try a different strategy</span>
          ) : null}
          {!isVerified && !isEscalated ? (
            <span className="text-ink-muted">Verification is still pending</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-muted">Simulated</span>
          <button
            type="button"
            disabled={!canRunRecheck || isRunningRecheck}
            onClick={onFastForward}
            className="rounded-control border border-rule bg-paper px-3 py-2 text-xs font-semibold text-ink transition-colors enabled:hover:border-accent enabled:hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-45"
            title="Runs the deterministic recheck at the scheduled future date"
          >
            {isRunningRecheck ? "Running recheck…" : "Simulate 7 days later"}
          </button>
        </div>
      </div>
    </section>
  );
}
