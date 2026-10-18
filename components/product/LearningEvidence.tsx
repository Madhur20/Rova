"use client";
import { useState } from "react";
import { topicById, topics } from "@/lib/product/curriculum";
import { lessonProgress, topicOutcomes } from "@/lib/product/coaching";
import type { CoachSession, Workspace } from "@/lib/product/model";
import { Icon } from "./Brand";
import { Avatar, Empty } from "./Shared";
import { summarizeLesson } from "@/lib/product/insights";
import { LessonReview } from "./LessonReview";

export function ConversationEvidence({ session, workspace }: { session: CoachSession; workspace: Workspace }) {
  const [reviewing, setReviewing] = useState(false);
  const summary = summarizeLesson(workspace, session);
  return <div className="lesson-review-entry">
    <div><strong>{topicById(session.topic).name}{session.refresherFor ? " refresher" : ""} · {session.completedAt ? "Completed" : "In progress"}</strong><small>{summary.solved}/{summary.total} understood · {summary.corrected} corrected after retry · {session.messages.length} messages</small></div>
    <button className="btn btn-outline" onClick={() => setReviewing(true)}>Review lesson<Icon name="chevron" size={15}/></button>
    {reviewing && <LessonReview session={session} workspace={workspace} onClose={() => setReviewing(false)}/>}
  </div>;
}

export function ClassroomLearningChart({ workspace }: { workspace: Workspace }) {
  const outcomes = topics.map(topic => ({ ...topic, ...topicOutcomes(workspace, topic.id) }));
  const corrections = outcomes.reduce((sum, t) => sum + t.corrected, 0);
  const live = outcomes.reduce((sum, t) => sum + t.total, 0);
  return <section className="surface classroom-learning"><div className="section-heading"><div><h2>Answers by topic</h2><p>First tries, supported successes, and questions still in progress.</p></div><div className="correction-stat"><strong>{corrections}</strong><span>questions corrected<br/>after a retry</span></div></div><div className="outcome-legend"><span><i className="independent"/>Solved independently</span><span><i className="coached"/>Solved after support or retry</span><span><i className="practicing"/>Still practicing</span></div>{outcomes.map(t => <div className="outcome-row" key={t.id}><strong>{t.name}</strong><div className="outcome-track" role="img" aria-label={`${t.name}: ${t.independent} independent, ${t.supported} after support or retry, ${t.practicing} still practicing`}>{t.total ? <>{(["independent", "supported", "practicing"] as const).filter(key => t[key] > 0).map(key => <span key={key} className={key === "supported" ? "coached" : key} style={{ flexGrow: t[key] }}>{t[key]}</span>)}</> : <small>Waiting for practice</small>}</div><span>{t.total} questions</span></div>)}<p className="data-caption">{live ? "Live practice only; seeded history is excluded. Each learner–question–session counts once. A retry stays visible when the question is later corrected." : "Start a student lesson to see real progress here. Sample confidence scores are deliberately excluded from this graph."}</p></section>;
}

export function LessonMonitor({ workspace, onCreate }: { workspace: Workspace; onCreate: () => void }) {
  return <section className="surface lesson-monitor"><div className="section-heading"><div><h2>Group lessons</h2><p>A lesson is complete when the learner has solved all three questions.</p></div><button className="btn btn-dark" onClick={onCreate}><Icon name="plus" size={17}/>Create a lesson</button></div>{!workspace.plans.length && <Empty title="Start with a shared learning need." text="Choose a topic and send a focused lesson to a small group."/>}{workspace.plans.slice().reverse().map(plan => {
    const topic = topics.find(t => t.id === plan.topic)!;
    const learners = plan.studentIds.map(id => ({ student: workspace.students.find(s => s.id === id)!, progress: lessonProgress(workspace, plan, id) })).filter(item => item.student);
    const completed = learners.filter(l => l.progress.status === "Completed").length;
    return <article className="lesson-card" key={plan.id}><header><span className={`topic-symbol ${topic.color}`}>{topic.symbol}</span><div><h3>{topic.name} refresher</h3><p>{topic.activity} · {new Date(plan.at).toLocaleDateString()}</p></div><strong>{completed} / {learners.length} completed</strong></header><div className="progress-track strong"><i style={{ width: `${completed / Math.max(1, learners.length) * 100}%` }}/></div><div className="lesson-roster">{learners.map(({ student, progress }) => <div className="lesson-learner" key={student.id}><div className="lesson-learner-heading"><Avatar name={student.name} id={student.id} color={student.avatar} small/><strong>{student.name}</strong><span className={`status-pill ${progress.status === "Completed" ? "strong" : progress.status === "In progress" ? "growing" : "unstarted"}`}>{progress.status}</span><span>{progress.solved} / {progress.total} understood</span></div>{progress.sessions.map(session => <ConversationEvidence key={session.id} workspace={workspace} session={session}/>)}</div>)}</div></article>;
  })}</section>;
}
