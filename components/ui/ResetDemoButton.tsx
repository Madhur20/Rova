"use client";

// Restores the seeded demo state for every view (D-005), so the README demo path can be rerun.

import { resetDemo } from "@/lib/data/store";

export function ResetDemoButton() {
  return (
    <button
      type="button"
      onClick={resetDemo}
      className="rounded-control border border-rule bg-transparent px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-strong"
    >
      Reset demo
    </button>
  );
}
