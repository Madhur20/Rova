import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/product/client", () => ({ browserDemo: true, browserStore: vi.fn() }));
import { DemoNotice } from "./DemoNotice";

describe("discreet demo information", () => {
  it("keeps technical details and reset inside a closed disclosure instead of a banner", () => {
    const html = renderToStaticMarkup(React.createElement(DemoNotice));
    expect(html).toContain('<details class="demo-information">');
    expect(html).not.toMatch(/<details[^>]*\bopen(?:=|\s|>)/);
    expect(html).toContain("<summary>Simulated demo</summary>");
    expect(html).toContain("Reset demo");
    expect(html).toContain("do not sync between devices");
    expect(html).not.toContain("Saved in this browser only");
    expect(html).not.toContain("browser-demo-notice");
    expect(html).not.toContain("<aside");
  });
});
