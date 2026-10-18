import { questions, topicById, type TopicId } from "./curriculum";
import { scoreFor, type CoachSession, type Learner, type RootCauseTrace, type Workspace } from "./model";

// The skill map: a struggle in the key topic usually starts in the earlier skill.
// Detection is plain code over checked attempts; no model decides where a gap started.
export const prerequisiteOf: Partial<Record<TopicId, TopicId>> = { ratios: "fractions" };
export const MISSES_BEFORE_TRACE = 2;
// How the earlier skill is named to learners and families.
export const skillPhrase: Partial<Record<TopicId, string>> = { fractions: "equivalent fractions" };
export function skillName(topic: TopicId): string { const phrase = skillPhrase[topic] ?? topicById(topic).name; return phrase[0].toUpperCase() + phrase.slice(1); }
export const reteachFor: Partial<Record<TopicId, string>> = {
  fractions: "Fold a paper strip into halves, then fourths: more pieces, same amount. Then show 2 : 3 and 6 : 9 as the same recipe made three times bigger.",
};

export function detectRootCause(workspace: Workspace, session: CoachSession, at: string): RootCauseTrace | undefined {
  const prerequisite = prerequisiteOf[session.topic];
  if (!prerequisite || session.trace) return;
  const q = questions.filter(item => item.topic === session.topic)[session.questionIndex];
  const misses = workspace.attempts.filter(a => a.sessionId === session.id && a.questionId === q.id && !a.correct);
  if (misses.length < MISSES_BEFORE_TRACE) return;
  // Attempt ids are the student's message ids, so the evidence is their own words.
  const wrongAnswers = misses.map(a => session.messages.find(m => m.id === a.id)?.text ?? "").filter(Boolean);
  return { prerequisite, standard: topicById(prerequisite).standard, questionId: q.id, wrongAnswers, at };
}

export type TraceStatus = "Refresher suggested" | "Refresher in progress" | "Refresher completed" | "Solved after refresher" | "Solved without refresher";
export function traceStatus(trace: RootCauseTrace): TraceStatus {
  if (trace.fixedAt) return trace.refresherCompletedAt ? "Solved after refresher" : "Solved without refresher";
  if (trace.refresherCompletedAt) return "Refresher completed";
  return trace.refresherSessionId ? "Refresher in progress" : "Refresher suggested";
}

export function tracedSessions(workspace: Workspace): (CoachSession & { trace: RootCauseTrace })[] {
  return (workspace.sessions ?? []).filter((s): s is CoachSession & { trace: RootCauseTrace } => !!s.trace);
}

// Classmates whose current confidence in the earlier skill is also low (may include simulated profiles).
export function classmatesWithGap(workspace: Workspace, studentId: string, topic: TopicId): Learner[] {
  return workspace.students.filter(s => { if (s.id === studentId) return false; const score = scoreFor(s, topic, workspace.attempts); return score !== null && score < 60; });
}
