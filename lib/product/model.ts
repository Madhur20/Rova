import { topics, type Role, type TopicId } from "./curriculum";

export interface Profile { id: string; name: string; role: Role; email?: string; school: string; goal: number; avatar: string; sample?: boolean; familyCode?: string }
export interface Learner { id: string; name: string; scores: Partial<Record<TopicId, number>>; avatar: string }
export interface Attempt { id: string; studentId: string; questionId: string; topic: TopicId; correct: boolean; hints: number; at: string; sessionId?: string; planId?: string }
export interface CoachMessage { id: string; role: "student" | "coach"; text: string; questionId: string; at: string; kind?: "hint" | "correct" | "retry" | "guardrail" | "safety" | "explain" | "encouragement" | "trace"; source?: string }
// Set by code (lib/product/rootCause.ts) when repeated checked misses point to an earlier skill.
export interface RootCauseTrace { prerequisite: TopicId; standard: string; questionId: string; wrongAnswers: string[]; at: string; refresherSessionId?: string; refresherCompletedAt?: string; fixedAt?: string; acknowledgedAt?: string }
export interface CoachSession { id: string; studentId: string; topic: TopicId; planId?: string; refresherFor?: string; questionIds?: string[]; questionIndex: number; messages: CoachMessage[]; startedAt: string; completedAt?: string; trace?: RootCauseTrace }
export interface Plan { id: string; topic: TopicId; studentIds: string[]; at: string; completed?: boolean; questionIds?: string[] }
// Course handbooks, course books, and curriculum materials a teacher adds; bank questions reference them.
// An uploaded PDF or document is kept on disk under the data directory; only its details are saved here.
export interface MaterialFile { name: string; type: string; size: number; ext: string }
export interface Material { id: string; title: string; kind: "handbook" | "textbook" | "curriculum" | "other"; topics: TopicId[]; notes: string; at: string; file?: MaterialFile }
// A question a teacher wrote or accepted from a suggestion. Shaped like a built-in question so the coach treats it the same.
export interface BankQuestion { id: string; topic: TopicId; prompt: string; answer: string; hints: string[]; explanation: string; guide: string; simple: string; source?: string; origin: "teacher" | "suggested"; at: string }
export interface Note { id: string; studentId: string; text: string; author: string; authorId?: string; at: string; automatic?: boolean }
// Illustrated pictures for the sample accounts (no real people). Other accounts show initials.
export const samplePhotos: Record<string, string> = {
  maya: "/avatars/maya.svg",
  rivera: "/avatars/rivera.svg",
  alex: "/avatars/alex.svg",
  // The simulated classmates, drawn by scripts/gen-avatars.mjs.
  ...Object.fromEntries(Array.from({ length: 17 }, (_, i) => [`learner-${i + 1}`, `/avatars/learner-${i + 1}.svg`])),
};
export interface Workspace { name: string; code: string; students: Learner[]; attempts: Attempt[]; plans: Plan[]; notes: Note[]; checks: string[]; sessions?: CoachSession[]; materials?: Material[]; questions?: BankQuestion[] }
export const emptyWorkspace: Workspace = { name: "My classroom", code: "", students: [], attempts: [], plans: [], notes: [], checks: [] };
export const sampleProfiles: Record<Role, Profile> = {
  student: { id: "maya", name: "Maya Chen", role: "student", school: "Maplewood Elementary", goal: 10, avatar: "sage", sample: true },
  teacher: { id: "rivera", name: "Elena Rivera", role: "teacher", school: "Maplewood Elementary", goal: 10, avatar: "peach", sample: true },
  parent: { id: "alex", name: "Alex Chen", role: "parent", school: "Maplewood Elementary", goal: 10, avatar: "lavender", sample: true },
};
export function sampleWorkspace(): Workspace {
  const names = ["Maya Chen", "Oliver Brooks", "Amelia Patel", "Noah Williams", "Sophia Garcia", "Liam Johnson", "Isabella Kim", "Ethan Davis", "Ava Robinson", "Lucas Martinez", "Mia Thompson", "Aiden Wilson", "Charlotte Lee", "Henry Clark", "Harper Lewis", "Leo Anderson", "Ella Thomas", "James Walker"];
  const students = names.map((name, i) => ({ id: i === 0 ? "maya" : `learner-${i}`, name, avatar: ["sage", "peach", "lavender", "blue"][i % 4], scores: Object.fromEntries(topics.map((t, j) => [t.id, i === 17 ? [38, 46, 41, 32, 48, 44][j] : i === 0 ? [92, 78, 65, 42, 86, 74][j] : j === 3 && i < 7 ? 35 + i * 3 : 58 + ((i * 17 + j * 11) % 40)])) }));
  const now = Date.now();
  const attempts: Attempt[] = [];
  for (let day = 6; day >= 0; day--) {
    for (let n = 0; n < 4 + ((6 - day) % 3); n++) {
      const topic = topics[(day + n) % topics.length].id;
      attempts.push({ id: `sample-${day}-${n}`, studentId: "maya", questionId: `sample-${topic}`, topic, correct: n !== 1 && !(day > 3 && n === 2), hints: n === 1 ? 2 : 0, at: new Date(now - day * 86400000 - n * 120000).toISOString() });
    }
  }
  return { name: "Math explorers", code: "MAPLE4", students, attempts, plans: [], checks: [], notes: [{ id: "welcome", studentId: "maya", text: "Maya is making thoughtful connections in multiplication. This week, we’re working on seeing why different fractions can represent the same amount. Try folding a piece of paper together at home.", author: "Elena Rivera", authorId: "rivera", at: new Date(now - 86400000).toISOString() }] };
}
export function scoreFor(student: Learner, topic: TopicId, attempts: Attempt[]): number | null {
  const recent = attempts.filter((a) => a.studentId === student.id && a.topic === topic && !a.id.startsWith("sample-")).slice(-10);
  const base = student.scores[topic];
  if (!recent.length) return base ?? null;
  const right = recent.reduce((sum, a) => sum + (a.correct ? (a.hints ? 0.7 : 1) : 0), 0);
  return Math.round(((base === undefined ? 0 : base / 100 * 3) + right) / (recent.length + (base === undefined ? 0 : 3)) * 100);
}
// Upgrade only the untouched simulated profile from the previous seed. Never
// overwrite a renamed profile, edited scores, or a learner's live practice.
export function upgradeSampleWorkspace(workspace: Workspace): Workspace {
  if (workspace.name === "Room 4 · Math explorers") workspace.name = "Math explorers";
  // The seeded welcome note predates teacher pictures; make it match notes the teacher sends.
  for (const note of workspace.notes) if (note.id === "welcome" && note.author === "Ms. Rivera") { note.author = "Elena Rivera"; note.authorId = "rivera"; }
  const student = workspace.students.find(s => s.id === "learner-17" && s.name === "James Walker");
  if (student && topics.every((t, j) => student.scores[t.id] === 58 + ((17 * 17 + j * 11) % 40)) && !workspace.attempts.some(a => a.studentId === student.id && !a.id.startsWith("sample-"))) {
    topics.forEach((t, j) => { student.scores[t.id] = [38, 46, 41, 32, 48, 44][j]; });
  }
  return workspace;
}
export function average(values: (number | null)[]): number | null {
  const known = values.filter((v): v is number => v !== null);
  return known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : null;
}
export function band(score: number | null): string { return score === null ? "unstarted" : score >= 80 ? "strong" : score >= 60 ? "growing" : "support"; }
export function labelFor(score: number | null): string { return score === null ? "Ready to explore" : score >= 80 ? "Feeling confident" : score >= 60 ? "Getting there" : "Let’s work on this"; }
export function weeklyActivity(attempts: Attempt[], studentId?: string) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(); date.setDate(date.getDate() - 6 + i);
    const key = date.toDateString();
    const items = attempts.filter((a) => (!studentId || a.studentId === studentId) && new Date(a.at).toDateString() === key);
    return { label: date.toLocaleDateString("en-US", { weekday: "short" }), attempts: items.length, correct: items.filter((a) => a.correct).length };
  });
}
