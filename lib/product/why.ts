// "Why" insights: the facts behind a learner's status, found by plain code from saved evidence.
// Nothing here is written by a model. Each fact says where it came from, so a teacher can tell
// live evidence from a simulated starting history or a skill-map link.

import { topicById, topics, type TopicId } from "./curriculum";
import { classifyMistake } from "./mistakes";
import { scoreFor, type CoachSession, type Learner, type Workspace } from "./model";
import { classStatuses, currentUnit, statusLabel, studentStatus, TARGET, type Status, type StudentStatus } from "./progress";
import { reteachFor, skillName } from "./rootCause";

export type Evidence = "live" | "simulated" | "skill map";
export interface Fact {
  kind:
    | "safety"
    | "root-cause"
    | "repeated-mistake"
    | "hint-reliance"
    | "answer-seeking"
    | "trend"
    | "linked-gap"
    | "practice"
    | "strength";
  title: string;
  detail: string;
  topic?: TopicId;
  evidence: Evidence;
}

// Which earlier grade 4 skill each topic leans on (used only to suggest where a gap may start).
export const buildsOn: Partial<Record<TopicId, TopicId>> = {
  fractions: "multiplication",
  division: "multiplication",
  measurement: "multiplication",
  multiplication: "place-value",
  ratios: "fractions",
};

const first = (student: Learner) => student.name.split(" ")[0];
const sessionsOf = (workspace: Workspace, id: string) =>
  (workspace.sessions ?? []).filter((s) => s.studentId === id);

// Wrong answers in coached sessions that match a known mistake, grouped by mistake.
export function repeatedMistakes(workspace: Workspace, studentId: string) {
  const found = new Map<string, { topic: TopicId; label: string; why: string; answers: string[] }>();
  for (const session of sessionsOf(workspace, studentId)) {
    for (const attempt of workspace.attempts.filter((a) => a.sessionId === session.id && !a.correct)) {
      const text = session.messages.find((m) => m.id === attempt.id)?.text ?? "";
      const mistake = classifyMistake(attempt.questionId, text.replace(/[^\d/.,-]/g, ""));
      if (!mistake) continue;
      const key = `${attempt.topic}:${mistake.label}`;
      const entry = found.get(key) ?? { topic: attempt.topic, label: mistake.label, why: mistake.why, answers: [] };
      entry.answers.push(text.trim());
      found.set(key, entry);
    }
  }
  return [...found.values()].sort((a, b) => b.answers.length - a.answers.length);
}

// Topics where most correct answers came only after hints.
export function hintReliance(workspace: Workspace, studentId: string) {
  return topics
    .map((t) => {
      const correct = workspace.attempts.filter(
        (a) => a.studentId === studentId && a.topic === t.id && a.correct && !a.id.startsWith("sample-"),
      );
      const helped = correct.filter((a) => a.hints > 0).length;
      return { topic: t.id, correct: correct.length, helped };
    })
    .filter((t) => t.correct >= 3 && t.helped / t.correct >= 0.6);
}

const hasSafety = (session: CoachSession) => session.messages.some((m) => m.kind === "safety");

export function studentFacts(workspace: Workspace, student: Learner, status = studentStatus(student, workspace)): Fact[] {
  const facts: Fact[] = [];
  const name = first(student);
  const sessions = sessionsOf(workspace, student.id);
  if (sessions.some(hasSafety))
    facts.push({
      kind: "safety",
      title: "Needs a personal check-in",
      detail: `${name} wrote something in a lesson that may need a check-in. Read the conversation first.`,
      evidence: "live",
    });
  for (const session of sessions.filter((s) => s.trace)) {
    const trace = session.trace!;
    facts.push({
      kind: "root-cause",
      title: `Gap traced to ${skillName(trace.prerequisite).toLowerCase()}`,
      detail: `${topicById(session.topic).name} answers ${trace.wrongAnswers.map((a) => `“${a}”`).join(" and ")} point back to ${skillName(trace.prerequisite).toLowerCase()} (${trace.standard}).${trace.fixedAt ? " Solved after the refresher." : ""}`,
      topic: trace.prerequisite,
      evidence: "live",
    });
  }
  for (const m of repeatedMistakes(workspace, student.id).filter((m) => m.answers.length >= 2).slice(0, 2))
    facts.push({
      kind: "repeated-mistake",
      title: `Same ${topicById(m.topic).name.toLowerCase()} mistake ${m.answers.length} times`,
      detail: `${m.label}: ${m.why}`,
      topic: m.topic,
      evidence: "live",
    });
  for (const h of hintReliance(workspace, student.id).slice(0, 1))
    facts.push({
      kind: "hint-reliance",
      title: `Solves ${topicById(h.topic).name.toLowerCase()} after hints`,
      detail: `${h.helped} of ${h.correct} correct answers came after a hint. ${name} understands with support, not yet alone.`,
      topic: h.topic,
      evidence: "live",
    });
  const redirects = sessions.flatMap((s) => s.messages).filter((m) => m.kind === "guardrail").length;
  if (redirects >= 2)
    facts.push({
      kind: "answer-seeking",
      title: "Asks for answers",
      detail: `Asked Rova for the answer ${redirects} times instead of trying a step.`,
      evidence: "live",
    });
  const focus = status.focus;
  if (focus && focus.status !== "on_track") {
    const simulated = focus.points.some((p) => p.simulated);
    facts.push({
      kind: "trend",
      title: `${topicById(focus.topic).name}: ${statusLabel[focus.status].toLowerCase()}`,
      detail: focus.reason,
      topic: focus.topic,
      evidence: simulated ? "simulated" : "live",
    });
    const base = buildsOn[focus.topic];
    const baseScore = base ? scoreFor(student, base, workspace.attempts) : null;
    if (base && baseScore !== null && baseScore < TARGET)
      facts.push({
        kind: "linked-gap",
        title: `${topicById(base).name} is also below target`,
        detail: `${topicById(base).name} is at ${baseScore}%. ${topicById(focus.topic).name} builds on it, so the gap may start there.`,
        topic: base,
        evidence: "skill map",
      });
  }
  const strongest = status.topics
    .filter((t) => t.score !== null && t.score >= 80)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  if (strongest)
    facts.push({
      kind: "strength",
      title: `Strong in ${topicById(strongest.topic).name.toLowerCase()}`,
      detail: `At ${strongest.score}%.`,
      topic: strongest.topic,
      evidence: strongest.points.some((p) => p.simulated) ? "simulated" : "live",
    });
  return facts;
}

// The top reasons for a learner's status, most important first (strengths left out).
export function whyFor(workspace: Workspace, student: Learner, status?: StudentStatus, limit = 3): Fact[] {
  return studentFacts(workspace, student, status)
    .filter((f) => f.kind !== "strength")
    .slice(0, limit);
}

// One concrete next step for the teacher, chosen from the most important fact.
export function nextStepFor(workspace: Workspace, student: Learner, status = studentStatus(student, workspace)): string {
  const facts = studentFacts(workspace, student, status);
  const name = first(student);
  const top = facts.find((f) => f.kind !== "strength");
  const topic = top?.topic ? topicById(top.topic) : status.focus ? topicById(status.focus.topic) : undefined;
  switch (top?.kind) {
    case "safety":
      return `Check in with ${name} privately before more math.`;
    case "root-cause":
      return reteachFor[top.topic!] ?? `Reteach ${topic!.name.toLowerCase()} with a short hands-on activity.`;
    case "repeated-mistake":
      return `Show ${name} one worked example that contrasts the mistake with the right move, then a fresh problem.`;
    case "hint-reliance":
      return `Ask ${name} for a first try before offering the picture, so hints fade.`;
    case "answer-seeking":
      return `Sit with ${name} for the first question so they try a step before asking.`;
    case "trend":
      return status.status === "stagnant"
        ? `Spend 3 minutes with ${name} on ${topic!.name.toLowerCase()} to find the sticking point, then assign a lesson.`
        : `Add one short ${topic!.name.toLowerCase()} practice this week to close the gap in time.`;
    case "linked-gap":
      return `Start with ${topic!.name.toLowerCase()}: a quick refresher may unblock the topic built on it.`;
    default:
      return `Keep going. Offer the grade 6 ratio challenge as a stretch.`;
  }
}

export interface Priority {
  student: Learner;
  reason: string;
}
// Who needs the teacher today: open safety concerns, unsolved root-cause gaps not yet acknowledged, and
// stagnant learners. Each learner appears once, with the most urgent reason.
export function needYouToday(workspace: Workspace, statuses = classStatuses(workspace)): Priority[] {
  const out = new Map<string, Priority>();
  for (const session of workspace.sessions ?? []) {
    const student = workspace.students.find((s) => s.id === session.studentId);
    if (!student) continue;
    if (hasSafety(session)) out.set(student.id, { student, reason: "Safety concern" });
    else if (session.trace && !session.trace.acknowledgedAt && !session.trace.fixedAt && !out.has(student.id))
      out.set(student.id, { student, reason: `Root cause: ${skillName(session.trace.prerequisite).toLowerCase()}` });
  }
  for (const s of statuses.filter((s) => s.status === "stagnant"))
    if (!out.has(s.student.id))
      out.set(s.student.id, { student: s.student, reason: `Stagnant in ${topicById(s.focus!.topic).name.toLowerCase()}` });
  return [...out.values()];
}

// The topic to reteach tomorrow: where the most learners are stagnant (counted twice) or behind,
// with the most common known mistake as the reason when there is live evidence.
export function topReteach(workspace: Workspace, statuses = classStatuses(workspace)) {
  const scored = topics
    .map((t) => {
      const stuck = statuses.filter((s) => s.topics.find((x) => x.topic === t.id)?.status === "stagnant");
      const behind = statuses.filter((s) => s.topics.find((x) => x.topic === t.id)?.status === "behind");
      return { topic: t, students: [...stuck, ...behind].map((s) => s.student), weight: stuck.length * 2 + behind.length };
    })
    .sort((a, b) => b.weight - a.weight);
  const best = scored[0];
  if (!best || !best.weight) return null;
  const tracedSessions = (workspace.sessions ?? []).filter((s) => s.trace?.prerequisite === best.topic.id);
  const traced = new Set(tracedSessions.map((s) => s.studentId)).size;
  const harder = tracedSessions[0] ? topicById(tracedSessions[0].topic).name.toLowerCase() : "";
  const mistake = workspace.students
    .flatMap((s) => repeatedMistakes(workspace, s.id))
    .filter((m) => m.topic === best.topic.id)
    .sort((a, b) => b.answers.length - a.answers.length)[0];
  const reason = traced
    ? `Also the root cause for ${traced} learner${traced === 1 ? "" : "s"} stuck on ${harder}`
    : mistake
      ? `Most common mistake: ${mistake.label.toLowerCase()}`
      : `${best.students.length} learners behind or stagnant`;
  return { topic: best.topic, students: best.students, reason };
}

// Plain words for families.
export const familyLabel: Record<Status, string> = {
  on_track: "Doing well",
  behind: "Catching up",
  stagnant: "Needs extra help",
  no_data: "Just getting started",
};

// Days with live practice in the last week (simulated history excluded).
export function practiceDays(workspace: Workspace, studentId: string, now = new Date()): number {
  const days = new Set<string>();
  for (const a of workspace.attempts) {
    if (a.studentId !== studentId || a.id.startsWith("sample-")) continue;
    const at = new Date(a.at);
    if (now.getTime() - at.getTime() <= 7 * 86_400_000) days.add(at.toDateString());
  }
  return days.size;
}

// Every question in a topic, for counting live answers.

// The same facts in plain words for families. Safety concerns are left out on purpose: the
// teacher follows up on those personally.
export function familyWhy(workspace: Workspace, student: Learner, status = studentStatus(student, workspace)): string[] {
  const name = first(student);
  const end = currentUnit().end.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return studentFacts(workspace, student, status)
    .filter((f) => f.kind !== "safety" && f.kind !== "strength" && f.kind !== "answer-seeking")
    .slice(0, 2)
    .map((f) => {
      const topic = f.topic ? topicById(f.topic).name.toLowerCase() : "math";
      switch (f.kind) {
        case "root-cause":
          return `${name}’s harder ratio work tripped on ${topic === "fractions" ? "equivalent fractions" : topic}, a skill from earlier in 4th grade. ${f.detail.includes("Solved") ? "After a short refresher, the ratio problem was solved." : "A short refresher is ready."}`;
        case "repeated-mistake":
          return `In ${topic}, ${name} keeps making one mistake: ${f.detail.split(":")[0].toLowerCase()}.`;
        case "hint-reliance":
          return `${name} gets ${topic} right with hints and is working toward doing it alone.`;
        case "trend":
          return status.status === "stagnant"
            ? `${topicById(f.topic!).name} hasn’t moved in the last two weeks.`
            : `${topicById(f.topic!).name} is improving, but more slowly than needed to reach the class goal by ${end}.`;
        case "linked-gap":
          return `${topicById(f.topic!).name} is still growing too, and the topic above builds on it.`;
        default:
          return f.detail;
      }
    });
}

// For a learner with nothing to flag: their strongest topic, so on-track rows say something specific.
export function strengthLine(status: StudentStatus): string {
  const best = status.topics.filter((t) => t.score !== null).sort((a, b) => b.score! - a.score!)[0];
  return best ? `Strongest: ${topicById(best.topic).name}, ${best.score}%` : "Not enough practice yet";
}

// One short line for a learner card or table row: a live fact if there is one (root cause,
// repeated mistake, hint reliance…), otherwise what the trend is doing.
export function whyLine(workspace: Workspace, status: StudentStatus): string | null {
  const fact = whyFor(workspace, status.student, status, 4).find((f) => f.kind !== "trend");
  if (fact) return fact.title;
  if (!status.focus || status.status === "on_track") return null;
  const text = status.focus.reason.replace(/^At \d+%, /, "");
  return text[0].toUpperCase() + text.slice(1);
}
