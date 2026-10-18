import { getProblem } from "@/lib/tutor/problems";
import { respond } from "@/lib/tutor/responder";
import type { TutorContext } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTutorContext(value: unknown): value is TutorContext {
  if (!isRecord(value) || !isRecord(value.profile)) return false;
  const profile = value.profile;
  if (
    !isRecord(profile.student) ||
    !Array.isArray(profile.skills) ||
    !Array.isArray(profile.preferences)
  ) {
    return false;
  }

  const student = profile.student;
  return (
    typeof student.id === "string" &&
    typeof student.first_name === "string" &&
    typeof student.grade === "number" &&
    typeof student.buddy_name === "string" &&
    typeof student.language_home === "string" &&
    Array.isArray(student.interests) &&
    student.interests.every((interest) => typeof interest === "string") &&
    profile.preferences.every((preference) => typeof preference === "string") &&
    profile.skills.every(
      (skill) =>
        isRecord(skill) &&
        typeof skill.student_id === "string" &&
        typeof skill.skill_id === "string" &&
        typeof skill.mastery === "number" &&
        skill.mastery >= 0 &&
        skill.mastery <= 1 &&
        Array.isArray(skill.misconceptions) &&
        skill.misconceptions.every((item) => typeof item === "string") &&
        typeof skill.last_seen === "string",
    ) &&
    typeof value.problem_id === "string" &&
    (value.hint_level === 0 ||
      value.hint_level === 1 ||
      value.hint_level === 2 ||
      value.hint_level === 3) &&
    (value.mode === "problem" ||
      value.mode === "refresher" ||
      value.mode === "explain")
  );
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    throw error;
  }

  if (!isRecord(payload) || typeof payload.input !== "string") {
    return Response.json({ error: "A text input is required." }, { status: 400 });
  }
  if (payload.input.trim().length === 0 || payload.input.length > 500) {
    return Response.json(
      { error: "Input must contain 1 to 500 characters." },
      { status: 400 },
    );
  }
  if (!isTutorContext(payload.context)) {
    return Response.json({ error: "Tutor context is invalid." }, { status: 400 });
  }

  const problem = getProblem(payload.context.problem_id);
  if (!problem) {
    return Response.json({ error: "The selected problem was not found." }, { status: 400 });
  }
  const seconds = payload.seconds;
  if (
    seconds !== undefined &&
    (typeof seconds !== "number" ||
      !Number.isFinite(seconds) ||
      seconds < 0 ||
      seconds > 86400)
  ) {
    return Response.json({ error: "Elapsed time is invalid." }, { status: 400 });
  }

  const reply = respond(payload.input, payload.context);
  if (typeof seconds === "number") {
    reply.events = reply.events.map((item) => ({
      ...item,
      seconds: Math.floor(seconds),
    }));
  }
  return Response.json(reply);
}
