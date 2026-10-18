import { beforeEach, describe, expect, it } from "vitest";

import { resetLLM } from "@/lib/llm";
import { draftParentMessage } from "@/lib/messages/draftParentMessage";

const recipeActivity =
  "Comparen 1/2 taza con 2/4 de taza usando una receta o un dibujo.";

describe("draftParentMessage", () => {
  beforeEach(() => resetLLM());

  it("drafts the Spanish recipe-ratio activity message by default", () => {
    const message = draftParentMessage("maya", recipeActivity, "es", {
      sentAt: "2026-10-17T19:00:00-04:00",
    });

    expect(message).toMatchObject({
      student_id: "maya",
      language: "es",
      kind: "activity",
      sent_at: "2026-10-17T19:00:00-04:00",
    });
    expect(message.text).toContain("Maya");
    expect(message.text).toContain("fracciones equivalentes");
    expect(message.text).toContain(recipeActivity);
  });

  it("drafts a win message after verification", () => {
    const message = draftParentMessage("maya", recipeActivity, "es", {
      kind: "win",
      skill: "razones equivalentes",
    });

    expect(message.kind).toBe("win");
    expect(message.text).toContain("razones equivalentes");
    expect(message.text).toContain("domina");
  });

  it("uses the shared student name instead of defaulting every message to Maya", () => {
    const message = draftParentMessage("s02", recipeActivity, "es");

    expect(message.text).toContain("Student 2");
    expect(message.text).not.toContain("Maya");
  });

  it("drafts a weekly learned, working-on, and at-home summary", () => {
    const message = draftParentMessage("maya", recipeActivity, "es", {
      kind: "weekly",
      learned: "comparar fracciones simples",
      workingOn: "razones con tablas",
    });

    expect(message.kind).toBe("weekly");
    expect(message.text).toContain("comparar fracciones simples");
    expect(message.text).toContain("razones con tablas");
    expect(message.text).toContain(recipeActivity);
  });

  it("makes a missing language template visible instead of returning blank text", () => {
    const message = draftParentMessage("maya", recipeActivity, "fr");

    expect(message.text).toBe("[missing template: parent.activity.fr]");
  });
});
