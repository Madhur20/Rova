import type { Alert } from "@/lib/types";

export type WorkspaceShortcut = "next" | "previous" | "done" | "snooze";

export function isClosedAlert(alert: Alert): boolean {
  return alert.status === "verified" || alert.status === "escalated";
}

// Safety concerns stay pinned first. Within each group, the newest alert is first.
export function inboxOrder(alerts: Alert[]): Alert[] {
  const rank = (alert: Alert) => {
    if (alert.signal === "safety_concern" && alert.status === "open") return 0;
    if (!isClosedAlert(alert)) return 1;
    return 2;
  };

  return alerts
    .map((alert, index) => ({ alert, index }))
    .sort((a, b) => rank(a.alert) - rank(b.alert) || b.index - a.index)
    .map(({ alert }) => alert);
}

export function keyboardShortcutForKey(key: string): WorkspaceShortcut | null {
  switch (key.toLowerCase()) {
    case "j":
      return "next";
    case "k":
      return "previous";
    case "d":
      return "done";
    case "s":
      return "snooze";
    default:
      return null;
  }
}

export function moveSelection(alerts: Alert[], selectedId: string | null, delta: -1 | 1): string | null {
  if (alerts.length === 0) return null;
  const currentIndex = alerts.findIndex((alert) => alert.id === selectedId);
  if (currentIndex === -1) return alerts[0].id;
  const nextIndex = Math.min(alerts.length - 1, Math.max(0, currentIndex + delta));
  return alerts[nextIndex].id;
}

export function alertSummary(alert: Alert): string {
  const summaries: Record<Alert["signal"], string> = {
    safety_concern: "Safety check-in requested",
    student_question: "Question sent to teacher",
    repeated_misconception: "Repeated misconception spotted",
    stuck: "Stuck after several attempts",
    answer_seeking: "Reached the final hint quickly",
    drop: "Recent accuracy has dropped",
    disengagement: "Recent practice time has dropped",
    class_gap: "Shared class gap detected",
  };

  return summaries[alert.signal];
}
