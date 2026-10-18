import { describe, expect, it } from "vitest";

import { loopStageIndex } from "@/components/teacher/LoopTracker";

describe("loopStageIndex", () => {
  it("maps open alerts to the detected stage", () => {
    expect(loopStageIndex("open")).toBe(0);
  });

  it("maps acted alerts to the teacher-action stage", () => {
    expect(loopStageIndex("acted")).toBe(1);
  });

  it("maps verified and escalated outcomes to the recheck stage", () => {
    expect(loopStageIndex("verified")).toBe(2);
    expect(loopStageIndex("escalated")).toBe(2);
  });
});
