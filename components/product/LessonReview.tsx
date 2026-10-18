"use client";
import { useId, useState } from "react";
import { topicById } from "@/lib/product/curriculum";
import { summarizeLesson } from "@/lib/product/insights";
import type { CoachSession, Workspace } from "@/lib/product/model";
import { Avatar, Modal } from "./Shared";
import { Icon } from "./Brand";

export function LessonReview({ session, workspace, onClose, initialTab = "summary" }: { session: CoachSession; workspace: Workspace; onClose: () => void; initialTab?: "summary" | "conversation" }) {
  const [tab, setTab] = useState<"summary" | "conversation">(initialTab);
  const id = useId();
  const learner = workspace.students.find(s => s.id === session.studentId);
  const topic = topicById(session.topic);
  const summary = summarizeLesson(workspace, session);
  return <Modal title={`${learner?.name ?? "Student"} · Lesson review`} onClose={onClose} wide className="lesson-review-dialog">
    {summary.safety && <section className="safety-review" aria-label="Flagged safety messages"><h2>Safety concern · Review first</h2><p>Check in personally and follow your school’s safeguarding process. No external notification was sent.</p>{session.messages.flatMap((message, index) => message.kind === "safety" && session.messages[index - 1]?.role === "student" ? [<blockquote key={message.id}><strong>{learner?.name ?? "Student"}</strong><p>{session.messages[index - 1].text}</p><time dateTime={message.at}>{new Date(message.at).toLocaleString("en-US")}</time></blockquote>] : [])}</section>}
    <div className="review-student-bar"><Avatar name={learner?.name ?? "Student"} id={learner?.id} color={learner?.avatar}/><div><strong>{topic.name} {session.refresherFor ? "refresher" : session.planId ? "lesson" : "practice"}</strong><span>{session.completedAt ? "Completed" : "In progress"} · {summary.solved}/{summary.total} questions understood</span></div><span className="summary-disclosure">Evidence summary</span></div>
    <div className="review-tabs" role="tablist" aria-label="Lesson review sections">{(["summary", "conversation"] as const).map(value => <button key={value} id={`${id}-${value}-tab`} role="tab" aria-selected={tab === value} aria-controls={`${id}-${value}`} onClick={() => setTab(value)}>{value === "summary" ? "Lesson summary" : `Conversation (${session.messages.length})`}</button>)}</div>
    <section className="review-panel" role="tabpanel" id={`${id}-${tab}`} aria-labelledby={`${id}-${tab}-tab`} tabIndex={0}>
      {tab === "summary" ? <div className="lesson-summary"><span className="eyebrow">What happened in this lesson</span><p>{summary.overview}</p><div className="summary-metrics"><span><strong>{summary.solved}/{summary.total}</strong> understood</span><span><strong>{summary.corrected}</strong> corrected after retry</span><span><strong>{summary.nudges + summary.explanations}</strong> support moments</span></div><dl><div><dt>Where they needed help</dt><dd>{summary.challenge}</dd></div><div><dt>How Rova responded</dt><dd>{summary.support}</dd></div><div><dt>Your next step</dt><dd>{summary.nextStep}</dd></div></dl>{summary.firstResponse && <div className="summary-quotes"><blockquote><span>First response</span><p>“{summary.firstResponse.text}”</p></blockquote>{summary.lastResponse?.id !== summary.firstResponse.id && <blockquote><span>Latest response</span><p>“{summary.lastResponse?.text}”</p></blockquote>}</div>}<small>Built from saved lesson evidence. Completion is not a long-term mastery assessment.</small><button className="btn btn-dark" onClick={() => setTab("conversation")}>Read full conversation<Icon name="arrow" size={17}/></button></div>
      : <div className="review-conversation" aria-label={`Conversation between ${learner?.name ?? "student"} and Rova`}>{session.messages.map(message => <article className={`coach-message ${message.role} ${message.kind ?? ""}`} key={message.id}><span>{message.role === "coach" ? "Rova" : learner?.name ?? "Student"}<time>{new Date(message.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</time></span><p>{message.text}</p>{message.source && <small>Lesson reference · {message.source}</small>}</article>)}</div>}
    </section>
  </Modal>;
}
