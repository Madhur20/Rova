import { describe, expect, it } from "vitest";

import {
  mayaActivityMessageFixture,
  mayaWeeklyMessageFixture,
  mayaWinMessageFixture,
  recipeRatioActivity,
} from "@/components/parent/mayaActivityMessageFixture";

describe("parent message fixtures", () => {
  it("provides all three Spanish message kinds", () => {
    expect([
      mayaActivityMessageFixture.kind,
      mayaWeeklyMessageFixture.kind,
      mayaWinMessageFixture.kind,
    ]).toEqual(["activity", "weekly", "win"]);

    for (const message of [
      mayaActivityMessageFixture,
      mayaWeeklyMessageFixture,
      mayaWinMessageFixture,
    ]) {
      expect(message.student_id).toBe("maya");
      expect(message.language).toBe("es");
      expect(message.text).not.toContain("[missing template:");
    }
  });

  it("keeps the recipe-ratio activity in the activity and weekly messages", () => {
    expect(mayaActivityMessageFixture.text).toContain(recipeRatioActivity);
    expect(mayaWeeklyMessageFixture.text).toContain(recipeRatioActivity);
  });
});
