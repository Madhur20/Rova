import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleWorkspace, type Profile, type Workspace } from "@/lib/product/model";
const state = vi.hoisted(() => ({ db: {} as { workspace: Workspace }, account: null as Profile | null }));
vi.mock("@/lib/product/server", () => ({
  sameOrigin: (request: Request) => request.headers.get("origin") === new URL(request.url).origin,
  database: (callback: (db: typeof state.db) => unknown) => callback(state.db),
  currentAccount: () => state.account,
  visibleWorkspace: (workspace: Workspace) => workspace,
}));
import { POST } from "./route";
const request = (body: unknown, origin = "http://localhost:3000") => POST(new Request("http://localhost:3000/api/learning", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) }));
beforeEach(() => { state.db = { workspace: sampleWorkspace() }; state.account = { id: "maya", name: "Maya", role: "student", school: "Maplewood", goal: 10, avatar: "sage" }; });
describe("learning API coaching authorization", () => {
  it("requires a session and same origin", async () => {
    expect((await request({ action: "coach-start", topic: "fractions" }, "https://other.test")).status).toBe(403);
    state.account = null;
    expect((await request({ action: "coach-start", topic: "fractions" })).status).toBe(401);
  });
  it("ignores client correctness and hint claims", async () => {
    const start = await (await request({ action: "coach-start", topic: "fractions" })).json();
    const response = await request({ action: "coach-turn", sessionId: start.session.id, id: "attempt-01", text: "3", correct: true, hints: 0 });
    expect(response.status).toBe(200);
    expect(state.db.workspace.attempts.at(-1)?.correct).toBe(false);
    expect(state.db.workspace.sessions?.[0].messages.at(-1)?.kind).toBe("retry");
  });
  it("blocks access to another learner’s conversation", async () => {
    const start = await (await request({ action: "coach-start", topic: "fractions" })).json();
    state.account!.id = "learner-1";
    expect((await request({ action: "coach-turn", sessionId: start.session.id, id: "attempt-01", text: "2" })).status).toBe(400);
  });
  it("does not let a teacher manually mark an unfinished group complete", async () => {
    state.account!.role = "teacher";
    await request({ action: "plan", topic: "fractions", studentIds: ["maya"] });
    const plan = state.db.workspace.plans[0];
    expect((await request({ action: "complete-plan", id: plan.id })).status).toBe(400);
    expect(plan.completed).not.toBe(true);
  });
  it("records completion automatically after an assigned student solves the lesson", async () => {
    state.account!.role = "teacher";
    await request({ action: "plan", topic: "fractions", studentIds: ["maya"] });
    const plan = state.db.workspace.plans[0];
    state.account!.role = "student";
    const start = await (await request({ action: "coach-start", topic: "fractions", planId: plan.id })).json();
    for (const [index, text] of ["2", "4", "9"].entries()) {
      await request({ action: "coach-turn", sessionId: start.session.id, id: `answer-${index}`, text });
      if (index < 2) await request({ action: "coach-next", sessionId: start.session.id });
    }
    expect(plan.completed).toBe(true);
    expect(state.db.workspace.attempts.filter(a => a.planId === plan.id)).toHaveLength(3);
  });
  it("opens a refresher only from the learner’s own traced ratios session", async () => {
    const ratios = (await (await request({ action: "coach-start", topic: "ratios" })).json()).session;
    for (const [index, text] of ["7", "8"].entries()) await request({ action: "coach-turn", sessionId: ratios.id, id: `miss-000${index}`, text });
    expect(state.db.workspace.sessions?.[0].trace?.prerequisite).toBe("fractions");
    expect((await request({ action: "coach-start", topic: "geometry", refresherFor: ratios.id })).status).toBe(400);
    const refresher = await request({ action: "coach-start", topic: "fractions", refresherFor: ratios.id });
    expect(refresher.status).toBe(200);
    expect((await refresher.json()).session.refresherFor).toBe(ratios.id);
    state.account!.id = "learner-1";
    expect((await request({ action: "coach-start", topic: "fractions", refresherFor: ratios.id })).status).toBe(400);
  });
  it("lets only teachers acknowledge a learning alert", async () => {
    const ratios = (await (await request({ action: "coach-start", topic: "ratios" })).json()).session;
    for (const [index, text] of ["7", "8"].entries()) await request({ action: "coach-turn", sessionId: ratios.id, id: `miss-000${index}`, text });
    expect((await request({ action: "trace-ack", sessionId: ratios.id })).status).toBe(403);
    state.account!.role = "teacher";
    expect((await request({ action: "trace-ack", sessionId: ratios.id })).status).toBe(200);
    expect(state.db.workspace.sessions?.[0].trace?.acknowledgedAt).toBeDefined();
  });
});
describe("learning API question bank", () => {
  const teacher = () => { state.account!.role = "teacher"; state.account!.id = "rivera"; };
  const draft = { action: "question-add", topic: "fractions", prompt: "Fill in the missing numerator: 1/2 = ?/8", answer: "4", hints: ["What did you multiply 2 by?", "Same number on top."], explanation: "Both parts × 4." };
  it("lets only teachers add, and never a hint that gives the answer away", async () => {
    expect((await request(draft)).status).toBe(403);
    teacher();
    expect((await request({ ...draft, hints: ["It is 4."] })).status).toBe(400);
    expect((await request(draft)).status).toBe(200);
    expect((await request(draft)).status).toBe(400);
    const added = state.db.workspace.questions![0];
    expect(added.origin).toBe("teacher");
    expect(added.guide).toBe(draft.hints[0]);
    expect(added.simple).toBe("");
  });
  it("keeps a question that a shared lesson uses, and removes a free one", async () => {
    teacher();
    await request(draft);
    const id = state.db.workspace.questions![0].id;
    expect((await request({ action: "question-remove", id: "fr1" })).status).toBe(400);
    await request({ action: "plan", topic: "fractions", studentIds: ["maya"], questionIds: [id, "fr1"] });
    expect(state.db.workspace.plans[0].questionIds).toEqual(["fr1", id]);
    expect((await request({ action: "question-remove", id })).status).toBe(400);
    state.db.workspace.plans = [];
    expect((await request({ action: "question-remove", id })).status).toBe(200);
    expect(state.db.workspace.questions).toHaveLength(0);
  });
  it("sends a random three by default and validates chosen ids", async () => {
    teacher();
    await request({ action: "plan", topic: "geometry", studentIds: ["maya"] });
    expect(state.db.workspace.plans[0].questionIds).toEqual(["ge1", "ge2", "ge3"]);
    await request({ action: "plan", topic: "fractions", studentIds: ["maya"], count: 1 });
    expect(state.db.workspace.plans[1].questionIds).toHaveLength(1);
    expect((await request({ action: "plan", topic: "fractions", studentIds: ["learner-1"], questionIds: ["ge1"] })).status).toBe(400);
    expect((await request({ action: "plan", topic: "fractions", studentIds: ["learner-1"], questionIds: [] })).status).toBe(400);
    expect((await request({ action: "plan", topic: "fractions", studentIds: ["learner-1"], questionIds: ["fr1", "fr1"] })).status).toBe(400);
  });
  it("stores course materials and clears references when one is removed", async () => {
    teacher();
    expect((await request({ action: "material-add", title: "H", kind: "handbook", topics: [] })).status).toBe(400);
    expect((await request({ action: "material-add", title: "Grade 4 Handbook", kind: "handbook", topics: ["fractions"], notes: "Ch. 5" })).status).toBe(200);
    const material = state.db.workspace.materials![0];
    await request({ ...draft, source: material.id });
    expect(state.db.workspace.questions![0].source).toBe(material.id);
    await request({ action: "material-remove", id: material.id });
    expect(state.db.workspace.materials).toHaveLength(0);
    expect(state.db.workspace.questions![0].source).toBeUndefined();
  });
  it("grades a teacher-added question with code in free practice", async () => {
    teacher();
    await request(draft);
    const id = state.db.workspace.questions![0].id;
    state.account!.role = "student"; state.account!.id = "maya";
    expect((await (await request({ action: "attempt", questionId: id, answer: "4", id: "attempt-custom-1" })).json()).correct).toBe(true);
    expect((await (await request({ action: "attempt", questionId: id, answer: "5", id: "attempt-custom-2" })).json()).correct).toBe(false);
  });
});
