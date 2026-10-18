import { afterAll, describe, expect, it } from "vitest";
import { responderCases } from "./responder-cases";
import { mayaProfile } from "@/lib/data/seed";
import { respond } from "@/lib/tutor/responder";

let passed = 0;

function replyType(reply: ReturnType<typeof respond>, mode: string): string {
  if (reply.intent === "answer") {
    return reply.events.some((event) =>
      mode === "refresher" ? event.type === "refresher" : event.type === "attempt",
    )
      ? "math_check"
      : "invalid";
  }
  if (reply.intent === "ask_answer") return "answer_refusal";
  if (reply.intent === "stuck") {
    return reply.events.some((event) => event.type === "hint") ? "hint" : "invalid";
  }
  if (reply.intent === "explain") {
    return reply.events.some((event) => event.type === "explain")
      ? "explain_back"
      : "invalid";
  }
  if (reply.intent === "unsafe") {
    return reply.quick_replies.includes("Send to my teacher")
      ? "safety_redirect"
      : "invalid";
  }
  return reply.quick_replies.includes("Send to my teacher")
    ? "teacher_redirect"
    : "invalid";
}

describe("responder evaluation set", () => {
  it.each(responderCases)(
    "$label",
    ({ input, expectedIntent, expectedReplyType, mode = "problem" }) => {
      const reply = respond(input, {
        profile: mayaProfile,
        problem_id: "ratio-main",
        hint_level: 0,
        mode,
      });
      expect(reply.intent).toBe(expectedIntent);
      expect(replyType(reply, mode)).toBe(expectedReplyType);
      expect(reply.text.length).toBeGreaterThan(0);
      expect(reply.text).not.toContain("[missing template:");
      passed += 1;
    },
  );

  afterAll(() => {
    process.stdout.write(
      `Responder evaluation: ${passed}/${responderCases.length} passed (${Math.round((passed / responderCases.length) * 100)}%).`,
    );
  });
});
