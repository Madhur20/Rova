import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { questions } from "@/lib/product/curriculum";
import { LessonVisual } from "./LessonVisual";

describe("question pictures and hands-on models", () => {
  it("draw a model for every question", () => {
    for (const q of questions) {
      const html = renderToStaticMarkup(React.createElement(LessonVisual, { question: q }));
      expect(html, q.id).toContain("concept-visual");
    }
  });

  it("never show the answer as a label (unless the question itself states that number)", () => {
    for (const q of questions) {
      if (q.answer.length < 2 || q.prompt.replace(/,/g, "").includes(q.answer)) continue;
      const html = renderToStaticMarkup(React.createElement(LessonVisual, { question: q }));
      expect(html, q.id).not.toMatch(new RegExp(`>\\s*${q.answer}\\s*<`));
      expect(html, q.id).not.toContain(`>${q.answer.split("").join("</strong><strong>")}<`);
    }
  });
});
