import { callLLM } from "@/lib/llm";
import { students } from "@/lib/data/seed";
import type { ParentMessage } from "@/lib/types";

const DEFAULT_SKILL = "razones con tablas";
const DEFAULT_ROOT_CAUSE = "fracciones equivalentes";

export interface ParentMessageOptions {
  kind?: ParentMessage["kind"];
  studentName?: string;
  skill?: string;
  rootCause?: string;
  learned?: string;
  workingOn?: string;
  sentAt?: string;
}

/**
 * Drafts a parent message through the shared template seam.
 *
 * The first three arguments preserve the shared contract. Optional context lets
 * verified alerts and weekly summaries select their message kind without
 * changing that contract. Delivery remains simulated by the caller/UI.
 */
export function draftParentMessage(
  studentId: string,
  activity: string,
  language: string,
  options: ParentMessageOptions = {},
): ParentMessage {
  const kind = options.kind ?? "activity";
  const templateId = `parent.${kind}.${language}`;
  const seededStudentName = students.find((student) => student.id === studentId)?.first_name;
  const studentName = options.studentName ?? seededStudentName ?? studentId;
  const skill = options.skill ?? DEFAULT_SKILL;
  const rootCause = options.rootCause ?? DEFAULT_ROOT_CAUSE;

  const text = callLLM(templateId, {
    student: studentName,
    skill,
    rootCause,
    learned: options.learned ?? skill,
    workingOn: options.workingOn ?? rootCause,
    activity,
  });

  return {
    student_id: studentId,
    language,
    kind,
    text,
    sent_at: options.sentAt ?? new Date().toISOString(),
  };
}
