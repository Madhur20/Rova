"use client";
import { useState } from "react";
import { topics } from "@/lib/product/curriculum";
import { lessonProgress } from "@/lib/product/coaching";
import type { Plan, Workspace } from "@/lib/product/model";
import { Icon } from "./Brand";
import { Practice } from "./Practice";
import type { Mutate } from "./Shared";

export function AssignedLessons({ workspace, studentId, mutate }: { workspace: Workspace; studentId: string; mutate: Mutate }) {
  const [selected, setSelected] = useState<Plan | null>(null);
  const plans = workspace.plans.filter(p => p.studentIds.includes(studentId));
  if (!plans.length) return null;
  return <section className="assigned-lessons dashboard-section"><div className="section-heading"><div><span className="eyebrow">From your teacher</span><h2>Your lesson</h2></div><Icon name="flag"/></div>{plans.slice().reverse().map(plan => {
    const topic = topics.find(t => t.id === plan.topic)!;
    const progress = lessonProgress(workspace, plan, studentId);
    return <article className="assignment-row" key={plan.id}><span className={`topic-symbol ${topic.color}`}>{topic.symbol}</span><div><strong>{topic.name} · {topic.activity}</strong><p>{progress.status} · {progress.solved} of {progress.total} questions understood</p><div className="progress-track"><i style={{ width: `${progress.solved / progress.total * 100}%` }}/></div></div><button className="btn btn-dark" onClick={() => setSelected(plan)}>{progress.status === "Completed" ? "Review conversation" : progress.status === "In progress" ? "Continue lesson" : "Start my lesson"}<Icon name="arrow" size={17}/></button></article>;
  })}{selected && <Practice key={selected.id} workspace={workspace} topicId={selected.topic} planId={selected.id} sessions={workspace.sessions} mutate={mutate} onClose={() => setSelected(null)}/>}</section>;
}
