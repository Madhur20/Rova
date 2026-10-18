import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sampleProfiles, sampleWorkspace } from "@/lib/product/model";
import { ParentDashboard } from "./ParentDashboard";

describe("family message presentation", () => {
  it("labels automatic notes as learning updates without technical delivery copy", () => {
    const workspace = sampleWorkspace();
    workspace.notes.push({ id: "automatic-demo-note", studentId: "maya", text: "Maya completed her fractions refresher.", author: "Rova", automatic: true, at: "2026-10-18T12:00:00Z" });
    const html = renderToStaticMarkup(React.createElement(ParentDashboard, { profile: sampleProfiles.parent, workspace, section: "overview", mutate: async () => null }));
    expect(html).toContain("Learning update");
    expect(html).toContain("Maya completed her fractions refresher.");
    expect(html).not.toContain("not texted");
    expect(html).not.toContain("saved in Rova");
  });
});
