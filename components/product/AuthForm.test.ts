import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));
import { AuthForm } from "./AuthForm";

describe("signup presentation", () => {
  it("omits demo information and reset from signup", () => {
    const html = renderToStaticMarkup(React.createElement(AuthForm, { signup: true }));
    expect(html).toContain("Create my account");
    expect(html).not.toContain("demo-information");
    expect(html).not.toContain("About this demo");
    expect(html).not.toContain("Reset demo");
  });
  it("keeps demo information and reset reachable on login", () => {
    const html = renderToStaticMarkup(React.createElement(AuthForm));
    expect(html).toContain("demo-information");
    expect(html).toContain("Reset demo");
  });
});
