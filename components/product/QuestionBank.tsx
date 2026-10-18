"use client";
import { useRef, useState } from "react";
import { allTopics, type TopicId } from "@/lib/product/curriculum";
import { MATERIAL_FILE_LIMIT, bankFor, isBuiltIn, materialExtension, materialsFor, suggestedQuestions, validateDraft, type Draft } from "@/lib/product/bank";
import type { Material, Workspace } from "@/lib/product/model";
import { Icon } from "./Brand";
import type { Mutate } from "./Shared";

const kinds: { value: Material["kind"]; label: string }[] = [
  { value: "handbook", label: "Course handbook" },
  { value: "textbook", label: "Course book" },
  { value: "curriculum", label: "Curriculum material" },
  { value: "other", label: "Other" },
];
const emptyDraft = (topic: TopicId): Draft => ({ topic, prompt: "", answer: "", hints: ["", "", ""], explanation: "", guide: "", simple: "" });

// Teachers see every question Rova can ask in a topic, add their own, accept suggestions, and keep
// the course materials those questions are written from.
export function QuestionBank({ workspace, mutate }: { workspace: Workspace; mutate: Mutate }) {
  const [topic, setTopic] = useState<TopicId>("fractions");
  const [draft, setDraft] = useState<Draft>(emptyDraft("fractions"));
  const [source, setSource] = useState("");
  const [material, setMaterial] = useState<{ title: string; kind: Material["kind"]; topics: TopicId[]; notes: string }>({ title: "", kind: "handbook", topics: ["fractions"], notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const bank = bankFor(workspace, topic);
  const materials = workspace.materials ?? [];
  const topicMaterials = materialsFor(workspace, topic);
  const suggestions = suggestedQuestions(workspace, topic);
  const materialName = (id?: string) => materials.find((m) => m.id === id)?.title;

  async function run(body: Record<string, unknown> | FormData, done: string) {
    if (busy) return false;
    setBusy(true);
    setError("");
    const ok = await mutate(body);
    setBusy(false);
    if (ok) setNote(done);
    return !!ok;
  }
  function chooseTopic(t: TopicId) {
    setTopic(t);
    setDraft(emptyDraft(t));
    setSource("");
    setError("");
  }
  async function addDraft() {
    const problem = validateDraft(draft);
    if (problem) return setError(problem);
    if (await run({ action: "question-add", ...draft, hints: draft.hints.filter((h) => h.trim()), source: source || undefined, origin: "teacher" }, "Your question is in the bank.")) {
      setDraft(emptyDraft(topic));
      setSource("");
    }
  }
  async function addMaterial() {
    if (material.title.trim().length < 2) return setError("Give the material a title.");
    if (!material.topics.length) return setError("Choose at least one topic the material covers.");
    if (file && !materialExtension(file.name)) return setError("Upload a PDF, Word document, or text file.");
    if (file && file.size > MATERIAL_FILE_LIMIT) return setError("Files can be up to 10 MB.");
    const form = new FormData();
    form.set("title", material.title);
    form.set("kind", material.kind);
    form.set("topics", JSON.stringify(material.topics));
    form.set("notes", material.notes);
    if (file) form.set("file", file);
    if (await run(form, `${material.title.trim()} added.`)) {
      setMaterial({ title: "", kind: "handbook", topics: [topic], notes: "" });
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="question-bank">
      <section className="surface">
        <div className="section-heading">
          <div>
            <h2>Course materials</h2>
            <p>Questions are written from these. Add your handbook, course book, and curriculum materials, with the PDF or document, so suggestions reference them.</p>
          </div>
        </div>
        {materials.length ? (
          <ul className="material-list">
            {materials.map((m) => (
              <li key={m.id}>
                <Icon name="book" size={18} />
                <div>
                  <strong>{m.title}</strong>
                  <small>
                    {kinds.find((k) => k.value === m.kind)?.label} · {m.topics.map((t) => allTopics.find((x) => x.id === t)?.name).join(", ")}
                    {m.notes && ` · ${m.notes.length > 160 ? m.notes.slice(0, 160) + "…" : m.notes}`}
                  </small>
                  {m.file && (
                    <a className="material-file" href={`/api/materials/${m.id}`} target="_blank" rel="noopener">
                      <Icon name="arrow" size={14} />
                      {m.file.name} · {m.file.size >= 1024 * 1024 ? `${(m.file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(m.file.size / 1024))} KB`}
                    </a>
                  )}
                </div>
                <button className="text-link" disabled={busy} onClick={() => run({ action: "material-remove", id: m.id }, "Material removed.")}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="quiet">No materials yet. Suggestions are written from the standards until you add some.</p>
        )}
        <form
          className="material-form"
          onSubmit={(e) => {
            e.preventDefault();
            void addMaterial();
          }}
        >
          <label>
            Title
            <input value={material.title} maxLength={120} placeholder="Grade 4 Math Handbook, Unit 5" onChange={(e) => setMaterial({ ...material, title: e.target.value })} />
          </label>
          <label>
            Kind
            <select value={material.kind} onChange={(e) => setMaterial({ ...material, kind: e.target.value as Material["kind"] })}>
              {kinds.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>Covers</legend>
            {allTopics.map((t) => (
              <label key={t.id} className="check">
                <input type="checkbox" checked={material.topics.includes(t.id)} onChange={(e) => setMaterial({ ...material, topics: e.target.checked ? [...material.topics, t.id] : material.topics.filter((x) => x !== t.id) })} />
                {t.name}
              </label>
            ))}
          </fieldset>
          <label className="wide file-field">
            File (PDF, Word, or text · up to 10 MB · optional)
            <input ref={fileInput} type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <label className="wide">
            Notes, pages, or an excerpt the questions should follow
            <textarea value={material.notes} maxLength={2000} rows={2} placeholder="Chapter 5, pages 112–118: equivalent fractions with area models." onChange={(e) => setMaterial({ ...material, notes: e.target.value })} />
          </label>
          <button className="btn btn-outline" disabled={busy}>
            <Icon name="plus" size={16} />
            Add material
          </button>
        </form>
      </section>

      <div className="chip-filter" role="tablist" aria-label="Topic">
        {allTopics.map((t) => (
          <button key={t.id} role="tab" aria-selected={topic === t.id} onClick={() => chooseTopic(t.id)}>
            {t.name}
          </button>
        ))}
      </div>
      {note && (
        <div className="inline-success" role="status">
          <Icon name="check" size={18} />
          {note}
          <button onClick={() => setNote("")} aria-label="Dismiss">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="surface">
        <div className="section-heading">
          <div>
            <h2>
              {allTopics.find((t) => t.id === topic)?.name} · {bank.length} questions in the bank
            </h2>
            <p>Rova picks from these when you share a lesson. Every answer is checked by code.</p>
          </div>
        </div>
        <ol className="bank-list">
          {bank.map((q) => (
            <li key={q.id}>
              <div>
                <p className="bank-prompt">{q.prompt}</p>
                <small>
                  Answer {q.answer} · {isBuiltIn(q.id) ? "Built in" : "Added by you"}
                  {materialName((workspace.questions ?? []).find((x) => x.id === q.id)?.source) && ` · From ${materialName((workspace.questions ?? []).find((x) => x.id === q.id)?.source)}`}
                </small>
                <details>
                  <summary>Hints</summary>
                  <ol>
                    {q.hints.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ol>
                </details>
              </div>
              {!isBuiltIn(q.id) && (
                <button className="text-link" disabled={busy} onClick={() => run({ action: "question-remove", id: q.id }, "Question removed.")}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="surface">
        <div className="section-heading">
          <div>
            <h2>Suggested questions</h2>
            <p>Written by Rova from your materials and the standard, in the same shape as the built-in questions. Add the ones you like.</p>
          </div>
        </div>
        <ol className="bank-list suggestions">
          {suggestions.map((s) => (
            <li key={s.key}>
              <div>
                <p className="bank-prompt">{s.prompt}</p>
                <small>
                  Answer {s.answer} · {s.basis}
                </small>
                <details>
                  <summary>Hints</summary>
                  <ol>
                    {s.hints.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ol>
                </details>
              </div>
              <button className="btn btn-outline btn-small" disabled={busy} onClick={() => run({ action: "question-add", topic: s.topic, prompt: s.prompt, answer: s.answer, hints: s.hints, explanation: s.explanation, guide: s.guide, simple: s.simple, source: s.source, origin: "suggested" }, "Added to the bank.")}>
                <Icon name="plus" size={15} />
                Add to bank
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="surface">
        <div className="section-heading">
          <div>
            <h2>Write your own</h2>
            <p>A question, its answer, and up to three hints that guide without telling.</p>
          </div>
        </div>
        <form
          className="question-form"
          onSubmit={(e) => {
            e.preventDefault();
            void addDraft();
          }}
        >
          <label className="wide">
            Question
            <textarea value={draft.prompt} maxLength={300} rows={2} onChange={(e) => setDraft({ ...draft, prompt: e.target.value })} />
          </label>
          <label>
            Answer (a number)
            <input value={draft.answer} maxLength={20} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} />
          </label>
          <label>
            Written from
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">The standard</option>
              {topicMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          {draft.hints.map((h, i) => (
            <label key={i} className={i === 0 ? "wide" : undefined}>
              Hint {i + 1}
              {i === 0 ? " (a guiding question)" : i === 1 ? " (a picture or a smaller step)" : " (a worked step, no answer)"}
              <input value={h} maxLength={200} onChange={(e) => setDraft({ ...draft, hints: draft.hints.map((x, j) => (j === i ? e.target.value : x)) })} />
            </label>
          ))}
          <label className="wide">
            The idea in plain words, for “Why does this work?” (optional)
            <input value={draft.simple} maxLength={300} placeholder="Cutting each piece into smaller pieces does not change how much is shaded." onChange={(e) => setDraft({ ...draft, simple: e.target.value })} />
          </label>
          <label className="wide">
            What Rova says when the answer is right (optional)
            <input value={draft.explanation} maxLength={300} onChange={(e) => setDraft({ ...draft, explanation: e.target.value })} />
          </label>
          <button className="btn btn-dark" disabled={busy}>
            Add to the bank
            <Icon name="arrow" size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}
