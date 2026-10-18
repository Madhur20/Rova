import { beforeEach, describe, expect, it } from "vitest";
import { callLLM, fillTemplate, resetLLM } from "@/lib/llm";

const templates = {
  greet: ["Hi {name}!", "Welcome back, {name}!"],
};

describe("callLLM (template mode)", () => {
  beforeEach(() => resetLLM());

  it("fills placeholders", () => {
    expect(callLLM("greet", { name: "Maya" }, templates)).toBe("Hi Maya!");
  });

  it("rotates wordings and wraps around", () => {
    expect(callLLM("greet", { name: "Maya" }, templates)).toBe("Hi Maya!");
    expect(callLLM("greet", { name: "Maya" }, templates)).toBe("Welcome back, Maya!");
    expect(callLLM("greet", { name: "Maya" }, templates)).toBe("Hi Maya!");
  });

  it("starts from the first wording again after resetLLM", () => {
    callLLM("greet", { name: "Maya" }, templates);
    resetLLM();
    expect(callLLM("greet", { name: "Maya" }, templates)).toBe("Hi Maya!");
  });

  it("never returns a blank string for an unknown template", () => {
    expect(callLLM("nope", {}, templates)).toBe("[missing template: nope]");
  });

  it("leaves unknown placeholders visible", () => {
    expect(fillTemplate("Hi {name}, {other}", { name: "Maya" })).toBe("Hi Maya, {other}");
  });
});
