import { topicById, topics, type TopicId } from "./curriculum";
import { planImpact } from "./progress";
import { scoreFor, type Workspace } from "./model";
import { topicOutcomes, sessionQuestions } from "./coaching";
import { classmatesWithGap, skillName, traceStatus, tracedSessions } from "./rootCause";
import { supportTopics } from "./insights";

// Principal / MTSS progress report. Every figure is counted from saved evidence; live
// coaching is kept apart from the simulated starting profiles.
export type InterventionType = "Assigned lesson" | "Coached practice" | "Group lesson assigned";
export type InterventionOutcome = "Solved" | "In progress" | "Needs follow-up" | "Improved" | "Not yet" | "No practice yet";
export interface InterventionRow {
  learner: string; focus: string; tried: string; date: string; result: string; next: string;
  // For filtering in the report (not exported to CSV).
  studentIds?: string[]; topic?: TopicId; type?: InterventionType; outcome?: InterventionOutcome; refresher?: boolean;
}
export function progressReport(workspace: Workspace) {
  const sessions = workspace.sessions ?? [];
  const live = workspace.attempts.filter(a => !a.id.startsWith("sample-"));
  const outcomes = topics.map(t => topicOutcomes(workspace, t.id)).concat(topicOutcomes(workspace, "ratios"));
  const sum = (key: "independent" | "supported" | "practicing" | "total") => outcomes.reduce((n, o) => n + o[key], 0);
  const traces = tracedSessions(workspace);
  const name = (id: string) => workspace.students.find(s => s.id === id)?.name ?? "Learner";
  const rows: InterventionRow[] = [];
  for (const session of sessions) {
    if (session.refresherFor) continue; // shown with the lesson that traced it
    const topic = topicById(session.topic);
    const attempts = workspace.attempts.filter(a => a.sessionId === session.id);
    const set = sessionQuestions(workspace, session);
    const solved = set.filter(q => attempts.some(a => a.questionId === q.id && a.correct)).length;
    const independent = set.filter(q => { const first = attempts.find(a => a.questionId === q.id); return first?.correct && !first.hints; }).length;
    const trace = session.trace;
    const safety = session.messages.some(m => m.kind === "safety");
    rows.push({
      studentIds: [session.studentId],
      topic: session.topic,
      type: session.planId ? "Assigned lesson" : "Coached practice",
      refresher: !!trace?.refresherSessionId,
      outcome: safety || (trace && !trace.fixedAt) ? "Needs follow-up" : solved === set.length ? "Solved" : "In progress",
      learner: name(session.studentId),
      focus: trace ? `${topic.name} → root cause ${skillName(trace.prerequisite)}` : topic.name,
      tried: [session.planId ? "Teacher-assigned coached lesson" : "Coached practice", trace?.refresherSessionId ? `${topicById(trace.prerequisite).name.toLowerCase()} refresher` : "", trace?.acknowledgedAt ? "teacher reteach planned" : ""].filter(Boolean).join(" + "),
      date: session.startedAt.slice(0, 10),
      result: `${solved}/${set.length} solved, ${independent} independently${trace ? ` · ${traceStatus(trace)}` : ""}`,
      next: session.messages.some(m => m.kind === "safety") ? "Personal check-in (safety concern flagged)" : trace && !trace.fixedAt ? "Finish refresher, return to original question" : solved === set.length ? "Check transfer with a fresh problem" : "Resume lesson",
    });
  }
  for (const plan of workspace.plans) {
    const impact = planImpact(workspace, plan);
    const topic = topicById(plan.topic);
    rows.push({
      studentIds: plan.studentIds,
      topic: plan.topic,
      type: "Group lesson assigned",
      outcome: impact.verdict,
      learner: impact.members.map(m => m.student.name).join(", "),
      focus: topic.name,
      tried: `Small-group coached lesson for ${impact.members.length} learner${impact.members.length === 1 ? "" : "s"}`,
      date: plan.at.slice(0, 10),
      result: impact.practiced ? `${impact.improved} of ${impact.practiced} who practiced rose 5+ points` : "No practice since assigned",
      next: impact.verdict === "Improved" ? "Check transfer with a fresh problem" : impact.practiced ? "Try a different model with this group" : "Remind the group to start the lesson",
    });
  }
  rows.sort((a, b) => b.date.localeCompare(a.date));
  return {
    generatedAt: new Date().toISOString(),
    className: workspace.name,
    learners: workspace.students.length,
    metrics: {
      coachedLessons: sessions.length,
      refreshers: sessions.filter(s => s.refresherFor).length,
      lessonsCompleted: sessions.filter(s => s.completedAt).length,
      questionsChecked: sum("total"),
      solvedIndependently: sum("independent"),
      solvedWithSupport: sum("supported"),
      stillPracticing: sum("practicing"),
      liveAttempts: live.length,
      rootCausesFound: traces.length,
      refreshersCompleted: traces.filter(s => s.trace.refresherCompletedAt).length,
      solvedAfterTrace: traces.filter(s => s.trace.fixedAt).length,
      teacherActions: traces.filter(s => s.trace.acknowledgedAt).length + workspace.plans.length,
      familyUpdates: workspace.notes.length,
      automaticFamilyUpdates: workspace.notes.filter(n => n.automatic).length,
      safetyConcerns: sessions.filter(s => s.messages.some(m => m.kind === "safety")).length,
    },
    // Support tiers from current confidence (simulated starting profiles plus live practice).
    tiers: {
      priority: workspace.students.filter(s => supportTopics(s, workspace).length === topics.length).map(s => s.name),
      targeted: workspace.students.filter(s => { const n = supportTopics(s, workspace).length; return n > 0 && n < topics.length; }).length,
      onTrack: workspace.students.filter(s => supportTopics(s, workspace).length === 0).length,
    },
    sharedGaps: traces.map(s => ({ learner: name(s.studentId), skill: skillName(s.trace.prerequisite), classmates: classmatesWithGap(workspace, s.studentId, s.trace.prerequisite).length })),
    topicConfidence: topics.map(t => ({ topic: t.name, below60: workspace.students.filter(s => { const v = scoreFor(s, t.id, workspace.attempts); return v !== null && v < 60; }).length })),
    rows,
  };
}

const csvCell = (value: string | number) => /[",\n]/.test(String(value)) ? `"${String(value).replace(/"/g, '""')}"` : String(value);
export function interventionLogCsv(rows: InterventionRow[]): string {
  const header = ["Learner", "Focus skill", "What was tried", "Date", "Result (checked by code)", "Next step"];
  return [header, ...rows.map(r => [r.learner, r.focus, r.tried, r.date, r.result, r.next])].map(line => line.map(csvCell).join(",")).join("\n") + "\n";
}
