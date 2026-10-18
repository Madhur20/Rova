"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  getState,
  logEvents,
  onDemoReset,
  reportToTeacher,
  useRovaState,
} from "@/lib/data/store";
import { get_learner_profile } from "@/lib/rules/engine";
import { find_source } from "@/content/lessons";
import { getRatioTable, make_practice, demoProblems } from "@/lib/tutor/problems";
import { classify_intent, explain_is_complete } from "@/lib/tutor/intent";
import type {
  Intent,
  SkillId,
  TutorContext,
  TutorMode,
  TutorReply,
} from "@/lib/types";

type Screen = "home" | "problem" | "refresher" | "explain" | "win";

interface ConversationMessage {
  id: number;
  sender: "maya" | "buddy" | "system";
  text: string;
  source?: string;
  intent?: Intent;
  hintLevel?: number;
  quickReplies?: string[];
}

interface PendingTeacherReport {
  kind: "safety_concern" | "student_question";
  message: string;
  skillId: SkillId;
}

const fractionModels: Record<string, { numerator: number; denominator: number }> = {
  "fraction-refresher-1": { numerator: 2, denominator: 3 },
  "fraction-refresher-2": { numerator: 3, denominator: 5 },
  "fraction-refresher-3": { numerator: 1, denominator: 4 },
};

function clockNow(): number {
  return Date.now();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTutorReply(value: unknown): value is TutorReply {
  if (!isRecord(value)) return false;
  return (
    typeof value.text === "string" &&
    ["answer", "ask_answer", "stuck", "explain", "unsafe", "off_topic"].includes(
      String(value.intent),
    ) &&
    (value.hint_level === 0 ||
      value.hint_level === 1 ||
      value.hint_level === 2 ||
      value.hint_level === 3) &&
    Array.isArray(value.quick_replies) &&
    value.quick_replies.every((item) => typeof item === "string") &&
    Array.isArray(value.events)
  );
}

export default function StudentTutor({
  welcomeMessage,
}: {
  welcomeMessage: string;
}) {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<TutorMode>("problem");
  const state = useRovaState();
  const profile = get_learner_profile(state, "maya");
  const [problemIndex, setProblemIndex] = useState(0);
  const [refresherIndex, setRefresherIndex] = useState(0);
  const [refresherSkillId, setRefresherSkillId] = useState<SkillId | null>(null);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [tableEntry, setTableEntry] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [teacherReportSent, setTeacherReportSent] = useState(false);
  const lastResponseAt = useRef(0);
  const messageId = useRef(0);
  const requestGeneration = useRef(0);
  const pendingTeacherReport = useRef<PendingTeacherReport | null>(null);

  const student = profile.student;
  const problem = demoProblems[problemIndex];
  const refresherQuestions = refresherSkillId
    ? make_practice(refresherSkillId, 0, "")
    : [];
  const activeProblem =
    screen === "refresher"
      ? (refresherQuestions[refresherIndex] ?? problem)
      : problem;
  const table = getRatioTable(problem.id);
  const recentReply = [...messages].reverse().find((message) => message.sender === "buddy");
  const source = find_source(activeProblem.skill_id, activeProblem.prompt);

  useEffect(() => {
    lastResponseAt.current = clockNow();
  }, []);

  useEffect(
    () =>
      onDemoReset(() => {
        const generation = ++requestGeneration.current;
        pendingTeacherReport.current = null;
        setScreen("home");
        setMode("problem");
        setProblemIndex(0);
        setRefresherIndex(0);
        setRefresherSkillId(null);
        setHintLevel(0);
        setMessages([]);
        setDraft("");
        setBusy(false);
        setError("");
        setTeacherReportSent(false);
        setTableEntry("");
        setStatus("Demo reset to Maya's seeded learning profile.");
        lastResponseAt.current = clockNow();

        void fetch("/api/tutor/reset", { method: "POST" })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Could not reset reply templates (${response.status}).`);
            }
          })
          .catch((resetError: unknown) => {
            if (generation !== requestGeneration.current) return;
            setError(
              resetError instanceof Error
                ? resetError.message
                : "Tutor reply templates could not be reset.",
            );
          });
      }),
    [],
  );

  function addMessage(message: Omit<ConversationMessage, "id">) {
    messageId.current += 1;
    setMessages((current) => [...current, { ...message, id: messageId.current }]);
  }

  function dismissQuickReplies() {
    setMessages((current) => {
      const latestBuddyMessage = [...current]
        .reverse()
        .find((message) => message.sender === "buddy");
      return latestBuddyMessage
        ? current.map((message) =>
            message.id === latestBuddyMessage.id
              ? { ...message, quickReplies: [] }
              : message,
          )
        : current;
    });
  }

  function updateDraft(value: string) {
    setDraft(value);
    if (value.trim()) setTeacherReportSent(false);
  }

  function startMission() {
    pendingTeacherReport.current = null;
    setScreen("problem");
    setMode("problem");
    setHintLevel(0);
    setMessages([]);
    setTableEntry("");
    setError("");
    setStatus("");
  }

  function changeProblem() {
    pendingTeacherReport.current = null;
    setProblemIndex((index) => (index + 1) % demoProblems.length);
    setScreen("problem");
    setMode("problem");
    setHintLevel(0);
    setMessages([]);
    setTableEntry("");
    setError("");
    setStatus("New ratio problem. Your progress is saved in this session.");
  }

  function beginExplain() {
    dismissQuickReplies();
    setScreen("explain");
    setMode("explain");
    setError("");
    setStatus("");
  }

  async function sendInput(value: string) {
    const input = value.trim();
    if (!input || busy) return;
    const generation = requestGeneration.current;
    const skillId = activeProblem.skill_id;
    pendingTeacherReport.current = null;
    setTeacherReportSent(false);
    setBusy(true);
    setError("");
    setStatus("");
    if (screen === "problem" && classify_intent(input, mode) === "answer") {
      setTableEntry(input);
    }
    addMessage({ sender: "maya", text: input });

    const context: TutorContext = {
      profile,
      problem_id: activeProblem.id,
      hint_level: screen === "refresher" ? 0 : hintLevel,
      mode,
    };
    const elapsedSeconds =
      lastResponseAt.current === 0
        ? 0
        : Math.max(0, Math.floor((clockNow() - lastResponseAt.current) / 1000));

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, context, seconds: elapsedSeconds }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : `Tutor request failed (${response.status}).`;
        throw new Error(message);
      }
      if (!isTutorReply(payload)) {
        throw new Error("Tutor returned an invalid response. Please try again.");
      }
      if (generation !== requestGeneration.current) return;
      const reply = payload;
      lastResponseAt.current = clockNow();
      addMessage({
        sender: "buddy",
        text: reply.text,
        source: reply.source,
        intent: reply.intent,
        hintLevel: reply.hint_level,
        quickReplies: reply.quick_replies,
      });
      const createdAlerts = reply.events.length > 0 ? logEvents(reply.events) : [];

      if (reply.intent === "unsafe" || reply.intent === "off_topic") {
        const report: PendingTeacherReport = {
          kind: reply.intent === "unsafe" ? "safety_concern" : "student_question",
          message: input,
          skillId,
        };
        pendingTeacherReport.current = report;
        if (report.kind === "safety_concern") sendTeacherReport(report);
      }
      if (reply.hint_level !== hintLevel) setHintLevel(reply.hint_level);
      if (reply.next_mode === "refresher") {
        const latestState = getState();
        const alert = [...createdAlerts, ...latestState.alerts].find(
          (item) =>
            item.student_id === student.id &&
            item.skill_id === problem.skill_id &&
            item.root_cause !== null &&
            (item.status === "open" || item.status === "acted"),
        );
        const rootCause = alert?.root_cause;
        if (rootCause && make_practice(rootCause, 0, "").length > 0) {
          setRefresherSkillId(rootCause);
          setRefresherIndex(0);
          setMode("refresher");
          setScreen("refresher");
          setStatus(
            `Root-cause refresher: ${latestState.skillMap[rootCause]?.name ?? rootCause}.`,
          );
        } else {
          setMode("problem");
          setScreen("problem");
          setStatus(
            "We couldn't find a practice set for the traced skill, so let's keep working on this ratio.",
          );
        }
      } else if (reply.next_mode === "explain") {
        setMode("explain");
        setScreen("explain");
      }

      const correctAnswer = reply.events.some((item) => item.correct === true);
      if (correctAnswer && mode === "refresher") {
        if (refresherIndex + 1 < refresherQuestions.length) {
          setRefresherIndex((index) => index + 1);
        } else {
          setMode("problem");
          setScreen("problem");
          setHintLevel(0);
          setTableEntry("");
          dismissQuickReplies();
          setStatus("All 3 refresher checks complete. Try your ratio problem again.");
        }
      }
      if (mode === "explain" && explain_is_complete(input)) {
        setScreen("win");
      }
    } catch (requestError) {
      if (generation !== requestGeneration.current) return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Tutor request failed. Please try again.",
      );
    } finally {
      if (generation === requestGeneration.current) setBusy(false);
    }
  }

  function sendTeacherReport(report: PendingTeacherReport) {
    try {
      reportToTeacher({
        student_id: student.id,
        skill_id: report.skillId,
        kind: report.kind,
        message: report.message,
      });
      setError("");
      setTeacherReportSent(true);
    } catch (reportError) {
      setError(
        reportError instanceof Error
          ? `Could not send your message to Ms. Rivera: ${reportError.message}`
          : "Could not send your message to Ms. Rivera.",
      );
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = draft;
    setDraft("");
    void sendInput(input);
  }

  function onQuickReply(reply: string) {
    if (busy) return;
    if (reply === "Change problem") {
      changeProblem();
    } else if (reply === "Explain it back") {
      beginExplain();
    } else if (reply === "Finish mission") {
      dismissQuickReplies();
      setScreen("win");
    } else if (reply === "Send to my teacher") {
      dismissQuickReplies();
      const report = pendingTeacherReport.current;
      if (!report) {
        setError("There is no recent message to send to your teacher.");
        return;
      }
      sendTeacherReport(report);
    } else if (reply === "Back to my mission" || reply === "Back to my ratio") {
      dismissQuickReplies();
      setScreen("problem");
      setMode("problem");
    } else if (
      reply === "Next check" ||
      reply === "Try again" ||
      reply === "Try another answer"
    ) {
      dismissQuickReplies();
      setStatus("Type your next answer below.");
    } else {
      void sendInput(reply);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {screen === "home" ? "Welcome back, Maya!" : "Maya's learning space"}
          </h2>
          <p className="text-sm text-slate-600">
            {student.buddy_name} · rule-based (AI planned)
          </p>
        </div>
        <div className="flex gap-2">
          {screen !== "home" && screen !== "win" && (
            <button
              type="button"
              onClick={changeProblem}
              disabled={busy}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-50 disabled:opacity-50"
            >
              Change problem
            </button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {status && (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {status}
        </div>
      )}
      {teacherReportSent && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
          <strong>Sent to Ms. Rivera</strong>
        </div>
      )}

      {screen === "home" && (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl bg-indigo-700 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-200">
              Your buddy says
            </p>
            <p className="mt-3 text-xl font-medium">{welcomeMessage}</p>
            <p className="mt-2 text-sm text-indigo-100">
              We’ll use a picture, try a hint, and check your math with code.
            </p>
            <button
              type="button"
              onClick={startMission}
              className="mt-5 rounded-lg bg-white px-4 py-2.5 font-semibold text-indigo-800 hover:bg-indigo-50"
            >
              Start today’s mission
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Today’s mission</h3>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                About 10 min
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Solve a ratio-table problem and explain how you kept the ratio the same.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div
                className="grid h-14 w-14 place-items-center rounded-full border-4 border-indigo-200 text-sm font-bold text-indigo-800"
                aria-label={`${Math.round((profile.skills[0]?.mastery ?? 0) * 100)} percent mastery`}
              >
                {Math.round((profile.skills[0]?.mastery ?? 0) * 100)}%
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Ratios with tables</p>
                <p className="text-xs text-slate-500">Your practice progress</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Your skill map</h3>
              <span className="text-xs text-slate-500">Progress updates in this session</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {profile.skills.map((skill) => {
                const details = state.skillMap[skill.skill_id];
                const progress = Math.round(skill.mastery * 100);
                return (
                  <div key={skill.skill_id} className="rounded-xl bg-slate-50 p-3">
                    <p className="min-h-10 text-sm font-medium text-slate-800">
                      {details?.name ?? skill.skill_id}
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{progress}% practice progress</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {screen === "problem" && (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-indigo-700">Ratio mission</span>
                <button
                  type="button"
                  onClick={changeProblem}
                  className="text-sm font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2"
                >
                  Change problem
                </button>
              </div>
              <h2 className="mt-3 text-xl font-semibold leading-relaxed text-slate-900">
                {problem.prompt}
              </h2>
              {table && (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-72 border-separate border-spacing-1 text-center text-sm">
                    <caption className="mb-2 text-left text-xs text-slate-500">
                      Ratio table · multiply or divide both rows by the same amount
                    </caption>
                    <thead>
                      <tr>
                        <th className="text-left font-medium text-slate-500">Quantity</th>
                        <th className="rounded-lg bg-slate-100 p-2">Start</th>
                        <th className="rounded-lg bg-indigo-50 p-2 text-indigo-900">New pair</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th className="py-2 text-left font-medium text-slate-700">{table.firstLabel}</th>
                        <td className="rounded-lg bg-slate-100 p-2">{table.firstStart}</td>
                        <td className="rounded-lg bg-indigo-50 p-2">
                          {table.targetSide === "first" ? table.target : tableEntry || "?"}
                        </td>
                      </tr>
                      <tr>
                        <th className="py-2 text-left font-medium text-slate-700">{table.secondLabel}</th>
                        <td className="rounded-lg bg-slate-100 p-2">{table.secondStart}</td>
                        <td className="rounded-lg bg-indigo-50 p-2">
                          {table.targetSide === "second" ? table.target : tableEntry || "?"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-2 text-xs text-slate-500">
                    Type the missing value below to complete the table.
                  </p>
                </div>
              )}
              {source && (
                <p className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                  Source: {source.ref}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Hint ladder</h3>
                <span className="text-xs text-slate-500">{hintLevel} of 3 unlocked</span>
              </div>
              <ol className="mt-3 grid gap-2 sm:grid-cols-3">
                {["Guiding question", "Picture or model", "Worked step"].map((label, index) => {
                  const level = index + 1;
                  const unlocked = hintLevel >= level;
                  const hintMessage = [...messages].reverse().find(
                    (message) =>
                      message.sender === "buddy" &&
                      (message.intent === "stuck" || message.intent === "ask_answer") &&
                      message.hintLevel === level,
                  );
                  return (
                    <li
                      key={label}
                      className={`rounded-xl border p-3 text-sm ${
                        unlocked
                          ? "border-indigo-200 bg-indigo-50 text-indigo-950"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      <span className="font-semibold">{level}. {label}</span>
                      <p className="mt-1 text-xs">
                        {unlocked && hintMessage
                          ? hintMessage.text
                          : unlocked
                            ? "Unlocked"
                            : "Locked — ask for help to open"}
                      </p>
                    </li>
                  );
                })}
              </ol>
              <button
                type="button"
                onClick={() => void sendInput("I’m stuck")}
                disabled={busy}
                className="mt-4 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 disabled:opacity-50"
              >
                I’m stuck — give me a hint
              </button>
            </div>
          </div>

          <div className="flex min-h-96 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <h3 className="font-semibold text-slate-900">Talk it through</h3>
              <p className="text-xs text-slate-500">Your answer is checked by math code, not AI.</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
              {messages.length === 0 && (
                <div className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-950">
                  Start with an attempt, or ask for a hint. The final answer stays yours.
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[92%] rounded-xl p-3 text-sm ${
                    message.sender === "maya"
                      ? "ml-auto bg-indigo-700 text-white"
                      : message.sender === "system"
                        ? "mx-auto bg-emerald-50 text-emerald-900"
                        : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {message.text}
                  {message.source && (
                    <p className="mt-2 border-t border-slate-300/60 pt-2 text-xs opacity-80">
                      Source: {message.source}
                    </p>
                  )}
                </div>
              ))}
              {busy && <p className="text-sm text-slate-500">Rova is thinking…</p>}
            </div>
            {recentReply?.quickReplies && (
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {recentReply.quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => onQuickReply(reply)}
                    disabled={busy}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={onSubmit} className="flex gap-2 border-t border-slate-100 p-3">
              <label className="sr-only" htmlFor="tutor-input">Type an answer or question</label>
              <input
                id="tutor-input"
                value={draft}
                onChange={(event) => {
                  const value = event.target.value;
                  updateDraft(value);
                  setTableEntry(
                    classify_intent(value, mode) === "answer" ? value : "",
                  );
                }}
                maxLength={500}
                placeholder="Type your answer or ask for help…"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </section>
      )}

      {screen === "refresher" && (
        <section className="mx-auto max-w-3xl space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-900">Quick refresher · Traced root cause</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Let’s practice {state.skillMap[refresherSkillId ?? ""]?.name ?? "this skill"}
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              Skill {refresherSkillId} · Check {refresherIndex + 1} of {refresherQuestions.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              {source?.ref ?? refresherSkillId}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              {activeProblem.prompt}
            </h3>
            {fractionModels[activeProblem.id] && (
              <>
                <div
                  className="mt-4 flex h-10 max-w-xs overflow-hidden rounded-lg border border-slate-200"
                  aria-label={`${fractionModels[activeProblem.id].numerator} of ${fractionModels[activeProblem.id].denominator} equal parts shaded`}
                >
                  {Array.from(
                    { length: fractionModels[activeProblem.id].denominator },
                    (_, index) => (
                      <div
                        key={index}
                        className={`flex-1 border-r border-white last:border-r-0 ${
                          index < fractionModels[activeProblem.id].numerator
                            ? "bg-indigo-500"
                            : "bg-indigo-100"
                        }`}
                      />
                    ),
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  A visual model: equal parts can name the same amount.
                </p>
              </>
            )}
          </div>
          <Conversation messages={messages} busy={busy} />
          {recentReply?.quickReplies && (
            <div className="flex flex-wrap gap-2">
              {recentReply.quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => onQuickReply(reply)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}
          <TutorInput
            draft={draft}
            busy={busy}
            onDraftChange={updateDraft}
            onSubmit={onSubmit}
            placeholder="Type an equivalent fraction…"
          />
          <button
            type="button"
            onClick={() => {
              setMode("problem");
              setScreen("problem");
              setHintLevel(0);
            }}
            className="text-sm font-medium text-indigo-700 underline"
          >
            Back to my ratio
          </button>
        </section>
      )}

      {screen === "explain" && (
        <section className="mx-auto max-w-3xl space-y-4">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <p className="text-sm font-semibold text-indigo-800">Explain it back</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              How did you keep the ratio equivalent?
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              In your own words, tell how you changed both amounts.
            </p>
          </div>
          <Conversation messages={messages} busy={busy} />
          {recentReply?.quickReplies && (
            <div className="flex flex-wrap gap-2">
              {recentReply.quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => onQuickReply(reply)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}
          <TutorInput
            draft={draft}
            busy={busy}
            onDraftChange={updateDraft}
            onSubmit={onSubmit}
            placeholder="I multiplied both…"
          />
        </section>
      )}

      {screen === "win" && (
        <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-800" aria-hidden="true">
            ✓
          </div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-emerald-700">Mission complete</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">You did the thinking, Maya!</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-600">
            You checked your answer and explained why both parts change together. Your ratio skill progress is updated for this session.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={changeProblem}
              className="rounded-lg bg-indigo-700 px-4 py-2.5 font-semibold text-white hover:bg-indigo-800"
            >
              Try another problem
            </button>
            <button
              type="button"
              onClick={() => setScreen("home")}
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to home
            </button>
          </div>
        </section>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500">
        <span>
          Events: {state.events.filter((event) => event.student_id === student.id).length} · shared with the Teacher view in this browser
        </span>
        <span>Parent message delivery is simulated.</span>
      </footer>
    </div>
  );
}

function Conversation({
  messages,
  busy,
}: {
  messages: ConversationMessage[];
  busy: boolean;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-live="polite">
      {messages.length === 0 && (
        <p className="text-sm text-slate-600">Your buddy is ready when you are.</p>
      )}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`max-w-[90%] rounded-xl p-3 text-sm ${
            message.sender === "maya"
              ? "ml-auto bg-indigo-700 text-white"
              : message.sender === "system"
                ? "mx-auto bg-emerald-50 text-emerald-900"
                : "bg-slate-100 text-slate-800"
          }`}
        >
          {message.text}
          {message.source && (
            <p className="mt-2 border-t border-slate-300 pt-2 text-xs opacity-80">
              Source: {message.source}
            </p>
          )}
        </div>
      ))}
      {busy && <p className="text-sm text-slate-500">Rova is thinking…</p>}
    </div>
  );
}

function TutorInput({
  draft,
  busy,
  onDraftChange,
  onSubmit,
  placeholder,
}: {
  draft: string;
  busy: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  placeholder: string;
}) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <label className="sr-only" htmlFor="tutor-input">Type your response</label>
      <input
        id="tutor-input"
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        maxLength={500}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <button
        type="submit"
        disabled={busy || !draft.trim()}
        className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
