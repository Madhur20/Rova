import { beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { sampleWorkspace, type Profile, type Workspace } from "@/lib/product/model";
const state = vi.hoisted(() => ({ db: {} as { workspace: Workspace }, account: null as Profile | null, dir: "" }));
vi.mock("@/lib/product/server", () => ({
  sameOrigin: (request: Request) => request.headers.get("origin") === new URL(request.url).origin,
  database: (callback: (db: typeof state.db) => unknown) => callback(state.db),
  currentAccount: () => state.account,
  visibleWorkspace: (workspace: Workspace) => workspace,
  get materialsDirectory() { return state.dir; },
}));
import { POST } from "./route";
import { GET } from "./[id]/route";
import { POST as learning } from "../learning/route";
function upload(fields: Record<string, string>, file?: { name: string; body: string; type?: string }, origin = "http://localhost:3000") {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  if (file) form.set("file", new File([file.body], file.name, { type: file.type ?? "application/octet-stream" }));
  return POST(new Request("http://localhost:3000/api/materials", { method: "POST", headers: { origin }, body: form }));
}
beforeEach(() => { state.db = { workspace: sampleWorkspace() }; state.dir = mkdtempSync(path.join(tmpdir(), "rova-materials-")); state.account = { id: "rivera", name: "Elena", role: "teacher", school: "Maplewood", goal: 10, avatar: "peach" }; });
describe("course material uploads", () => {
  it("requires a teacher and the same origin", async () => {
    expect((await upload({ title: "Handbook", kind: "handbook", topics: '["fractions"]' }, undefined, "https://other.test")).status).toBe(403);
    state.account!.role = "student";
    expect((await upload({ title: "Handbook", kind: "handbook", topics: '["fractions"]' })).status).toBe(403);
  });
  it("stores a PDF on disk and serves it back to the teacher only", async () => {
    const response = await upload({ title: "Grade 4 Handbook", kind: "handbook", topics: '["fractions","geometry"]', notes: "Unit 5" }, { name: "Unit 5.pdf", body: "%PDF-1.4 fake", type: "application/pdf" });
    expect(response.status).toBe(200);
    const material = state.db.workspace.materials![0];
    expect(material.file).toMatchObject({ name: "Unit 5.pdf", ext: "pdf", type: "application/pdf", size: 13 });
    expect(material.topics).toEqual(["fractions", "geometry"]);
    expect(readdirSync(state.dir)).toEqual([`${material.id}.pdf`]);
    const served = await GET(new Request("http://localhost:3000/api/materials/" + material.id), { params: Promise.resolve({ id: material.id }) });
    expect(served.status).toBe(200);
    expect(served.headers.get("Content-Type")).toBe("application/pdf");
    expect(await served.text()).toBe("%PDF-1.4 fake");
    state.account!.role = "parent";
    expect((await GET(new Request("http://localhost:3000/api/materials/" + material.id), { params: Promise.resolve({ id: material.id }) })).status).toBe(403);
  });
  it("rejects other file types and oversized files, and works without a file", async () => {
    expect((await upload({ title: "Slides", kind: "other", topics: '["fractions"]' }, { name: "deck.pptx", body: "x" })).status).toBe(400);
    expect((await upload({ title: "Big", kind: "other", topics: '["fractions"]' }, { name: "big.pdf", body: "x".repeat(10 * 1024 * 1024 + 1) })).status).toBe(400);
    expect((await upload({ title: "Scope", kind: "curriculum", topics: '["fractions"]', notes: "Pacing guide" })).status).toBe(200);
    expect(state.db.workspace.materials![0].file).toBeUndefined();
    expect(readdirSync(state.dir)).toEqual([]);
  });
  it("uses a text file as the notes when none were written, and removes the file with the material", async () => {
    await upload({ title: "Unit notes", kind: "textbook", topics: '["fractions"]' }, { name: "unit.txt", body: "Equivalent   fractions:\n same whole, smaller pieces.", type: "text/plain" });
    const material = state.db.workspace.materials![0];
    expect(material.notes).toBe("Equivalent fractions: same whole, smaller pieces.");
    expect(readdirSync(state.dir)).toHaveLength(1);
    const removed = await learning(new Request("http://localhost:3000/api/learning", { method: "POST", headers: { origin: "http://localhost:3000", "Content-Type": "application/json" }, body: JSON.stringify({ action: "material-remove", id: material.id }) }));
    expect(removed.status).toBe(200);
    expect(readdirSync(state.dir)).toEqual([]);
  });
});
