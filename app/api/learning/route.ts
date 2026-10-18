import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { currentAccount, database, materialsDirectory, sameOrigin, visibleWorkspace } from "@/lib/product/server";
import { allTopics, topics, type TopicId } from "@/lib/product/curriculum";
import { advanceCoaching, coachingTurn, lessonProgress, startCoaching } from "@/lib/product/coaching";
import { DEFAULT_LESSON_QUESTIONS, MAX_LESSON_QUESTIONS, bankFor, gradeQuestion, inBankOrder, isBuiltIn, pickQuestionIds, questionById, validateDraft, validateMaterial } from "@/lib/product/bank";
import type { CoachSession } from "@/lib/product/model";

const clean = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json();
    return await database(async (db) => {
      const account = await currentAccount(db);
      if (!account) return Response.json({ error: "Please sign in." }, { status: 401 });
      const now = new Date().toISOString();
      let correct: boolean | undefined;
      let session: CoachSession | undefined;
      if (["coach-start", "coach-turn", "coach-next"].includes(body.action) && account.role === "student") {
        try {
          if (body.action === "coach-start") {
            const topic = allTopics.find(t => t.id === body.topic);
            if (!topic || (body.planId !== undefined && typeof body.planId !== "string") || (body.refresherFor !== undefined && typeof body.refresherFor !== "string")) return Response.json({ error: "Choose a valid lesson." }, { status: 400 });
            session = startCoaching(db.workspace, account.id, topic.id, randomUUID(), now, body.planId, body.refresherFor);
          } else if (body.action === "coach-turn") {
            if (typeof body.text !== "string" || typeof body.id !== "string" || !/^[a-zA-Z0-9-]{8,100}$/.test(body.id)) return Response.json({ error: "Write a valid message." }, { status: 400 });
            session = coachingTurn(db.workspace, account.id, String(body.sessionId), body.id, body.text, now);
          } else session = advanceCoaching(db.workspace, account.id, String(body.sessionId), now);
          for (const plan of db.workspace.plans) {
            plan.completed = plan.studentIds.every(id => lessonProgress(db.workspace, plan, id).status === "Completed");
          }
        } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Please try again." }, { status: 400 }); }
      } else if (body.action === "attempt" && account.role === "student") {
        const question = questionById(db.workspace, String(body.questionId));
        if (!question || typeof body.answer !== "string" || body.answer.length > 100) return Response.json({ error: "Choose a valid practice question." }, { status: 400 });
        const id = String(body.id ?? "");
        if (!/^[a-zA-Z0-9-]{8,100}$/.test(id)) return Response.json({ error: "Invalid attempt." }, { status: 400 });
        const previous = db.workspace.attempts.find((a) => a.id === id && a.studentId === account.id);
        correct = previous?.correct ?? gradeQuestion(question, body.answer);
        if (!previous) db.workspace.attempts.push({ id, studentId: account.id, questionId: question.id, topic: question.topic, correct, hints: Math.max(0, Math.min(3, Number(body.hints) || 0)), at: now });
      } else if (body.action === "plan" && account.role === "teacher") {
        const topic = topics.find((t) => t.id === body.topic);
        const studentIds = db.workspace.students.filter((s) => Array.isArray(body.studentIds) && body.studentIds.includes(s.id)).map((s) => s.id);
        if (!topic || !studentIds.length) return Response.json({ error: "Select a topic and at least one student." }, { status: 400 });
        // The teacher's chosen questions, or a random set from the topic's bank (default 3).
        const bank = bankFor(db.workspace, topic.id).map((q) => q.id);
        let questionIds: string[];
        if (Array.isArray(body.questionIds)) {
          questionIds = [...new Set<string>(body.questionIds.map(String))].filter((id) => bank.includes(id));
          if (!questionIds.length || questionIds.length !== body.questionIds.length || questionIds.length > MAX_LESSON_QUESTIONS) return Response.json({ error: `Choose 1 to ${MAX_LESSON_QUESTIONS} questions from this topic's bank.` }, { status: 400 });
          questionIds = inBankOrder(db.workspace, topic.id, questionIds);
        } else questionIds = pickQuestionIds(db.workspace, topic.id, Number(body.count) || DEFAULT_LESSON_QUESTIONS);
        if (!db.workspace.plans.some((p) => p.topic === topic.id && !p.completed && p.studentIds.length === studentIds.length && p.studentIds.every((id) => studentIds.includes(id)))) db.workspace.plans.push({ id: randomUUID(), topic: topic.id, studentIds, at: now, questionIds });
      } else if (body.action === "question-add" && account.role === "teacher") {
        const topic = allTopics.find((t) => t.id === body.topic);
        const hints = Array.isArray(body.hints) ? body.hints.map((h: unknown) => clean(h, 200)).filter(Boolean) : [];
        const draft = { topic: topic?.id as TopicId, prompt: clean(body.prompt, 300), answer: clean(body.answer, 20), hints, explanation: clean(body.explanation, 300), guide: clean(body.guide, 300), simple: clean(body.simple, 300) };
        const problem = topic ? validateDraft(draft) : "Choose a math topic.";
        if (problem) return Response.json({ error: problem }, { status: 400 });
        const source = typeof body.source === "string" && db.workspace.materials?.some((m) => m.id === body.source) ? body.source : undefined;
        if (bankFor(db.workspace, draft.topic).some((q) => q.prompt === draft.prompt)) return Response.json({ error: "That question is already in the bank." }, { status: 400 });
        if ((db.workspace.questions?.length ?? 0) >= 200) return Response.json({ error: "The bank is full. Remove a question first." }, { status: 400 });
        (db.workspace.questions ??= []).push({ id: randomUUID(), ...draft, explanation: draft.explanation || "You kept the whole the same and reasoned one step at a time.", guide: draft.guide || draft.hints[0], simple: draft.simple, source, origin: body.origin === "suggested" ? "suggested" : "teacher", at: now });
      } else if (body.action === "question-remove" && account.role === "teacher") {
        const id = String(body.id ?? "");
        if (isBuiltIn(id) || !db.workspace.questions?.some((q) => q.id === id)) return Response.json({ error: "Choose a question you added." }, { status: 400 });
        if (db.workspace.plans.some((p) => p.questionIds?.includes(id)) || db.workspace.sessions?.some((s) => s.questionIds?.includes(id))) return Response.json({ error: "That question is part of a shared lesson, so it stays in the bank." }, { status: 400 });
        db.workspace.questions = db.workspace.questions.filter((q) => q.id !== id);
      } else if (body.action === "material-add" && account.role === "teacher") {
        const material = validateMaterial(body);
        if ("error" in material) return Response.json({ error: material.error }, { status: 400 });
        if ((db.workspace.materials?.length ?? 0) >= 50) return Response.json({ error: "Remove a material before adding another." }, { status: 400 });
        (db.workspace.materials ??= []).push({ id: randomUUID(), ...material, at: now });
      } else if (body.action === "material-remove" && account.role === "teacher") {
        const id = String(body.id ?? "");
        const material = db.workspace.materials?.find((m) => m.id === id);
        if (!material) return Response.json({ error: "Choose a material." }, { status: 400 });
        if (material.file) await rm(path.join(materialsDirectory, `${material.id}.${material.file.ext}`), { force: true });
        db.workspace.materials = db.workspace.materials!.filter((m) => m.id !== id);
        for (const q of db.workspace.questions ?? []) if (q.source === id) q.source = undefined;
      } else if (body.action === "complete-plan" && account.role === "teacher") {
        const plan = db.workspace.plans.find((p) => p.id === body.id);
        if (!plan || !plan.studentIds.every(id => lessonProgress(db.workspace, plan, id).status === "Completed")) return Response.json({ error: "Completion is recorded when each learner solves the assigned lesson." }, { status: 400 });
        plan.completed = true;
      } else if (body.action === "trace-ack" && account.role === "teacher") {
        const traced = db.workspace.sessions?.find(s => s.id === body.sessionId && s.trace);
        if (!traced?.trace) return Response.json({ error: "Choose a learning alert." }, { status: 400 });
        traced.trace.acknowledgedAt ??= now;
      } else if (body.action === "note" && account.role === "teacher") {
        const text = String(body.text ?? "").trim().slice(0, 1000);
        if (!text || !db.workspace.students.some((s) => s.id === body.studentId)) return Response.json({ error: "Choose a student and write a message." }, { status: 400 });
        db.workspace.notes.push({ id: randomUUID(), studentId: body.studentId, text, author: account.name, authorId: account.id, at: now });
      } else if (body.action === "check" && account.role === "parent") {
        const key = `${account.id}:${String(body.key).slice(0, 80)}`;
        db.workspace.checks = db.workspace.checks.includes(key) ? db.workspace.checks.filter((k) => k !== key) : [...db.workspace.checks, key];
      } else return Response.json({ error: "This action isn’t available for your account." }, { status: 403 });
      return Response.json({ workspace: visibleWorkspace(db.workspace, account), correct, session });
    });
  } catch { return Response.json({ error: "Your update couldn’t be saved. Please try again." }, { status: 500 }); }
}
