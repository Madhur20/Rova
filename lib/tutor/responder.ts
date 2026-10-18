import { studentTemplates } from "@/content/templates";
import { find_source } from "@/content/lessons";
import { callLLM } from "@/lib/llm";
import { check_answer } from "@/lib/math/checkAnswer";
import { classify_intent, explain_is_complete } from "@/lib/tutor/intent";
import { getProblem, getRatioTable } from "@/lib/tutor/problems";
import type {
  Event,
  Intent,
  Problem,
  TutorContext,
  TutorReply,
} from "@/lib/types";

export { classify_intent, explain_is_complete } from "@/lib/tutor/intent";

function event(
  context: TutorContext,
  problem: Problem,
  type: Event["type"],
  fields: Pick<Event, "correct" | "error_type" | "hint_level"> = {},
): Event {
  return {
    student_id: context.profile.student.id,
    skill_id: problem.skill_id,
    type,
    seconds: 0,
    ts: new Date().toISOString(),
    ...fields,
  };
}

function hasRepeatedMisconception(
  context: TutorContext,
  skillId: string,
  errorType: string | undefined,
): boolean {
  if (!errorType) return false;
  const state = context.profile.skills.find((skill) => skill.skill_id === skillId);
  return state
    ? state.misconceptions.filter((misconception) => misconception === errorType)
        .length >= 1
    : false;
}

function buildReply(
  context: TutorContext,
  intent: Intent,
  templateId: string,
  overrides: Partial<TutorReply> = {},
): TutorReply {
  const student = context.profile.student;
  const problem = getProblem(context.problem_id);
  const ratioTable = problem ? getRatioTable(problem.id) : null;
  const targetStart = ratioTable
    ? ratioTable.targetSide === "first"
      ? ratioTable.firstStart
      : ratioTable.secondStart
    : 0;
  const otherName = ratioTable
    ? ratioTable.targetSide === "first"
      ? ratioTable.secondLabel
      : ratioTable.firstLabel
    : "other amount";
  const targetName = ratioTable
    ? ratioTable.targetSide === "first"
      ? ratioTable.firstLabel
      : ratioTable.secondLabel
    : "amount";
  const source = problem ? find_source(problem.skill_id, problem.prompt) : null;
  const vars = {
    name: student.first_name,
    buddy: student.buddy_name,
    start: String(targetStart || "starting amount"),
    target: String(ratioTable?.target ?? "target amount"),
    targetName,
    otherName,
    factor:
      ratioTable && targetStart !== 0
        ? String(ratioTable.target / targetStart)
        : "the same number",
  };
  return {
    intent,
    text: callLLM(templateId, vars, studentTemplates),
    ...(source ? { source: source.ref } : {}),
    hint_level: context.hint_level,
    quick_replies: ["I’m stuck", "Try a hint", "Change problem"],
    events: [],
    ...overrides,
  };
}

export function respond(input: string, context: TutorContext): TutorReply {
  const problem = getProblem(context.problem_id);
  if (!problem) {
    throw new Error(`Unknown tutor problem: ${context.problem_id}`);
  }

  const intent = classify_intent(input, context.mode);
  if (intent === "unsafe") {
    return buildReply(context, intent, "unsafe", {
      quick_replies: ["Send to my teacher", "Go back to my mission"],
    });
  }

  if (intent === "off_topic") {
    return buildReply(context, intent, "off_topic", {
      quick_replies: ["Send to my teacher", "Back to my mission", "I’m stuck"],
    });
  }

  if (intent === "ask_answer") {
    const hintLevel = Math.min(3, Math.max(1, context.hint_level + 1)) as 1 | 2 | 3;
    return buildReply(context, intent, "ask_answer", {
      hint_level: hintLevel,
      events: [event(context, problem, "hint", { hint_level: hintLevel })],
    });
  }

  if (intent === "stuck") {
    const hintLevel = Math.min(3, context.hint_level + 1) as 1 | 2 | 3;
    return buildReply(context, intent, `hint_${hintLevel}`, {
      hint_level: hintLevel,
      events: [event(context, problem, "hint", { hint_level: hintLevel })],
    });
  }

  if (intent === "answer") {
    const result = check_answer(problem, input);
    const eventType = context.mode === "refresher" ? "refresher" : "attempt";
    const answerEvent = event(context, problem, eventType, {
      correct: result.correct,
      ...(result.error_type ? { error_type: result.error_type } : {}),
    });
    if (result.correct && context.mode === "problem") {
      return buildReply(context, intent, "attempt_correct", {
        next_mode: "explain",
        events: [answerEvent],
        quick_replies: ["Explain it back"],
      });
    }
    if (result.correct) {
      return buildReply(context, intent, "refresher_correct", {
        events: [answerEvent],
        quick_replies: ["Next check", "Back to my ratio"],
      });
    }

    if (
      context.mode === "problem" &&
      result.error_type === "adds-across-ratio-table" &&
      hasRepeatedMisconception(context, problem.skill_id, result.error_type)
    ) {
      return buildReply(context, intent, "refresher_offer", {
        next_mode: "refresher",
        source: find_source("4.NF.A.1", "")?.ref,
        events: [answerEvent],
        quick_replies: [],
      });
    }

    const templateId =
      eventType === "refresher"
        ? "refresher_wrong"
        : result.error_type === "adds-across-ratio-table"
          ? "attempt_wrong_add"
          : result.error_type === "reverses-ratio"
            ? "attempt_wrong_reverse"
            : "attempt_wrong_generic";
    return buildReply(context, intent, templateId, {
      events: [answerEvent],
      quick_replies:
        context.mode === "refresher"
          ? ["Try again", "Back to my ratio"]
          : ["Try a hint", "Try another answer"],
    });
  }

  const complete = explain_is_complete(input);
  return buildReply(
    context,
    intent,
    complete ? "explain_complete" : "explain_followup",
    {
      events: [event(context, problem, "explain")],
      quick_replies: complete
        ? ["Finish mission"]
        : ["Both parts change by the same factor"],
    },
  );
}
