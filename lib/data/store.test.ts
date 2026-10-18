import { beforeEach, describe, expect, it, vi } from "vitest";

// Minimal browser stand-in: localStorage plus a captured "storage" listener.
function fakeWindow() {
  const items = new Map<string, string>();
  let storageHandler: ((e: { key: string | null }) => void) | null = null;
  const win = {
    localStorage: {
      getItem: (k: string) => items.get(k) ?? null,
      setItem: (k: string, v: string) => void items.set(k, v),
      removeItem: (k: string) => void items.delete(k),
    },
    addEventListener: (_type: string, handler: (e: { key: string | null }) => void) => {
      storageHandler = handler;
    },
    removeEventListener: () => {
      storageHandler = null;
    },
  };
  return { win, items, fireStorage: () => storageHandler?.({ key: "rova-demo-v1" }) };
}

describe("store reset signal (review P2)", () => {
  beforeEach(() => vi.resetModules());

  it("notices a reset from another tab even when the saved state predates sessions", async () => {
    const { win, items, fireStorage } = fakeWindow();
    vi.stubGlobal("window", win);
    const { seedState } = await import("@/lib/rules/engine");
    const legacy: Record<string, unknown> = { ...seedState() };
    delete legacy.session;
    items.set("rova-demo-v1", JSON.stringify(legacy));

    const store = await import("@/lib/data/store");
    const onReset = vi.fn();
    store.onDemoReset(onReset);
    expect(store.getState().session).toBe("seed");

    // Another tab presses Reset demo.
    items.set("rova-demo-v1", JSON.stringify({ ...seedState(), session: "12345" }));
    fireStorage();
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(store.getState().session).toBe("12345");
    vi.unstubAllGlobals();
  });

  it("fires on a reset in the same tab and clears the saved state", async () => {
    const { win } = fakeWindow();
    vi.stubGlobal("window", win);
    const store = await import("@/lib/data/store");
    const onReset = vi.fn();
    const unsubscribe = store.onDemoReset(onReset);
    store.resetDemo();
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(store.getState().events).toEqual([]);
    unsubscribe();
    store.resetDemo();
    expect(onReset).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});

describe("store migration on load", () => {
  beforeEach(() => vi.resetModules());

  it("applies migrate_state to legacy saved state", async () => {
    const { win, items } = fakeWindow();
    vi.stubGlobal("window", win);
    const { seedState } = await import("@/lib/rules/engine");
    const legacy = {
      ...seedState(),
      events: [{ student_id: "maya", skill_id: "6.RP.A.3", type: "attempt", correct: false, seconds: 1, ts: "t1" }],
      alerts: [{ id: "alert-1", student_id: "maya", skill_id: "6.RP.A.3", signal: "stuck", evidence: "", root_cause: null, action: "", others_with_gap: [], status: "verified", recheck_at: null }],
    } as Record<string, unknown>;
    delete legacy.session;
    items.set("rova-demo-v1", JSON.stringify(legacy));
    const store = await import("@/lib/data/store");
    expect(store.getState().alerts[0].resolved_after_event).toBe(1);
    expect(store.getState().session).toBe("seed");
    vi.unstubAllGlobals();
  });
});
