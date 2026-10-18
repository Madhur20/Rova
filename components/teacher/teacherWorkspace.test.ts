import { describe, expect, it } from "vitest";

import {
  inboxOrder,
  keyboardShortcutForKey,
  moveSelection,
} from "@/components/teacher/teacherWorkspace";
import type { Alert } from "@/lib/types";

function alert(id: string, changes: Partial<Alert> = {}): Alert {
  return {
    id,
    student_id: "maya",
    skill_id: "6.RP.A.3",
    signal: "stuck",
    evidence: "Maya is stuck.",
    root_cause: "4.NF.A.1",
    action: "Try a short refresher.",
    others_with_gap: [],
    status: "open",
    recheck_at: null,
    ...changes,
  };
}

describe("teacher workspace helpers", () => {
  it("maps the documented keyboard shortcuts", () => {
    expect(keyboardShortcutForKey("j")).toBe("next");
    expect(keyboardShortcutForKey("K")).toBe("previous");
    expect(keyboardShortcutForKey("d")).toBe("done");
    expect(keyboardShortcutForKey("s")).toBe("snooze");
    expect(keyboardShortcutForKey("Enter")).toBeNull();
  });

  it("moves within the inbox without wrapping past either end", () => {
    const alerts = [alert("a"), alert("b"), alert("c")];
    expect(moveSelection(alerts, "a", -1)).toBe("a");
    expect(moveSelection(alerts, "a", 1)).toBe("b");
    expect(moveSelection(alerts, "c", 1)).toBe("c");
    expect(moveSelection(alerts, null, 1)).toBe("a");
    expect(moveSelection([], null, 1)).toBeNull();
  });

  it("pins open safety concerns, keeps active work above closed items, and uses newest first", () => {
    const ordered = inboxOrder([
      alert("older-active"),
      alert("closed", { status: "verified" }),
      alert("newer-active"),
      alert("safety", { signal: "safety_concern" }),
    ]);

    expect(ordered.map((item) => item.id)).toEqual([
      "safety",
      "newer-active",
      "older-active",
      "closed",
    ]);
  });
});
