import type { Profile, Workspace } from "./model";

// Role-specific presentation, NOT an access boundary in the browser-only demo.
export function visibleWorkspace(workspace: Workspace, account: Profile & { linkedStudentId?: string }): Workspace {
  if (account.role === "teacher") return workspace;
  const studentId = account.role === "parent" ? account.linkedStudentId : account.id;
  return { ...workspace, code: "", materials: undefined, sessions: (workspace.sessions ?? []).filter(s => s.studentId === studentId).map(s => account.role === "student" ? s : { ...s, messages: [], trace: s.trace && { ...s.trace, wrongAnswers: [] } }), students: workspace.students.filter(s => s.id === studentId), attempts: workspace.attempts.filter(a => a.studentId === studentId), plans: workspace.plans.filter(p => p.studentIds.includes(studentId ?? "")).map(p => ({ ...p, studentIds: [studentId!] })), notes: workspace.notes.filter(n => n.studentId === studentId), checks: workspace.checks.filter(c => c.startsWith(`${account.id}:`)) };
}
