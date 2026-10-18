import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));
import { AuthForm } from "./AuthForm";

describe("authentication page presentation", () => {
  it.each([true, false])("omits demo information and reset (signup: %s)", signup => {
    const html = renderToStaticMarkup(React.createElement(AuthForm, { signup }));
    expect(html).toContain(signup ? "Create my account" : "Log in");
    expect(html).not.toContain("demo-information");
    expect(html).not.toContain("About this demo");
    expect(html).not.toContain("Reset demo");
  });
});
