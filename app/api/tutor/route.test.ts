import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { mayaProfile } from "@/lib/data/seed";
import type { TutorContext } from "@/lib/types";

const tutorContext: TutorContext = {
  profile: mayaProfile,
  problem_id: "ratio-main",
  hint_level: 0,
  mode: "problem",
};

function request(body: string): Request {
  return new Request("http://localhost/api/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/tutor", () => {
  it("returns a checked tutor reply and measured event time", async () => {
    const response = await POST(
      request(
        JSON.stringify({
          input: "I got 12",
          context: tutorContext,
          seconds: 19,
        }),
      ),
    );
    const reply = await response.json();
    expect(response.status).toBe(200);
    expect(reply.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "attempt", correct: true, seconds: 19 }),
      ]),
    );
    expect(reply.next_mode).toBe("explain");
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await POST(request("{"));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid contexts and unknown problems", async () => {
    const invalidContext = await POST(request(JSON.stringify({ input: "help" })));
    const unknownProblem = await POST(
      request(
        JSON.stringify({
          input: "help",
          context: { ...tutorContext, problem_id: "missing" },
        }),
      ),
    );
    expect(invalidContext.status).toBe(400);
    expect(unknownProblem.status).toBe(400);
  });
});
