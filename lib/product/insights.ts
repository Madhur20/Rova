import { topicById, topics } from "./curriculum";
import { sessionQuestions } from "./coaching";
import { skillPhrase } from "./rootCause";
import { scoreFor, type CoachSession, type Learner, type Workspace } from "./model";

export function supportTopics(student: Learner, workspace: Workspace) {
  return topics.filter(topic => { const score = scoreFor(student, topic.id, workspace.attempts); return score !== null && score < 60; });
}

export function familyActivities(workspace: Workspace, parentId: string, child: Learner) {
  // A root cause Rova traced comes first; the automatic family update points to its activity.
  const traced = new Set((workspace.sessions ?? []).filter(s => s.studentId === child.id && s.trace).map(s => s.trace!.prerequisite));
  const ordered = topics.map(topic => ({ ...topic, score: scoreFor(child, topic.id, workspace.attempts), done: topic.steps.every((_, i) => workspace.checks.includes(`${parentId}:${topic.id}-${i}`)) }))
    .sort((a, b) => Number(traced.has(b.id)) - Number(traced.has(a.id)) || (a.score ?? -1) - (b.score ?? -1));
  return { next: ordered.find(topic => !topic.done), completed: ordered.filter(topic => topic.done) };
}

// A transparent, deterministic stand-in for an AI lesson summary. Every claim is
// derived from the saved session; never invent understanding or a causal outcome.
export function summarizeLesson(workspace: Workspace, session: CoachSession) {
  const attempts = workspace.attempts.filter(a => a.sessionId === session.id);
  const set = sessionQuestions(workspace, session);
  const solved = set.filter(q => attempts.some(a => a.questionId === q.id && a.correct));
  const corrected = set.filter(q => {
    const turns = attempts.filter(a => a.questionId === q.id);
    return turns.some((a, i) => a.correct && turns.slice(0, i).some(previous => !previous.correct));
  });
  const independent = solved.filter(q => {
    const first = attempts.find(a => a.questionId === q.id);
    return first?.correct && !first.hints;
  });
  const nudges = session.messages.filter(m => m.kind === "hint" || m.kind === "retry").length;
  const explanations = session.messages.filter(m => m.kind === "explain").length;
  const redirects = session.messages.filter(m => m.kind === "guardrail").length;
  const safety = session.messages.some(m => m.kind === "safety");
  const student = workspace.students.find(s => s.id === session.studentId);
  const name = student?.name.split(" ")[0] ?? "The learner";
  const topic = topicById(session.topic);
  const earlier = session.trace ? topicById(session.trace.prerequisite) : undefined;
  const misconceptions = session.messages.filter(m => m.kind === "retry").map(m => m.text);
  const firstResponse = session.messages.find(m => m.role === "student");
  const lastResponse = [...session.messages].reverse().find(m => m.role === "student");
  return {
    solved: solved.length, total: set.length, independent: independent.length, corrected: corrected.length,
    nudges, explanations, redirects, safety, firstResponse, lastResponse,
    overview: attempts.length
      ? `${name} worked on ${topic.name.toLowerCase()} and solved ${solved.length} of ${set.length} questions. ${independent.length} ${independent.length === 1 ? "was" : "were"} solved on the first try without prior support; ${corrected.length} ${corrected.length === 1 ? "was" : "were"} corrected after a retry.`
      : `${name} opened a ${topic.name.toLowerCase()} lesson. No answers have been checked yet.`,
    challenge: safety ? "A personal safety concern was flagged. Review the conversation and check in with the learner."
      : earlier ? `Two checked misses on one ${topic.name.toLowerCase()} question were traced to an earlier skill: ${skillPhrase[earlier.id] ?? earlier.name.toLowerCase()} (${earlier.standard}).`
      : misconceptions.some(text => text.includes("original pieces")) ? "The first garden response suggests confusion between the original halves and the smaller fourths."
      : attempts.some(a => !a.correct) ? `Some ${topic.name.toLowerCase()} answers needed another attempt. Review the question-by-question evidence before choosing a refresher.`
      : "No incorrect checked answers recorded in this lesson so far.",
    support: `Guiding hints and retry nudges: ${nudges}. Concept explanations: ${explanations}. Answer-request or off-topic redirects: ${redirects}. The full conversation shows each support step.`,
    nextStep: safety ? "Prioritize a personal check-in before more math practice."
      : earlier && !session.trace?.fixedAt ? `Check that ${name} finishes the ${earlier.name.toLowerCase()} refresher, then returns to the ${topic.name.toLowerCase()} question.`
      : solved.length === set.length ? `Ask ${name} to explain an example of ${topic.name.toLowerCase()} without the coach, then use a fresh problem to check transfer.`
      : `Resume the lesson with ${name} and work through the remaining ${set.length - solved.length} question${set.length - solved.length === 1 ? "" : "s"}.`,
  };
}
