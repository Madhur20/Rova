"use client";
import { useState } from "react";
import { topicById, type TopicId } from "@/lib/product/curriculum";
import { classifyMistake } from "@/lib/product/mistakes";
import type { Learner, Workspace } from "@/lib/product/model";
import { currentUnit, planImpact, statusLabel, studentStatus } from "@/lib/product/progress";
import { traceStatus } from "@/lib/product/rootCause";
import { nextStepFor, whyFor, type Evidence } from "@/lib/product/why";
import { Icon } from "./Brand";
import { ConfidenceChart, StatusBadge } from "./charts";
import { ConversationEvidence } from "./LearningEvidence";
import { Avatar, Modal, type Mutate } from "./Shared";

const evidenceLabel: Record<Evidence, string> = {
  live: "From live practice",
  simulated: "Starting profile",
  "skill map": "Skill-map link",
};

export function EvidenceTag({ evidence }: { evidence: Evidence }) {
  return <span className={`evidence-tag evidence-${evidence.replace(" ", "-")}`}>{evidenceLabel[evidence]}</span>;
}

// Every live answer as a chip: first try, after a hint, or a named mistake.
function AnswerTimeline({ workspace, student }: { workspace: Workspace; student: Learner }) {
  const sessions = workspace.sessions ?? [];
  const answers = workspace.attempts
    .filter((a) => a.studentId === student.id && !a.id.startsWith("sample-"))
    .slice(-12);
  if (!answers.length)
    return <p className="quiet">No live answers yet. The trend above uses this learner’s starting profile.</p>;
  return (
    <ol className="answer-timeline">
      {answers.map((a) => {
        const text = sessions.flatMap((s) => s.messages).find((m) => m.id === a.id)?.text ?? "";
        const mistake = a.correct ? undefined : classifyMistake(a.questionId, text.replace(/[^\d/.,-]/g, ""));
        const kind = a.correct ? (a.hints ? "helped" : "first-try") : "miss";
        const label = a.correct ? (a.hints ? "Correct after a hint" : "Correct on first try") : (mistake?.label ?? "Not yet");
        return (
          <li key={a.id} className={`answer-chip answer-${kind}`} title={`${topicById(a.topic).name}: ${label}`}>
            <span aria-hidden="true">{a.correct ? "✓" : "✕"}</span>
            <span>
              <strong>{text ? `“${text}”` : topicById(a.topic).short}</strong>
              <small>{label}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function StudentInsight({
  workspace,
  student,
  onClose,
  onAssign,
  mutate,
  onShared,
}: {
  workspace: Workspace;
  student: Learner;
  onClose: () => void;
  onAssign: (topic: TopicId, studentIds: string[]) => void;
  mutate: Mutate;
  onShared: (message: string) => void;
}) {
  const status = studentStatus(student, workspace);
  const [topic, setTopic] = useState<TopicId | null>(status.focus?.topic ?? null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = status.topics.find((t) => t.topic === topic) ?? status.topics[0];
  const unit = currentUnit();
  const facts = whyFor(workspace, student, status, 4);
  const name = student.name.split(" ")[0];
  const plans = workspace.plans.filter((p) => p.studentIds.includes(student.id));
  const traces = (workspace.sessions ?? []).filter((s) => s.studentId === student.id && s.trace);
  const sessions = (workspace.sessions ?? []).filter((s) => s.studentId === student.id);
  return (
    <Modal title={`${name}’s progress`} onClose={onClose} wide className="insight-dialog">
      <div className="insight">
        <header className="insight-head">
          <Avatar name={student.name} id={student.id} color={student.avatar} />
          <div>
            <h3>{student.name}</h3>
            <p>
              <StatusBadge status={status.status} />
              {status.focus && (
                <span>
                  {topicById(status.focus.topic).name}: {status.focus.reason}
                </span>
              )}
            </p>
          </div>
          {status.focus && status.status !== "on_track" && (
            <button className="btn btn-dark" onClick={() => onAssign(status.focus!.topic, [student.id])}>
              Assign a {topicById(status.focus.topic).name.toLowerCase()} lesson
              <Icon name="arrow" size={16} />
            </button>
          )}
        </header>

        <div className="insight-grid">
          <section aria-labelledby="insight-why">
            <h4 id="insight-why">What’s behind it</h4>
            {facts.length ? (
              <ul className="fact-list">
                {facts.map((f, i) => (
                  <li key={i} className={`fact fact-${f.kind}`}>
                    <strong>{f.title}</strong>
                    <p>{f.detail}</p>
                    <EvidenceTag evidence={f.evidence} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="quiet">On track in every topic.</p>
            )}
            <div className="next-step">
              <span>Next step</span>
              <p>{nextStepFor(workspace, student, status)}</p>
            </div>
          </section>

          <section aria-labelledby="insight-topics">
            <h4 id="insight-topics">By topic</h4>
            <div className="topic-status-list" role="radiogroup" aria-label="Choose a topic for the chart">
              {status.topics.map((t) => (
                <button
                  key={t.topic}
                  role="radio"
                  aria-checked={t.topic === selected.topic}
                  className={t.topic === selected.topic ? "is-selected" : ""}
                  onClick={() => setTopic(t.topic)}
                >
                  <span>{topicById(t.topic).name}</span>
                  <strong>{t.score === null ? "—" : `${t.score}%`}</strong>
                  <StatusBadge status={t.status} />
                </button>
              ))}
            </div>
            <ConfidenceChart
              title={`${name}’s ${topicById(selected.topic).name.toLowerCase()} confidence`}
              points={selected.points}
              unitStart={unit.start}
              unitEnd={unit.end}
              projected={selected.projected}
            />
            <p className="chart-reason">
              <strong>{statusLabel[selected.status]}.</strong> {selected.reason}
            </p>
          </section>
        </div>

        <section aria-labelledby="insight-answers">
          <h4 id="insight-answers">Recent answers</h4>
          <AnswerTimeline workspace={workspace} student={student} />
        </section>

        {(plans.length > 0 || traces.length > 0) && (
          <section aria-labelledby="insight-interventions">
            <h4 id="insight-interventions">What was tried</h4>
            <ul className="intervention-list">
              {plans.map((plan) => {
                const impact = planImpact(workspace, plan);
                const me = impact.members.find((m) => m.student.id === student.id);
                return (
                  <li key={plan.id}>
                    <strong>{topicById(plan.topic).name} group lesson</strong>
                    <span>{new Date(plan.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span>
                      {me?.practiced
                        ? `${me.before ?? "—"}% → ${me.after ?? "—"}%`
                        : "No practice since it was assigned"}
                    </span>
                  </li>
                );
              })}
              {traces.map((s) => (
                <li key={s.id}>
                  <strong>{topicById(s.trace!.prerequisite).name} refresher</strong>
                  <span>{new Date(s.trace!.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <span>{traceStatus(s.trace!)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {sessions.length > 0 && (
          <section aria-labelledby="insight-lessons">
            <h4 id="insight-lessons">Lessons</h4>
            {sessions
              .slice()
              .reverse()
              .map((s) => (
                <ConversationEvidence key={s.id} workspace={workspace} session={s} />
              ))}
          </section>
        )}

        <form
          className="family-note-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const result = await mutate({ action: "note", studentId: student.id, text: note });
            if (result) {
              setNote("");
              onShared(`Family update for ${name} shared.`);
              onClose();
            }
            setBusy(false);
          }}
        >
          <label htmlFor="family-note">Message {name}’s family</label>
          <textarea
            id="family-note"
            required
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A win, a next step, or a way to help at home"
          />
          <button className="btn btn-dark" disabled={busy || !note.trim()}>
            Share
            <Icon name="arrow" size={16} />
          </button>
        </form>
      </div>
    </Modal>
  );
}
