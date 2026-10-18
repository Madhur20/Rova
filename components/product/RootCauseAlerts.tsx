"use client";
import { useState } from "react";
import { questions, topicById, type TopicId } from "@/lib/product/curriculum";
import type { Workspace } from "@/lib/product/model";
import { classmatesWithGap, reteachFor, skillName, traceStatus, tracedSessions } from "@/lib/product/rootCause";
import { Icon } from "./Brand";
import { Avatar, type Mutate } from "./Shared";
import { LessonReview } from "./LessonReview";

export function RootCauseAlerts({ workspace, mutate, onGroup }: { workspace: Workspace; mutate: Mutate; onGroup: (topic: TopicId, studentIds: string[]) => void }) {
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const traced = tracedSessions(workspace).slice().reverse();
  const review = traced.find(s => s.id === reviewId);
  if (!traced.length) return null;
  return <section className="surface root-cause-alerts" aria-label="Learning alerts">
    <div className="section-heading"><div><span className="eyebrow">Learning alerts · Found by Rova’s skill map</span><h2>Why they’re stuck, and what to do next.</h2><p>Two checked misses on one question trigger a trace back to the earlier skill.</p></div></div>
    {traced.map(session => {
      const { trace } = session;
      const learner = workspace.students.find(s => s.id === session.studentId);
      const topic = topicById(session.topic), earlier = topicById(trace.prerequisite);
      const question = questions.find(q => q.id === trace.questionId);
      const others = classmatesWithGap(workspace, session.studentId, trace.prerequisite);
      const status = traceStatus(trace);
      return <article className="root-cause-card" key={session.id}>
        <header><Avatar name={learner?.name ?? "Learner"} id={learner?.id} color={learner?.avatar}/><div><strong>{learner?.name ?? "Learner"}</strong><span>Stuck on {topic.name.toLowerCase()} ({topic.standard}) · {new Date(trace.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span></div><span className={`status-pill ${trace.fixedAt ? "strong" : "growing"}`}>{status}</span></header>
        <dl>
          <div><dt>Root cause</dt><dd><strong>{skillName(trace.prerequisite)} · {earlier.standard}</strong></dd></div>
          <div><dt>Evidence</dt><dd>“{question?.prompt}” Answered {trace.wrongAnswers.map(a => `“${a}”`).join(" then ")}; both checked incorrect by code.</dd></div>
          {reteachFor[trace.prerequisite] && <div><dt>5-minute reteach</dt><dd>{reteachFor[trace.prerequisite]}</dd></div>}
          <div><dt>Family</dt><dd>An update with a 10-minute at-home activity was saved to the family’s Rova page{trace.fixedAt ? ", plus a win message" : ""}. No text or email is sent.</dd></div>
          <div><dt>Re-check</dt><dd>{trace.fixedAt ? "Solved the original question today. A follow-up check after 7 days is planned, not built." : "Waiting for the learner to return to the original question."}</dd></div>
        </dl>
        <footer>
          {others.length > 0 && <span className="avatar-stack" title={others.map(s => s.name).join(", ")}>{others.slice(0, 5).map(s => <Avatar key={s.id} name={s.name} id={s.id} color={s.avatar} small/>)}<small>{others.length} classmates share a low {earlier.name.toLowerCase()} signal</small></span>}
          {others.length > 0 && <button className="btn btn-dark" onClick={() => onGroup(trace.prerequisite, [session.studentId, ...others.map(s => s.id)])}>Share a {earlier.name.toLowerCase()} refresher with this group<Icon name="arrow" size={16}/></button>}
          <button className="btn btn-outline" onClick={() => setReviewId(session.id)}>Review conversation</button>
          {trace.acknowledgedAt ? <span className="quiet"><Icon name="check" size={15}/> Reteach planned</span> : <button className="btn btn-outline" disabled={busy} onClick={async () => { setBusy(true); await mutate({ action: "trace-ack", sessionId: session.id }); setBusy(false); }}>Mark reteach planned</button>}
        </footer>
      </article>;
    })}
    <p className="data-caption">Classmate signals include starting profiles. A trace is a lead for your judgment, not a diagnosis.</p>
    {review && <LessonReview key={review.id} session={review} workspace={workspace} onClose={() => setReviewId(null)}/>}
  </section>;
}
