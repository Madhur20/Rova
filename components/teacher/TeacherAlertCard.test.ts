import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TeacherAlertCard } from "@/components/teacher/TeacherAlertCard";
import { mayaAlertFixture } from "@/components/teacher/mayaAlertFixture";
import type { AlertStatus } from "@/lib/types";

function buttonsFor(status: AlertStatus, connected = true): string[] {
  return renderToStaticMarkup(createElement(TeacherAlertCard, {
    alert: { ...mayaAlertFixture, status },
    studentName: "Maya",
    skills: {},
    onAction: connected ? () => {} : undefined,
  })).match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];
}

describe("teacher alert actions", () => {
  it("disables Done and Snooze while waiting for re-check, keeping Different strategy available", () => {
    const [done, snooze, strategy] = buttonsFor("acted");
    expect(done).toContain('disabled=""');
    expect(done).toContain('title="Waiting for re-check"');
    expect(snooze).toContain('disabled=""');
    expect(snooze).toContain('title="Waiting for re-check"');
    expect(strategy).not.toContain('disabled=""');
  });

  it("enables actions for a new alert", () => {
    const buttons = buttonsFor("open");
    expect(buttons).toHaveLength(3);
    for (const button of buttons) expect(button).not.toContain('disabled=""');
  });

  it.each(["verified", "escalated"] as const)("keeps all actions disabled for %s alerts", (status) => {
    for (const button of buttonsFor(status)) expect(button).toContain('disabled=""');
  });

  it("keeps actions disabled without an action callback", () => {
    for (const button of buttonsFor("open", false)) expect(button).toContain('disabled=""');
  });
});
