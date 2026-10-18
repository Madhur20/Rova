import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sampleProfiles, sampleWorkspace } from "@/lib/product/model";
import { coachingTurn, startCoaching } from "@/lib/product/coaching";
import { TeacherDashboard } from "./TeacherDashboard";
import { LessonReview } from "./LessonReview";

const at = "2026-10-17T19:00:00Z";
describe("teacher safety visibility", () => {
  it.each(["overview", "classroom", "progress", "plans"])("puts safety first in teacher section %s", section => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "safety-session", at);
    coachingTurn(workspace, "maya", session.id, "flag-1", "I want to die", at);
    const html = renderToStaticMarkup(React.createElement(TeacherDashboard, { workspace, profile: sampleProfiles.teacher, section, mutate: async () => null }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Review safety concern · Maya Chen");
    // The safety alert is the first thing on every teacher page, before any section content.
    expect(html.slice(0, html.indexOf('role="alert"'))).not.toMatch(/<h[1-3]/);
    expect(html).toContain("No email, text, or emergency notification is sent");
  });
  it("shows the exact flagged learner message before the transcript", () => {
    const workspace = sampleWorkspace();
    const session = startCoaching(workspace, "maya", "fractions", "safety-session", at);
    coachingTurn(workspace, "maya", session.id, "flag-1", "nobody likes me and I want to disappear", at);
    const html = renderToStaticMarkup(React.createElement(LessonReview, { workspace, session, initialTab: "conversation", onClose: () => {} }));
    expect(html).toContain("Flagged safety messages");
    expect(html).toContain("nobody likes me and I want to disappear");
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("Conversation between Maya Chen and Rova");
  });
  it("does not show a safety alert for ordinary practice", () => {
    const workspace = sampleWorkspace();
    const html = renderToStaticMarkup(React.createElement(TeacherDashboard, { workspace, profile: sampleProfiles.teacher, section: "overview", mutate: async () => null }));
    expect(html).not.toContain('role="alert"');
  });
});
