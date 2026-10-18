import { hasChatPicture, topicById, type PracticeQuestion, type TopicId } from "./curriculum";
import { bankFor, builtInFor, gradeQuestion, questionById } from "./bank";
import type { CoachMessage, CoachSession, Plan, Workspace } from "./model";
import { hasSafetyConcern } from "./safety";
import { detectRootCause, skillPhrase } from "./rootCause";
import { classifyMistake } from "./mistakes";

// Deterministic coaching adapter. Code grades answers, owns hint progression, and decides lesson completion.
// The answer a learner gets by adding the change instead of multiplying (a common ratio misconception).
const additiveAnswers: Record<string, string> = { ra1: "7", ra2: "8", ra3: "12" };

export function opening(question: PracticeQuestion): string {
  return `Let’s work through this ${topicById(question.topic).name.toLowerCase()} question together. ${question.guide} Share a first idea, try an answer, or ask for a picture.`;
}
// The questions a session walks through: the lesson's chosen set, or the built-in set for free practice.
export function sessionQuestions(workspace: Workspace, session: CoachSession): PracticeQuestion[] {
  const chosen = (session.questionIds ?? []).map(id => questionById(workspace, id)).filter((q): q is PracticeQuestion => !!q);
  return chosen.length ? chosen : builtInFor(session.topic);
}
export function planQuestionIds(plan: Plan): string[] {
  return plan.questionIds?.length ? plan.questionIds : builtInFor(plan.topic).map(q => q.id);
}
export function currentQuestion(workspace: Workspace, session: CoachSession) {
  return sessionQuestions(workspace, session)[session.questionIndex];
}
export function questionSolved(workspace: Workspace, session: CoachSession, questionId: string) {
  return workspace.attempts.some(a => a.sessionId === session.id && a.questionId === questionId && a.correct);
}
export function lessonProgress(workspace: Workspace, plan: Plan, studentId: string) {
  const sessions = (workspace.sessions ?? []).filter(s => s.planId === plan.id && s.studentId === studentId);
  const attempts = workspace.attempts.filter(a => a.planId === plan.id && a.studentId === studentId);
  const ids = planQuestionIds(plan);
  const solved = new Set(attempts.filter(a => a.correct && ids.includes(a.questionId)).map(a => a.questionId)).size;
  const total = ids.length;
  return { sessions, attempts, solved, total, status: solved === total ? "Completed" : sessions.length ? "In progress" : "Not started" };
}
export function topicOutcomes(workspace: Workspace, topic: TopicId) {
  const attempts = workspace.attempts.filter(a => a.topic === topic && !a.id.startsWith("sample-"));
  const groups = new Map<string, typeof attempts>();
  for (const attempt of attempts) {
    const key = `${attempt.studentId}:${attempt.sessionId ?? "practice"}:${attempt.questionId}`;
    groups.set(key, [...(groups.get(key) ?? []), attempt]);
  }
  let independent = 0, supported = 0, corrected = 0, practicing = 0;
  for (const group of groups.values()) {
    const success = group.find(a => a.correct);
    if (!success) practicing++;
    else if (group[0].correct && !success.hints) independent++;
    else { supported++; if (!group[0].correct) corrected++; }
  }
  return { independent, supported, corrected, practicing, total: groups.size };
}

function replyFor(workspace: Workspace, session: CoachSession, input: string): { text: string; kind: CoachMessage["kind"]; hints?: number; correct?: boolean } {
  const q = currentQuestion(workspace, session);
  const turns = session.messages.filter(m => m.questionId === q.id);
  // Only mathematical help affects independence, not greetings or redirects.
  const hints = Math.min(3, turns.filter(m => m.role === "coach" && m.kind && ["hint", "retry", "explain", "trace"].includes(m.kind)).length);
  const attempted = workspace.attempts.some(a => a.sessionId === session.id && a.questionId === q.id);
  if (hasSafetyConcern(input)) {
    return { text: "I’m glad you told me. Please talk with a trusted adult now. I’ve saved a safety concern for your teacher to review in Rova, but they may not see it right away. You don’t need to keep doing math right now.", kind: "safety" };
  }
  if (/\b(ignore|override|system prompt|pretend|just.*answer|give.*answer|tell.*answer|solve.*for me|what(?:’s|'s|s| is)\s+(?:\w+\s+)?answer|answers?\s+(?:please|pls|plz)|(?:please|pls|plz)\s+(?:the\s+)?answer)\b/i.test(input)) {
    return { text: "I’ll help you work it out, one step at a time. I won’t give away the answer. What have you tried so far? Share your thinking, try an answer, or ask for a hint.", kind: "guardrail" };
  }
  if (questionSolved(workspace, session, q.id)) {
    return { text: `You checked that answer successfully. ${q.explanation} Can you explain the idea in your own words? When you’re ready, continue to the next question.`, kind: "explain" };
  }
  const words: Record<string, string> = { one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10", ninety: "90" };
  const normalized = input.trim().toLowerCase().replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|ninety)\b/g, word => words[word]);
  const units = q.id === "fr1" ? "fourths?" : q.topic === "geometry" ? "degrees?|°" : q.id === "me1" ? "centimeters?|cm" : q.id === "me2" ? "grams?|g" : q.id === "me3" ? "minutes?|min" : q.topic === "multiplication" || q.topic === "division" ? "seedlings?|books?|stickers?|seeds?" : q.id === "ra1" ? "cups?" : q.id === "ra2" ? "miles?" : "";
  const numeric = normalized.match(new RegExp(`^(?:(?:i think|my answer is|it is|it’s|it's|is it|maybe)\\s+)?([-+]?\\d[\\d,.\\s]*(?:/\\s*\\d+)?)(?:\\s*(?:${units || "(?!)"}))?[?.!]?$`, "i"))?.[1];
  if (numeric) {
    const correct = gradeQuestion(q, numeric);
    if (correct) return { text: `Yes — your answer checks out. ${q.explanation} What did you do differently, or what helped it click?`, kind: "correct", correct, hints };
    const specific = q.topic === "fractions" && /^(?:1|3)$/.test(numeric.trim()) && q.id === "fr1"
      ? "You may be counting the original pieces instead of the smaller pieces. Keep the shaded area the same. "
      : additiveAnswers[q.id] === numeric.trim() ? "It looks like you added the same amount to both parts. A ratio stays the same when we multiply both parts by the same number. "
      : classifyMistake(q.id, numeric) ? `${classifyMistake(q.id, numeric)!.nudge} `
      : "That doesn’t match yet. Let’s look at one step together. ";
    return { text: specific + q.hints[Math.min(hints, 2)] + " Try again when you’re ready.", kind: "retry", correct, hints };
  }
  if (/\b(hint|help|stuck|idk|don.?t (?:know|understand)|show|picture|nudge)\b/i.test(input)) {
    // A worked step only unlocks after an actual attempt, never by repeatedly asking.
    const level = Math.min(hints, attempted ? 2 : 1);
    const lead = hints >= 2 && !attempted ? "Let’s try a first guess before another worked step. "
      : /\b(show|picture)\b/i.test(input) ? (q.topic === "fractions" ? "Here’s the same amount in smaller pieces. " : hasChatPicture(q) ? "Here’s the picture again. " : "Look at the picture with the question. ") : "Let’s make it smaller. ";
    return { text: lead + q.hints[level] + " What would you try?", kind: "hint" };
  }
  if (q.topic === "fractions" && /\b(add|added|plus)\b/i.test(input)) {
    return { text: "Let’s test that idea with the picture. Adding the same number on top and bottom can change the shaded amount. Instead, split every original piece equally: what operation changes both counts by the same factor?", kind: "explain" };
  }
  if (q.topic === "fractions" && /\b(both|double|doubled|twice|times|split|cut|smaller|pieces)\b/i.test(input)) {
    return { text: "That’s a useful idea to investigate: change the pieces, while keeping the whole and the shaded amount the same. " + (q.id === "fr1" ? "Imagine a line through the middle of each half. Which new pieces belong to the planted half?" : "Compare the old and new denominators. Use the same scale factor for the numerator. What would you try on top?"), kind: "explain" };
  }
  if (/\b(why|how|mean|fraction|numerator|denominator|equivalent|multiply|divide|place|angle|unit|same|half|quarter|group|tens|hundreds|thousands|meter|centimeter|degree)\b/i.test(input)) {
    // Plain words first, then the first nudge; the chat shows the picture beside it where there is one.
    return { text: (q.simple ? q.simple + " " : "") + q.hints[0], kind: "explain" };
  }
  if (/\b(frustrat\w*|hard|can.?t|bad at|hate math)\b/i.test(input)) {
    return { text: "I’m here with you. You don’t have to be fast, and a mistake gives us something to work with. " + q.hints[0] + " Want to try that first step?", kind: "explain" };
  }
  if (/\b(hi|hello|hey|thanks|thank you)\b/i.test(input)) {
    return { text: "Hi! I’m here with you. Take your time. Share a first idea when you’re ready, or ask me for a hint.", kind: "encouragement" };
  }
  return { text: "I can help with this math question, but I don’t want to guess what you mean. Tell me which part is confusing, type a number to check, or choose a hint. Your teacher can see our conversation and help with other questions.", kind: "guardrail" };
}

export function startCoaching(workspace: Workspace, studentId: string, topic: TopicId, id: string, at: string, planId?: string, refresherFor?: string): CoachSession {
  if (!bankFor(workspace, topic).length) throw new Error("Choose a math topic.");
  const plan = planId ? workspace.plans.find(p => p.id === planId && p.topic === topic && p.studentIds.includes(studentId)) : undefined;
  if (planId && !plan) throw new Error("That lesson isn’t assigned to you.");
  workspace.sessions ??= [];
  // A refresher belongs to the session whose root-cause trace suggested it.
  const traced = refresherFor ? workspace.sessions.find(s => s.id === refresherFor && s.studentId === studentId && s.trace?.prerequisite === topic) : undefined;
  if (refresherFor && (!traced || planId)) throw new Error("That refresher isn’t available.");
  const previous = [...workspace.sessions].reverse().find(s => s.studentId === studentId && s.topic === topic && s.planId === planId && s.refresherFor === refresherFor && !s.completedAt);
  if (previous) return previous;
  const questionIds = plan ? planQuestionIds(plan).filter(id => questionById(workspace, id)) : builtInFor(topic).map(q => q.id);
  const q = questionById(workspace, questionIds[0]) ?? builtInFor(topic)[0];
  const welcome = traced ? `Quick refresher on ${topicById(topic).name.toLowerCase()}: three short questions, then we’ll go back to your ${topicById(traced.topic).name.toLowerCase()} question. ${opening(q)}` : opening(q);
  const session: CoachSession = { id, studentId, topic, planId, refresherFor, questionIds, questionIndex: 0, startedAt: at, messages: [{ id: `${id}-welcome`, role: "coach", text: welcome, questionId: q.id, at, source: topicById(topic).standard }] };
  if (traced?.trace && !traced.trace.refresherSessionId) traced.trace.refresherSessionId = id;
  workspace.sessions.push(session);
  return session;
}
export function coachingTurn(workspace: Workspace, studentId: string, sessionId: string, id: string, input: string, at: string): CoachSession {
  const session = workspace.sessions?.find(s => s.id === sessionId && s.studentId === studentId);
  if (!session) throw new Error("Open a practice lesson first.");
  if (session.messages.some(m => m.id === id)) return session;
  if (!input.trim() || input.length > 600) throw new Error("Write a message of up to 600 characters.");
  if (session.messages.length >= 300) throw new Error("This conversation is full. Ask your teacher to help you continue.");
  const q = currentQuestion(workspace, session);
  const reply = replyFor(workspace, session, input.trim());
  session.messages.push({ id, role: "student", text: input.trim(), questionId: q.id, at });
  const source = topicById(session.topic).standard;
  if (reply.correct !== undefined) workspace.attempts.push({ id, studentId, questionId: q.id, topic: q.topic, correct: reply.correct, hints: reply.hints ?? 0, at, sessionId, planId: session.planId });
  const trace = reply.correct === false ? detectRootCause(workspace, session, at) : undefined;
  if (trace) {
    session.trace = trace;
    const earlier = topicById(trace.prerequisite);
    const skill = skillPhrase[trace.prerequisite] ?? earlier.name.toLowerCase();
    session.messages.push({ id: `${id}-reply`, role: "coach", kind: "trace", questionId: q.id, at, source: trace.standard,
      text: `Two tries on this one, and that tells us something useful. Ratios are built on ${skill}: multiplying both parts by the same number keeps the amount the same. Your three-question ${skill} refresher is ready on your dashboard. Close this chat to start it, then come back to this question.` });
    familyUpdate(workspace, studentId, `${id}-family`, at, `hit a tricky spot in ${topicById(session.topic).name.toLowerCase()} today. Rova traced it to an earlier skill, ${skill} (${earlier.standard}). Try “${earlier.activity}” together under Tonight’s 10 minutes; it takes about 10 minutes.`);
  } else session.messages.push({ id: `${id}-reply`, role: "coach", text: reply.text, kind: reply.kind, questionId: q.id, at, source });
  if (reply.correct && session.trace && !session.trace.fixedAt && session.trace.questionId === q.id) {
    session.trace.fixedAt = at;
    familyUpdate(workspace, studentId, `${id}-family`, at, `went back and solved the ${topicById(session.topic).name.toLowerCase()} question that was tricky earlier${session.trace.refresherCompletedAt ? `, after a ${topicById(session.trace.prerequisite).name.toLowerCase()} refresher` : ""}. Ask them to show you how they did it.`);
  }
  const set = sessionQuestions(workspace, session);
  if (!session.completedAt && set.every(q => questionSolved(workspace, session, q.id))) {
    session.completedAt = at;
    const traced = session.refresherFor ? workspace.sessions?.find(s => s.id === session.refresherFor) : undefined;
    if (traced?.trace && !traced.trace.refresherCompletedAt) traced.trace.refresherCompletedAt = at;
  }
  return session;
}
// Automatic family updates are saved in Rova only; no text or email is sent.
function familyUpdate(workspace: Workspace, studentId: string, id: string, at: string, text: string) {
  const name = workspace.students.find(s => s.id === studentId)?.name.split(" ")[0] ?? "Your child";
  workspace.notes.push({ id, studentId, author: "Rova", text: `${name} ${text}`, at, automatic: true });
}
export function advanceCoaching(workspace: Workspace, studentId: string, sessionId: string, at: string): CoachSession {
  const session = workspace.sessions?.find(s => s.id === sessionId && s.studentId === studentId);
  if (!session) throw new Error("Open a practice lesson first.");
  const q = currentQuestion(workspace, session);
  if (!questionSolved(workspace, session, q.id)) throw new Error("Try this question before moving on. Your coach can help.");
  const next = sessionQuestions(workspace, session)[session.questionIndex + 1];
  if (next) {
    session.questionIndex++;
    session.messages.push({ id: `${session.id}-${next.id}`, role: "coach", text: opening(next), questionId: next.id, at, source: topicById(session.topic).standard });
  }
  return session;
}
