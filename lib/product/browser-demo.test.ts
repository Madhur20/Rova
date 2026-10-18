import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoStore, DEMO_KEY, DEMO_SESSION_KEY } from "./browser-demo";
import type { DemoFiles } from "./demo-files";

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
function setup() {
  const local = new MemoryStorage(), sessions = [new MemoryStorage(), new MemoryStorage(), new MemoryStorage()];
  const blobs = new Map<string, Blob>();
  const files: DemoFiles = { put: async (id, file) => { blobs.set(id, file); }, get: async id => blobs.get(id), remove: async id => { blobs.delete(id); }, clear: async () => { blobs.clear(); } };
  let queue = Promise.resolve<unknown>(undefined);
  const lock = <T>(action: () => Promise<T>): Promise<T> => { const next = queue.catch(() => {}).then(action); queue = next; return next; };
  const stores = sessions.map(session => createDemoStore({ local, session, files, lock }));
  return { local, sessions, files, blobs, stores, lock };
}
const send = (store: ReturnType<typeof createDemoStore>, url: string, body: Record<string, unknown>) => store.request(url, { method: "POST", body: JSON.stringify(body) });
async function login(store: ReturnType<typeof createDemoStore>, role: string) {
  const response = await send(store, "/api/account", { action: "login", email: `${role}@rova.school`, password: "rova2026" });
  expect(response.status).toBe(200);
}

describe("browser-only product demo", () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  it("starts signed out, seeds once, and keeps roles signed in independently per tab", async () => {
    const { stores, local } = setup();
    expect((await stores[0].request("/api/account")).status).toBe(401);
    const seeded = local.getItem(DEMO_KEY);
    await login(stores[0], "teacher"); await login(stores[1], "student"); await login(stores[2], "parent");
    for (const [index, role] of ["teacher", "student", "parent"].entries()) expect((await (await stores[index].request("/api/account")).json()).profile.role).toBe(role);
    expect(local.getItem(DEMO_KEY)).toBe(seeded);
    await send(stores[0], "/api/account", { action: "logout" });
    expect((await stores[0].request("/api/account")).status).toBe(401);
    expect((await stores[1].request("/api/account")).status).toBe(200);
  });
  it("persists the teacher → student → teacher → parent lesson flow with code grading", async () => {
    const { stores, local, sessions, files, lock } = setup();
    const [teacher, student, parent] = stores;
    await login(teacher, "teacher"); await login(student, "student"); await login(parent, "parent");
    const assigned = await (await send(teacher, "/api/learning", { action: "plan", topic: "fractions", studentIds: ["maya"], questionIds: ["fr1", "fr2", "fr3"] })).json();
    const plan = assigned.workspace.plans[0];
    const started = await (await send(student, "/api/learning", { action: "coach-start", topic: "fractions", planId: plan.id })).json();
    const id = started.session.id;
    for (const [index, answer] of ["2", "4", "9"].entries()) {
      const checked = await send(student, "/api/learning", { action: "coach-turn", sessionId: id, id: `answer-${index}-000`, text: answer, correct: false });
      expect(checked.status).toBe(200);
      if (index < 2) expect((await send(student, "/api/learning", { action: "coach-next", sessionId: id })).status).toBe(200);
    }
    const reopened = createDemoStore({ local, session: sessions[0], files, lock });
    const seen = await (await reopened.request("/api/account")).json();
    expect(seen.workspace.plans[0].completed).toBe(true);
    expect(seen.workspace.sessions[0].messages.some((m: { kind: string }) => m.kind === "correct")).toBe(true);
    expect(seen.workspace.attempts.filter((a: { sessionId: string }) => a.sessionId === id)).toHaveLength(3);
    await send(teacher, "/api/learning", { action: "note", studentId: "maya", text: "Thoughtful progress today." });
    const family = await (await parent.request("/api/account")).json();
    expect(family.workspace.notes.at(-1).text).toBe("Thoughtful progress today.");
    expect(family.workspace.sessions[0].messages).toEqual([]);
    expect(family.workspace.students).toHaveLength(1);
  });
  it("rejects wrong passwords, invalid codes and role-inappropriate actions", async () => {
    const { stores } = setup();
    expect((await send(stores[0], "/api/account", { action: "login", email: "student@rova.school", password: "wrong" })).status).toBe(401);
    expect((await send(stores[0], "/api/account", { action: "signup", name: "Demo", email: "demo@example.com", password: "only-demo", role: "student", code: "WRONG" })).status).toBe(400);
    await login(stores[0], "student");
    expect((await send(stores[0], "/api/learning", { action: "plan", topic: "fractions", studentIds: ["maya"] })).status).toBe(403);
    expect((await send(stores[0], "/api/learning", { action: "note", studentId: "maya", text: "forged" })).status).toBe(403);
  });
  it("creates local-only demo accounts without storing or returning raw passwords", async () => {
    const { stores, local, sessions } = setup();
    const response = await send(stores[0], "/api/account", { action: "signup", name: "Demo Learner", email: "demo@example.com", password: "only-demo-phrase", role: "student", code: "MAPLE4" });
    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.profile.familyCode).toBe(`FAMILY-${result.profile.id}`);
    expect(JSON.stringify(result)).not.toContain("credential");
    expect(local.getItem(DEMO_KEY)).not.toContain("only-demo-phrase");
    sessions[0].removeItem(DEMO_SESSION_KEY);
    expect((await send(stores[0], "/api/account", { action: "login", email: "demo@example.com", password: "only-demo-phrase" })).status).toBe(200);
  });
  it("saves uploaded material locally, exposes it to the teacher, and removes its file", async () => {
    const { stores, blobs } = setup();
    await login(stores[0], "teacher"); await login(stores[1], "student");
    const form = new FormData();
    form.set("title", "Demo lesson notes"); form.set("kind", "handbook"); form.set("topics", '["fractions"]');
    form.set("file", new File(["Equivalent fractions: same whole."], "notes.txt", { type: "text/plain" }));
    const response = await stores[0].request("/api/materials", { method: "POST", body: form });
    expect(response.status).toBe(200);
    const material = (await response.json()).workspace.materials[0];
    expect(material.notes).toBe("Equivalent fractions: same whole.");
    expect(await (await stores[0].material(material.id)).file.text()).toBe("Equivalent fractions: same whole.");
    await expect(stores[1].material(material.id)).rejects.toThrow("simulated teacher");
    expect((await send(stores[0], "/api/learning", { action: "material-remove", id: material.id })).status).toBe(200);
    expect(blobs.size).toBe(0);
  });
  it("resets only this demo and invalidates sessions in every tab", async () => {
    const { stores, local, blobs } = setup();
    await login(stores[0], "teacher"); await login(stores[1], "student");
    local.setItem("another-app", "keep me"); blobs.set("old-file", new Blob(["demo"]));
    await send(stores[0], "/api/learning", { action: "note", studentId: "maya", text: "reset me" });
    await stores[0].reset();
    expect(local.getItem("another-app")).toBe("keep me"); expect(blobs.size).toBe(0);
    expect((await stores[1].request("/api/account")).status).toBe(401);
    await login(stores[0], "teacher");
    expect((await (await stores[0].request("/api/account")).json()).workspace.notes).toHaveLength(1);
  });
  it("serializes competing tab writes without losing notes", async () => {
    const { stores } = setup();
    await login(stores[0], "teacher"); await login(stores[1], "teacher");
    const responses = await Promise.all(stores.slice(0, 2).map((store, i) => send(store, "/api/learning", { action: "note", studentId: "maya", text: `Tab ${i}` })));
    expect(responses.every(r => r.ok)).toBe(true);
    expect((await (await stores[0].request("/api/account")).json()).workspace.notes).toHaveLength(3);
  });
  it("does not overwrite corrupt storage and provides a reset recovery path", async () => {
    const { stores, local } = setup();
    local.setItem(DEMO_KEY, "corrupt");
    const response = await stores[0].request("/api/account");
    expect(response.status).toBe(500); expect((await response.json()).error).toContain("Reset demo");
    expect(local.getItem(DEMO_KEY)).toBe("corrupt");
    await stores[0].reset(); await login(stores[0], "teacher");
  });
  it("reports quota failures without discarding previously saved progress", async () => {
    const { stores, local } = setup();
    await login(stores[0], "teacher"); const saved = local.getItem(DEMO_KEY);
    vi.spyOn(local, "setItem").mockImplementation(() => { throw new Error("quota"); });
    const response = await send(stores[0], "/api/learning", { action: "note", studentId: "maya", text: "Not saved" });
    expect(response.status).toBe(500); expect((await response.json()).error).toContain("couldn’t save");
    expect(local.getItem(DEMO_KEY)).toBe(saved);
  });
});
