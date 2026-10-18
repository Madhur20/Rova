"use client";
import { useState } from "react";
import { familyActivities } from "@/lib/product/insights";
import type { Learner, Profile, Workspace } from "@/lib/product/model";
import { Icon } from "./Brand";
import type { Mutate } from "./Shared";

export function FamilyActivities({ child, profile, workspace, mutate }: { child: Learner; profile: Profile; workspace: Workspace; mutate: Mutate }) {
  const { next, completed } = familyActivities(workspace, profile.id, child);
  const [busy, setBusy] = useState(false);
  async function toggle(key: string) {
    if (busy) return;
    setBusy(true);
    await mutate({ action: "check", key });
    setBusy(false);
  }
  return <section className="family-activities">{completed.length > 0 && <div className="family-completion" role="status"><span className="stat-icon sage"><Icon name="check"/></span><div><strong>{next ? "Activity done." : "You’re all caught up!"}</strong><p>You’ve completed {completed.length} activit{completed.length === 1 ? "y" : "ies"} together.{next ? " Here’s the next one." : ""}</p></div></div>}
    {next && <section className="home-activity" key={next.id}><div className="activity-intro"><span className={`topic-symbol ${next.color}`}>{next.symbol}</span><span className="eyebrow">{next.name}</span><h2>{next.activity}</h2><p>About 10 minutes with {child.name.split(" ")[0]}.</p><span className="activity-topic"><Icon name="book" size={16}/>{next.name} · {next.standard}</span></div><div className="activity-checklist">{next.steps.map((step, i) => {
      const key = `${next.id}-${i}`;
      const done = workspace.checks.includes(`${profile.id}:${key}`);
      return <label key={key} className={done ? "checked" : ""}><input type="checkbox" checked={done} disabled={busy} onChange={() => toggle(key)}/><span className="check-number">{done ? <Icon name="check" size={16}/> : i + 1}</span><span>{step}</span></label>;
    })}<p className="activity-takeaway"><strong>What to notice:</strong> {next.takeaway}</p><p><Icon name="leaf" size={16}/> Ask “How did you figure that out?” and let them lead.</p></div></section>}
    {completed.length > 0 && <details className="completed-activities"><summary>Activities you’ve completed · {completed.length}</summary>{completed.map(topic => <article key={topic.id}><strong><Icon name="check" size={17}/>{topic.activity}</strong><ul>{topic.steps.map(step => <li key={step}>{step}</li>)}</ul><p className="activity-takeaway"><strong>What to notice:</strong> {topic.takeaway}</p><button className="text-link" disabled={busy} onClick={() => toggle(`${topic.id}-${topic.steps.length - 1}`)}>Revisit this activity</button></article>)}</details>}
  </section>;
}
