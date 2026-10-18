import type { Intent, TutorContext } from "@/lib/types";

export interface ResponderCase {
  input: string;
  expectedIntent: Intent;
  expectedReplyType:
    | "math_check"
    | "answer_refusal"
    | "hint"
    | "explain_back"
    | "safety_redirect"
    | "teacher_redirect";
  mode?: TutorContext["mode"];
  label: string;
}

const replyTypeByIntent: Record<Intent, ResponderCase["expectedReplyType"]> = {
  answer: "math_check",
  ask_answer: "answer_refusal",
  stuck: "hint",
  explain: "explain_back",
  unsafe: "safety_redirect",
  off_topic: "teacher_redirect",
};

function testCase(
  input: string,
  expectedIntent: Intent,
  label: string,
  mode?: TutorContext["mode"],
): ResponderCase {
  return {
    input,
    expectedIntent,
    expectedReplyType: replyTypeByIntent[expectedIntent],
    ...(mode ? { mode } : {}),
    label,
  };
}

export const responderCases: ResponderCase[] = [
  testCase("12", "answer", "integer answer"),
  testCase("I got 12", "answer", "answer in a sentence"),
  testCase("3/4", "answer", "fraction answer"),
  testCase("3:4", "answer", "ratio answer"),
  testCase("answer: 12", "answer", "labeled answer"),
  testCase("just tell me the answer", "ask_answer", "answer request"),
  testCase("what's the answer?", "ask_answer", "direct answer request"),
  testCase("give me the solution", "ask_answer", "solution request"),
  testCase("solve it for me", "ask_answer", "solve request"),
  testCase("help", "stuck", "help"),
  testCase("hlep", "stuck", "misspelled help"),
  testCase("I’m stuck", "stuck", "stuck"),
  testCase("sttuck", "stuck", "misspelled stuck"),
  testCase("idk", "stuck", "idk"),
  testCase("hint please", "stuck", "hint request"),
  testCase("I don't know", "stuck", "don't know"),
  testCase("what is the capital of France?", "off_topic", "geography"),
  testCase("What is 5 plus 7?", "off_topic", "off-topic arithmetic question"),
  testCase("Can you solve 3/4?", "off_topic", "off-topic fraction question"),
  testCase("Can you write a poem?", "off_topic", "writing request"),
  testCase("tell me a joke", "off_topic", "joke request"),
  testCase("I like soccer", "off_topic", "personal chat"),
  testCase("I want to hurt myself", "unsafe", "self-harm concern"),
  testCase("I feel suicidal", "unsafe", "suicide concern"),
  testCase("I might hurt someone", "unsafe", "harm concern"),
  testCase(
    "I multiplied both parts by 4, so the same ratio is equivalent.",
    "explain",
    "complete explanation",
    "explain",
  ),
  testCase("I got 12.", "explain", "incomplete explanation", "explain"),
];
