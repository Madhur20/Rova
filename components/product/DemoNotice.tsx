"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserDemo, browserStore } from "@/lib/product/client";

export function DemoNotice() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!browserDemo) return null;
  return <aside className="browser-demo-notice" aria-label="Browser demo information">
    <div><strong>Simulated demo · Saved in this browser only</strong><p>Roles share this browser’s data, not other devices. No real student data. Coach replies are scripted; math is checked by code.</p></div>
    <button type="button" className="text-link" disabled={busy} onClick={async () => {
      if (!window.confirm("Reset Rova in this browser? This removes all demo accounts you created, practice, lessons, notes, and uploaded materials, and restores the sample classroom. Other apps are unaffected.")) return;
      setBusy(true); setError("");
      try { await browserStore().reset(); router.replace("/login"); router.refresh(); setBusy(false); }
      catch (e) { setError(e instanceof Error ? e.message : "Reset failed. Please try again."); setBusy(false); }
    }}>{busy ? "Resetting…" : "Reset demo"}</button>
    {error && <p role="alert">{error}</p>}
  </aside>;
}
