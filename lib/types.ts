// Shared contracts between Person A (student), Person B (data + rules), and Person C (adults).
// Source: docs/INTEGRATION_CONTRACTS.md. Only the integration owner (Person B) edits this file;
// propose changes in a PR or to Person B first.

export type SkillId = string; // Common Core code, e.g. "6.RP.A.3"

export interface Skill {
  name: string;
  grade: number;
  needs: SkillId[]; // prerequisites
}
export type SkillMap = Record<SkillId, Skill>;

export interface Student {
  id: string;
  first_name: string;
  grade: number;
  buddy_name: string;
  language_home: string; // e.g. "es"
  interests: string[];
}

export interface Classroom {
  id: string;
  teacher: string;
  name: string;
  student_ids: string[];
}

export interface SkillState {
  student_id: string;
  skill_id: SkillId;
  mastery: number; // 0–1
  misconceptions: string[]; // error-type tags, e.g. "adds-across-ratio-table"
  last_seen: string; // ISO timestamp
}

export interface LearnerProfile {
  student: Student;
  skills: SkillState[];
  preferences: string[]; // e.g. "learns best with pictures"
}

export interface Problem {
  id: string;
  skill_id: SkillId;
  prompt: string;
  answer: string; // canonical form; correctness is decided by check_answer, never by text
  source?: string; // lesson section or standard cited with hints
}

export type EventType = "attempt" | "hint" | "explain" | "refresher";

export interface Event {
  student_id: string;
  skill_id: SkillId;
  type: EventType;
  correct?: boolean; // attempts and refresher answers only, set by check_answer
  hint_level?: 1 | 2 | 3; // hint events only
  error_type?: string; // when check_answer can classify the mistake
  seconds: number;
  ts: string;
}

export type AlertSignal =
  | "stuck"
  | "answer_seeking"
  | "repeated_misconception"
  | "drop"
  | "disengagement"
  | "class_gap"
  | "safety_concern" // student wrote something concerning (safety screen or Send to my teacher)
  | "student_question"; // student sent an off-topic question to the teacher
export type AlertStatus = "open" | "acted" | "verified" | "escalated";
export type TeacherAction = "done" | "snooze" | "different_strategy";

// A report the student view sends straight to the teacher (no rules involved).
export interface TeacherReport {
  student_id: string;
  skill_id: SkillId; // the skill being practiced when it was sent
  kind: "safety_concern" | "student_question";
  message: string; // what the student wrote; teachers can see every conversation
}

export interface Alert {
  id: string;
  student_id: string;
  skill_id: SkillId;
  signal: AlertSignal;
  evidence: string;
  root_cause: SkillId | null;
  action: string; // suggested 5-minute reteach
  others_with_gap: string[]; // student ids
  status: AlertStatus;
  recheck_at: string | null;
  created_at?: string; // ISO; set by create_alert, used by run_recheck to read only later events
  // Number of events in the log when the alert was verified or escalated. Detection ignores
  // events before it. An event count, not a time, because the re-check uses a simulated future date.
  resolved_after_event?: number;
}

export interface ParentMessage {
  student_id: string;
  language: string;
  kind: "activity" | "win" | "weekly";
  text: string;
  sent_at: string; // delivery is Simulated
}

// Rule-based responder (D-004). No AI model; replies come from templates via callLLM.

export type Intent =
  | "answer" // contains a number/ratio/fraction → check_answer decides
  | "ask_answer" // "just tell me", "what's the answer"
  | "stuck" // "help", "hint", "idk", "stuck"
  | "explain" // free text while in explain-it-back
  | "unsafe" // safety keyword list → flag teacher
  | "off_topic"; // everything else → "Great question for your teacher!"

export type HintLevel = 0 | 1 | 2 | 3;
export type TutorMode = "problem" | "refresher" | "explain";

export interface TutorContext {
  profile: LearnerProfile;
  problem_id: string;
  hint_level: HintLevel;
  mode: TutorMode;
}

export interface TutorReply {
  intent: Intent;
  text: string;
  source?: string; // citation shown on the reply
  hint_level: HintLevel;
  next_mode?: TutorMode; // e.g. switch to refresher after a root cause is found
  quick_replies: string[]; // suggested taps; typing stays available
  events: Event[]; // passed to log_event
}

// A template has several wordings; {placeholders} are filled from vars.
export type TemplateBank = Record<string, string[]>;
