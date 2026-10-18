import { describe, expect, it } from "vitest";
import { navigation, sectionFromHash } from "./navigation";
describe("role-specific navigation destinations", () => {
  it("resolves every sidebar link to its own section, including saved links on reload", () => {
    for (const role of ["teacher", "student", "parent"] as const) {
      for (const item of navigation[role]) expect(sectionFromHash(role, `#${item.id}`)).toBe(item.id);
    }
  });
  it("falls back to overview for unknown or other-role destinations", () => {
    expect(sectionFromHash("student", "#plans")).toBe("overview");
    expect(sectionFromHash("teacher", "#plans")).toBe("overview");
    expect(sectionFromHash("teacher", "#messages")).toBe("overview");
    expect(sectionFromHash("parent", "")).toBe("overview");
    expect(sectionFromHash("parent", "#unknown")).toBe("overview");
  });
});
