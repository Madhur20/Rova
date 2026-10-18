// On track / behind schedule / stagnant: a plain rule over each learner's confidence over time.
// Every status carries the numbers that produced it, so a teacher can check it.
//
// Rule (per topic): at or above the target → on track; below it but rising fast enough to reach it
// by the unit's end → on track; rising at least MIN_RISE points a week but not fast enough →
// behind schedule; otherwise → stagnant. Too few answers → not enough data.

import { topics, type TopicId } from "./curriculum";
import { scoreFor, type Attempt, type Learner, type Plan, type Workspace } from "./model";

export const TARGET = 70;
export const UNIT_WEEKS = 3;
export const MIN_RISE = 2; // points per week that still counts as moving
export const MIN_LIVE_ANSWERS = 5; // learners without a simulated history need this many
const DAY = 86_400_000;
const WEEK = 7 * DAY;

export type Status = "on_track" | "behind" | "stagnant" | "no_data";
export const statusOrder: Status[] = ["stagnant", "behind", "on_track", "no_data"];
export const statusLabel: Record<Status, string> = {
  on_track: "On track",
  behind: "Behind schedule",
  stagnant: "Stagnant",
  no_data: "Not enough data",
};

export interface Unit {
  start: Date;
  end: Date;
}
// The current unit started a week ago and runs three weeks, so two weeks are left.
export function currentUnit(now = new Date()): Unit {
  const start = new Date(now.getTime() - WEEK);
  start.setHours(0, 0, 0, 0);
  return { start, end: new Date(start.getTime() + UNIT_WEEKS * WEEK) };
}

export interface Point {
  at: string;
  score: number;
  simulated: boolean;
}

const liveAttempts = (attempts: Attempt[], studentId: string, topic: TopicId, until?: number) =>
  attempts.filter(
    (a) =>
      a.studentId === studentId &&
      a.topic === topic &&
      !a.id.startsWith("sample-") &&
      (until === undefined || new Date(a.at).getTime() <= until),
  );

// Confidence using only answers given up to a moment.
export function scoreAt(student: Learner, topic: TopicId, attempts: Attempt[], at: number): number | null {
  return scoreFor(
    student,
    topic,
    attempts.filter((a) => a.studentId !== student.id || new Date(a.at).getTime() <= at),
  );
}

// Sample learners (the seeded classroom) get a simulated three-week history that ends at
// their starting confidence. Accounts created later have only their live answers.
export function hasSimulatedHistory(student: Learner): boolean {
  return student.id === "maya" || /^learner-\d+$/.test(student.id);
}

// Simulated weekly change for a sample learner, in confidence points per week.
const mayaPace: Partial<Record<TopicId, number>> = {
  "place-value": 3,
  multiplication: 5,
  division: 6,
  fractions: 4,
  measurement: 3,
  geometry: 5,
};
export function simulatedPace(student: Learner, topic: TopicId): number {
  if (student.id === "maya") return mayaPace[topic] ?? 3;
  const i = Number(student.id.replace("learner-", ""));
  if (i === 17) return topic === "division" ? 1 : 0; // the priority learner: flat everywhere
  if (topic === "fractions" && i >= 1 && i <= 6) return i === 2 || i === 5 ? 0 : 3; // the shared fractions gap
  if (i === 11 && topic === "division") return -2; // one learner slipping in one topic
  if (i === 14 && topic === "measurement") return 1;
  return 6 + ((i * 3 + topics.findIndex((t) => t.id === topic)) % 4);
}

const clamp = (n: number) => Math.max(5, Math.min(100, Math.round(n)));

// Confidence over time for one learner and topic: simulated weekly points, then today.
export function timeline(student: Learner, topic: TopicId, workspace: Workspace, now = new Date()): Point[] {
  const today = scoreFor(student, topic, workspace.attempts);
  if (today === null) return [];
  const t = now.getTime();
  if (hasSimulatedHistory(student)) {
    const start = student.scores[topic] ?? today;
    const pace = simulatedPace(student, topic);
    const past = [3, 2, 1].map((weeks) => ({
      at: new Date(t - weeks * WEEK).toISOString(),
      score: clamp(start - pace * weeks),
      simulated: true,
    }));
    return [...past, { at: now.toISOString(), score: today, simulated: false }];
  }
  const live = liveAttempts(workspace.attempts, student.id, topic);
  if (live.length < MIN_LIVE_ANSWERS) return [];
  const first = new Date(live[0].at).getTime();
  const middle = first + (t - first) / 2;
  const mid = scoreAt(student, topic, workspace.attempts, middle);
  return [
    ...(mid === null ? [] : [{ at: new Date(middle).toISOString(), score: mid, simulated: false }]),
    { at: now.toISOString(), score: today, simulated: false },
  ];
}

export interface TopicStatus {
  topic: TopicId;
  status: Status;
  score: number | null;
  perWeek: number; // change in confidence per week over the unit so far
  projected: number | null; // confidence at the unit's end at this pace
  neededPerWeek: number; // what it would take to reach the target in time
  reason: string;
  points: Point[];
}

const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;

export function topicStatus(
  student: Learner,
  topic: TopicId,
  workspace: Workspace,
  now = new Date(),
  points = timeline(student, topic, workspace, now),
): TopicStatus {
  const base = { topic, points, perWeek: 0, projected: null, neededPerWeek: 0 };
  if (points.length < 2) {
    const live = liveAttempts(workspace.attempts, student.id, topic).length;
    return {
      ...base,
      status: "no_data",
      score: points.at(-1)?.score ?? null,
      reason: `${live} of ${MIN_LIVE_ANSWERS} answers needed to see a trend.`,
    };
  }
  const unit = currentUnit(now);
  const last = points.at(-1)!;
  // Pace over the last two weeks (or whatever span the points cover).
  const from = points.find((p) => new Date(p.at).getTime() >= now.getTime() - 2 * WEEK - DAY) ?? points[0];
  const weeks = Math.max(1, (new Date(last.at).getTime() - new Date(from.at).getTime()) / WEEK);
  const perWeek = Math.round((last.score - from.score) / weeks);
  const weeksLeft = Math.max(0, (unit.end.getTime() - now.getTime()) / WEEK);
  const projected = Math.min(100, Math.round(last.score + perWeek * weeksLeft));
  const neededPerWeek = weeksLeft > 0 ? Math.ceil((TARGET - last.score) / weeksLeft) : TARGET - last.score;
  const end = shortDate(unit.end);
  const s = { ...base, score: last.score, perWeek, projected, neededPerWeek };
  if (last.score >= TARGET)
    return { ...s, status: "on_track", reason: `At ${last.score}%, at or above the ${TARGET}% target.` };
  if (projected >= TARGET)
    return {
      ...s,
      status: "on_track",
      reason: `At ${last.score}%, ${signed(perWeek)} a week: on pace for ${TARGET}% by ${end}.`,
    };
  if (perWeek >= MIN_RISE)
    return {
      ...s,
      status: "behind",
      reason: `At ${last.score}%, ${signed(perWeek)} a week; needs about +${neededPerWeek} a week to reach ${TARGET}% by ${end}.`,
    };
  return {
    ...s,
    status: "stagnant",
    reason:
      perWeek < 0
        ? `At ${last.score}%, down ${Math.abs(perWeek)} a week.`
        : `At ${last.score}%, ${perWeek === 0 ? "no change" : `${signed(perWeek)} a week`} over two weeks.`,
  };
}

export interface StudentStatus {
  student: Learner;
  status: Status;
  focus: TopicStatus | null; // the topic that most needs attention
  topics: TopicStatus[];
}

const rank = (s: Status) => statusOrder.indexOf(s);

// A learner's overall status is their most urgent topic: any stagnant topic makes them stagnant,
// otherwise any behind topic makes them behind.
export function studentStatus(student: Learner, workspace: Workspace, now = new Date()): StudentStatus {
  const all = topics.map((t) => topicStatus(student, t.id, workspace, now));
  const known = all.filter((t) => t.status !== "no_data");
  const focus =
    [...known].sort((a, b) => rank(a.status) - rank(b.status) || (a.projected ?? 0) - (b.projected ?? 0))[0] ??
    null;
  return { student, status: focus?.status ?? "no_data", focus, topics: all };
}

export function classStatuses(workspace: Workspace, now = new Date()): StudentStatus[] {
  return workspace.students
    .map((s) => studentStatus(s, workspace, now))
    .sort((a, b) => rank(a.status) - rank(b.status) || (a.focus?.projected ?? 0) - (b.focus?.projected ?? 0));
}

export function countByStatus(statuses: { status: Status }[]): Record<Status, number> {
  const counts: Record<Status, number> = { on_track: 0, behind: 0, stagnant: 0, no_data: 0 };
  for (const s of statuses) counts[s.status]++;
  return counts;
}

const worstOf = (perTopic: { status: Status }[]): Status => {
  const known = perTopic.filter((t) => t.status !== "no_data");
  return [...known].sort((a, b) => rank(a.status) - rank(b.status))[0]?.status ?? "no_data";
};

// Class momentum: each learner's overall status when the unit started and today.
export function momentumHistory(workspace: Workspace, now = new Date()) {
  const unit = currentUnit(now);
  const atStart = workspace.students.map((student) => ({
    status: worstOf(
      topics.map((t) => {
        const points = timeline(student, t.id, workspace, now).filter(
          (p) => new Date(p.at).getTime() <= unit.start.getTime() + DAY,
        );
        return topicStatus(student, t.id, workspace, unit.start, points);
      }),
    ),
  }));
  return [
    { label: "Unit start", detail: shortDate(unit.start), counts: countByStatus(atStart) },
    { label: "Today", detail: shortDate(now), counts: countByStatus(classStatuses(workspace, now)) },
  ];
}

// For each topic, how many learners are in each status.
export function topicStatusCounts(workspace: Workspace, now = new Date()) {
  const statuses = workspace.students.map((s) => studentStatus(s, workspace, now));
  return topics.map((t) => ({
    topic: t,
    counts: countByStatus(statuses.map((s) => s.topics.find((x) => x.topic === t.id)!)),
    students: Object.fromEntries(
      statusOrder.map((status) => [
        status,
        statuses.filter((s) => s.topics.find((x) => x.topic === t.id)!.status === status).map((s) => s.student),
      ]),
    ) as Record<Status, Learner[]>,
  }));
}

export interface PlanImpact {
  plan: Plan;
  members: { student: Learner; before: number | null; after: number | null; practiced: number }[];
  practiced: number;
  improved: number;
  verdict: "Improved" | "Not yet" | "No practice yet";
}
// Did a group lesson help? Confidence in its topic before it was assigned versus now, counting
// only learners who practiced after it. "Improved" means at least half of them rose 5+ points.
export function planImpact(workspace: Workspace, plan: Plan): PlanImpact {
  const at = new Date(plan.at).getTime();
  const members = plan.studentIds
    .map((id) => workspace.students.find((s) => s.id === id))
    .filter((s): s is Learner => !!s)
    .map((student) => ({
      student,
      before: scoreAt(student, plan.topic, workspace.attempts, at),
      after: scoreFor(student, plan.topic, workspace.attempts),
      practiced: liveAttempts(workspace.attempts, student.id, plan.topic).filter(
        (a) => new Date(a.at).getTime() > at,
      ).length,
    }));
  const active = members.filter((m) => m.practiced > 0);
  const improved = active.filter((m) => (m.after ?? 0) - (m.before ?? 0) >= 5).length;
  return {
    plan,
    members,
    practiced: active.length,
    improved,
    verdict: !active.length ? "No practice yet" : improved * 2 >= active.length ? "Improved" : "Not yet",
  };
}
