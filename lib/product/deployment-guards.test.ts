import { afterEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ database: vi.fn(() => { throw new Error("Must not touch filesystem storage on Vercel"); }) }));
vi.mock("./server", () => ({ database: state.database, currentAccount: vi.fn(), sameOrigin: vi.fn(), materialsDirectory: "/not-used", hashPassword: vi.fn(), publicProfile: vi.fn(), setSession: vi.fn(), verifyPassword: vi.fn(), visibleWorkspace: vi.fn() }));
import { GET as accountGet, POST as accountPost } from "@/app/api/account/route";
import { POST as learning } from "@/app/api/learning/route";
import { POST as upload } from "@/app/api/materials/route";
import { GET as download } from "@/app/api/materials/[id]/route";

describe("Vercel browser demo API guards", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
  it("refuses file-backed account, learning, and material requests before storage is used", async () => {
    vi.stubEnv("VERCEL", "1");
    const request = () => new Request("https://rova.example/api/account", { method: "POST" });
    const responses = await Promise.all([accountGet(), accountPost(request()), learning(request()), upload(request()), download(new Request("https://rova.example/api/materials/a"), { params: Promise.resolve({ id: "a" }) })]);
    expect(responses.every(response => response.status === 503)).toBe(true);
    expect(state.database).not.toHaveBeenCalled();
  });
});
