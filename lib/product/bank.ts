// The question bank: built-in questions plus the ones a teacher adds, and rule-generated
// suggestions. Every question's answer is known to code, so grading never depends on a model.
import { check_answer } from "@/lib/math/checkAnswer";
import { allTopics, questions, topicById, type PracticeQuestion, type TopicId } from "./curriculum";
const allTopicIds: TopicId[] = allTopics.map((t) => t.id);
import type { BankQuestion, Material, Workspace } from "./model";

export const DEFAULT_LESSON_QUESTIONS = 3;
export const MATERIAL_KINDS: Material["kind"][] = ["handbook", "textbook", "curriculum", "other"];
// Course files a teacher may upload: PDFs and documents, up to 10 MB.
export const MATERIAL_FILE_TYPES: Record<string, string> = { pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", txt: "text/plain", md: "text/markdown" };
export const MATERIAL_FILE_LIMIT = 10 * 1024 * 1024;
export function materialExtension(name: string): string | null {
  const ext = name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  return ext in MATERIAL_FILE_TYPES ? ext : null;
}
// Checks the fields of a course material the way both the JSON and the upload routes need.
export function validateMaterial(fields: { title?: unknown; kind?: unknown; topics?: unknown; notes?: unknown }): { error: string } | { title: string; kind: Material["kind"]; topics: TopicId[]; notes: string } {
  const title = String(fields.title ?? "").trim().slice(0, 120);
  const kind = MATERIAL_KINDS.find((k) => k === fields.kind);
  const wanted = Array.isArray(fields.topics) ? fields.topics : [];
  const topics = allTopicIds.filter((t) => wanted.includes(t));
  if (title.length < 2 || !topics.length || !kind) return { error: "Give the material a title, a kind, and at least one topic." };
  return { title, kind, topics, notes: String(fields.notes ?? "").trim().slice(0, 2000) };
}
export const MAX_LESSON_QUESTIONS = 10;

export function builtInFor(topic: TopicId): PracticeQuestion[] {
  return questions.filter((q) => q.topic === topic);
}
export function isBuiltIn(id: string): boolean {
  return questions.some((q) => q.id === id);
}
export function bankFor(workspace: Workspace, topic: TopicId): PracticeQuestion[] {
  return [...builtInFor(topic), ...(workspace.questions ?? []).filter((q) => q.topic === topic)];
}
export function questionById(workspace: Workspace, id: string): PracticeQuestion | undefined {
  return questions.find((q) => q.id === id) ?? workspace.questions?.find((q) => q.id === id);
}
export function materialsFor(workspace: Workspace, topic: TopicId): Material[] {
  return (workspace.materials ?? []).filter((m) => m.topics.includes(topic));
}

// Grades any bank question with the shared math checker (exact value, fractions and decimals allowed).
export function gradeQuestion(q: PracticeQuestion, answer: string): boolean {
  if (answer.length > 100 || !/^[\d\s.,/+-]+$/.test(answer.trim())) return false;
  return check_answer({ id: q.id, skill_id: topicById(q.topic).standard, prompt: q.prompt, answer: q.answer }, answer).correct;
}

// A random set of question ids from the topic's bank, kept in bank order so a lesson still builds
// from the first question to the last; at least one, never more than the bank holds.
export function pickQuestionIds(workspace: Workspace, topic: TopicId, count: number, random: () => number = Math.random): string[] {
  const order = bankFor(workspace, topic).map((q) => q.id);
  const pool = [...order];
  const n = Math.max(1, Math.min(Math.floor(count) || DEFAULT_LESSON_QUESTIONS, pool.length, MAX_LESSON_QUESTIONS));
  const out: string[] = [];
  while (out.length < n) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return inBankOrder(workspace, topic, out);
}
export function inBankOrder(workspace: Workspace, topic: TopicId, ids: string[]): string[] {
  const order = bankFor(workspace, topic).map((q) => q.id);
  return [...ids].sort((x, y) => order.indexOf(x) - order.indexOf(y));
}

// Suggested questions come from number templates, one family per topic, so the structure matches
// the built-in questions and the answer is computed, never guessed. The seed changes as the bank
// grows, so accepting a suggestion brings a fresh one.
function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (rnd: () => number, lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
const choice = <T,>(rnd: () => number, items: T[]) => items[Math.floor(rnd() * items.length)];

export type Draft = Omit<BankQuestion, "id" | "at" | "origin" | "source">;
export interface Suggestion extends Draft {
  key: string;
  source?: string;
  basis: string;
}

function template(topic: TopicId, rnd: () => number): Draft {
  switch (topic) {
    case "place-value": {
      const digits: number[] = [];
      while (digits.length < 5) {
        const d = between(rnd, 1, 9);
        if (!digits.includes(d)) digits.push(d);
      }
      const n = Number(digits.join(""));
      const place = between(rnd, 1, 4);
      const d = digits[digits.length - 1 - place];
      const names = ["ones", "tens", "hundreds", "thousands", "ten thousands"];
      const value = d * 10 ** place;
      return {
        topic,
        prompt: `In ${n.toLocaleString("en-US")}, what is the value of the digit ${d}?`,
        answer: String(value),
        hints: ["Start at the ones place and move left.", `The ${d} is in the ${names[place]} place.`, `Multiply the digit by the value of its place: ${d} × ${(10 ** place).toLocaleString("en-US")}.`],
        explanation: `The ${d} stands for ${d} ${names[place]}. Each place to the left is ten times larger.`,
        guide: "Each place is ten times the place to its right, so read the place label before deciding what a digit is worth.",
        simple: `Every digit has a job. The place tells you its job. The ${d} is standing in the ${names[place]} place, so it counts ${names[place]}, not ones.`,
      };
    }
    case "multiplication": {
      const r = between(rnd, 3, 9);
      const n = between(rnd, 12, 19);
      const [thing, box] = choice(rnd, [["crayons", "boxes"], ["apples", "baskets"], ["stickers", "sheets"], ["marbles", "jars"]]);
      return {
        topic,
        prompt: `There are ${r} ${box} with ${n} ${thing} in each. How many ${thing} are there altogether?`,
        answer: String(r * n),
        hints: [`Split ${n} into 10 and ${n - 10}.`, `Find ${r} × 10 and ${r} × ${n - 10} separately.`, `Add the two parts: ${r * 10} + ${r * (n - 10)}.`],
        explanation: `${r} × ${n} = (${r} × 10) + (${r} × ${n - 10}). Breaking a number into tens and ones makes multiplication easier.`,
        guide: `Build it with partial products: split ${n} into 10 and ${n - 10}, find each part times ${r}, then combine them.`,
        simple: `Picture ${r} ${box}. Split each one into 10 ${thing} and ${n - 10} ${thing}. Count the tens part, count the rest, then add them.`,
      };
    }
    case "division": {
      const g = between(rnd, 3, 8);
      const k = between(rnd, 12, 29);
      const total = g * k;
      const chunk = g * 10;
      const [thing, who] = choice(rnd, [["stickers", "friends"], ["seeds", "pots"], ["cards", "players"], ["beads", "bags"]]);
      return {
        topic,
        prompt: `${total} ${thing} are shared equally among ${g} ${who}. How many does each get?`,
        answer: String(k),
        hints: [`Split ${total} into ${chunk} and ${total - chunk}.`, `Share ${chunk} among ${g}: that is 10 each.`, `Share the remaining ${total - chunk} among ${g}, then add that to 10.`],
        explanation: `${total} ÷ ${g} = ${k}. Check it: ${k} × ${g} = ${total}.`,
        guide: `Share ${total} into ${g} equal groups: share a friendly chunk like ${chunk} first, then share what remains, and combine each group’s portions.`,
        simple: `Sharing fairly means every one of the ${g} ${who} gets the same. Share a big friendly chunk first, like ${chunk}, then share what is left.`,
      };
    }
    case "fractions": {
      const b = choice(rnd, [2, 3, 4, 5]);
      const a = between(rnd, 1, b - 1);
      const k = between(rnd, 2, 4);
      return {
        topic,
        prompt: `Fill in the missing numerator: ${a}/${b} = ?/${b * k}`,
        answer: String(a * k),
        hints: [`What did you multiply ${b} by to get ${b * k}?`, "Multiply the top and bottom by the same number.", `The denominator was multiplied by ${k}, so multiply the numerator by ${k} too.`],
        explanation: `${a}/${b} and ${a * k}/${b * k} are equivalent fractions: both parts were multiplied by ${k}.`,
        guide: "Same whole, smaller equal pieces: whatever happens to the bottom number must happen to the top number too.",
        simple: `Cutting each piece into ${k} smaller pieces does not change how much is shaded. Whatever happens to the bottom number, do the same to the top number.`,
      };
    }
    case "measurement": {
      const kind = between(rnd, 0, 2);
      if (kind === 0) {
        const m = between(rnd, 2, 9);
        return { topic, prompt: `A garden path is ${m} meters long. How many centimeters is that?`, answer: String(m * 100), hints: ["There are 100 centimeters in one meter.", `You have ${m} groups of 100.`, `Multiply ${m} × 100.`], explanation: "When converting meters to centimeters, multiply by 100.", guide: `One big unit, repeated: each meter is 100 centimeters, and the path has ${m} of them.`, simple: `A meter is a big step. Each meter hides 100 centimeters inside it. ${m} meters means ${m} groups of 100.` };
      }
      if (kind === 1) {
        const kg = between(rnd, 2, 9);
        return { topic, prompt: `A sack of rice weighs ${kg} kilograms. How many grams is that?`, answer: String(kg * 1000), hints: ["One kilogram is 1,000 grams.", `${kg} kilograms is ${kg} groups of 1,000.`, `Multiply ${kg} × 1,000.`], explanation: "The prefix kilo means one thousand.", guide: `One big unit, repeated: each kilogram is 1,000 grams, and the sack has ${kg} of them.`, simple: `Kilo means a thousand. One kilogram is 1,000 grams, so ${kg} kilograms is ${kg} groups of 1,000.` };
      }
      const h = between(rnd, 2, 6);
      return { topic, prompt: `A school day lasts ${h} hours. How many minutes is that?`, answer: String(h * 60), hints: ["One hour contains 60 minutes.", `Add 60 ${h} times.`, `Think ${h} × 6, then multiply by 10.`], explanation: "Converting a larger unit to a smaller unit uses multiplication.", guide: `One big unit, repeated: each hour is 60 minutes, and there are ${h} of them.`, simple: `An hour is 60 minutes. ${h} hours is ${h} groups of 60. Add them or multiply.` };
    }
    case "geometry": {
      if (rnd() < 0.5) {
        const x = choice(rnd, [40, 50, 70, 80, 110, 130, 150]);
        return { topic, prompt: `A straight line is 180°. A ramp leans ${x}° away from it on one side. How many degrees are left on the other side?`, answer: String(180 - x), hints: ["A straight line is a half-turn: 180°.", `The ramp’s angle and the rest must add up to 180.`, `Take ${x} away from 180.`], explanation: `Angles on a straight line add up to 180°, so the other side is 180 − ${x}.`, guide: "The parts add up to the whole angle. A straight angle is 180°, so subtract the known part from the whole.", simple: `A straight line is a half-turn, 180°. The ramp uses ${x}° of it. What is left is 180° with ${x}° taken away.` };
      }
      const x = choice(rnd, [20, 25, 30, 40, 45, 50, 65, 70]);
      return { topic, prompt: `A book lies open at a square corner (90°). One cover is tilted ${x}° from the table. How many degrees are left to the other cover?`, answer: String(90 - x), hints: ["The two parts add up to the whole square corner.", "The whole corner is 90°.", `Take ${x} away from 90.`], explanation: `The parts of a right angle add up to 90°, so the rest is 90 − ${x}.`, guide: "The parts add up to the whole angle. A square corner is 90°, so subtract the known part from the whole.", simple: `The covers open inside a square corner, 90°. One cover uses ${x}° of it. What is left of the 90° is the missing part.` };
    }
    case "ratios": {
      const [a, b] = choice(rnd, [[1, 4], [2, 5], [3, 4], [2, 7], [3, 5]]);
      const k = between(rnd, 2, 5);
      return { topic, prompt: `A smoothie uses ${a} cups of fruit for every ${b} cups of juice. How many cups of juice go with ${a * k} cups of fruit?`, answer: String(b * k), hints: [`Make a ratio table: ${a} fruit to ${b} juice.`, `How did ${a} cups of fruit become ${a * k}? You multiplied by ${k}.`, `Multiply the juice by the same number: ${b} × ${k}.`], explanation: `Equivalent ratios scale both parts by the same factor: ${a}:${b} = ${a * k}:${b * k}.`, guide: `Use a ratio table: ${a} cups of fruit to ${b} cups of juice. Whatever you multiply one part by, multiply the other part by the same number.`, simple: `A ratio is a recipe. ${a} fruit with ${b} juice. Make the recipe bigger by multiplying both parts by the same number.` };
    }
  }
}

export function suggestedQuestions(workspace: Workspace, topic: TopicId, count = 3): Suggestion[] {
  const existing = bankFor(workspace, topic);
  const materials = materialsFor(workspace, topic);
  const rnd = seeded(`${topic}:${existing.length}:${materials.length}`);
  const out: Suggestion[] = [];
  for (let attempt = 0; attempt < 40 && out.length < count; attempt++) {
    const draft = template(topic, rnd);
    if (existing.some((q) => q.prompt === draft.prompt) || out.some((q) => q.prompt === draft.prompt)) continue;
    const source = materials.length ? materials[out.length % materials.length] : undefined;
    out.push({ ...draft, key: `${topic}-${attempt}`, source: source?.id, basis: source ? `Written from ${source.title}` : `Written from the ${topicById(topic).standard} standard; add course materials to reference them` });
  }
  return out;
}

// Checks a teacher-written or accepted question before it enters the bank.
export function validateDraft(draft: Partial<Draft>): string | null {
  if (!draft.topic) return "Choose a topic.";
  const prompt = (draft.prompt ?? "").trim();
  if (prompt.length < 8 || prompt.length > 300) return "Write the question in 8 to 300 characters.";
  const answer = (draft.answer ?? "").trim();
  if (!answer || !/^[\d\s.,/+-]+$/.test(answer) || answer.length > 20) return "The answer must be a number (fractions like 3/4 are fine).";
  const hints = (draft.hints ?? []).map((h) => h.trim()).filter(Boolean);
  if (hints.length < 1 || hints.some((h) => h.length > 200)) return "Add at least one hint (each up to 200 characters).";
  // A hint may use the numbers in the problem, but it must not say "the answer is 12" or "... = 12".
  const value = answer.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const tells = new RegExp(`(?:\\banswer\\b[^\\d]{0,12}|\\b(?:is|equals|makes|gives|get|gets)\\s+|=\\s*)${value}(?![\\d])|\\b${value}\\s+(?:is|’s|'s)\\s+(?:the\\s+)?answer`, "i");
  if (hints.some((h) => tells.test(h.replace(/,/g, "")))) return "A hint states the answer; hints should guide, not tell.";
  return null;
}
