"use client";
import { useEffect, useRef, useState } from "react";
import { hasChatPicture, topicById, type PracticeQuestion, type TopicId } from "@/lib/product/curriculum";
import { builtInFor, isBuiltIn, questionById } from "@/lib/product/bank";
import type { CoachSession, Workspace } from "@/lib/product/model";
import { Icon } from "./Brand";
import { Modal, type Mutate } from "./Shared";
import { LessonVisual } from "./LessonVisual";

export function Practice({ workspace, topicId, planId, refresherFor, sessions = [], mutate, onClose }: { workspace: Workspace; topicId: TopicId; planId?: string; refresherFor?: string; sessions?: CoachSession[]; mutate: Mutate; onClose: () => void }) {
  const topic = topicById(topicId);
  const [session, setSession] = useState<CoachSession | null>(() => [...sessions].reverse().find(s => s.topic === topicId && s.planId === planId && s.refresherFor === refresherFor && (!s.completedAt || planId || refresherFor)) ?? null);
  // The lesson's chosen questions once the session exists; before that, the plan's choice or the built-in set.
  const ids = session?.questionIds?.length ? session.questionIds : planId ? workspace.plans.find(p => p.id === planId)?.questionIds : undefined;
  const chosen = (ids ?? []).map(id => questionById(workspace, id)).filter((item): item is PracticeQuestion => !!item);
  const set = chosen.length ? chosen : builtInFor(topicId);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const thread = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const followLatest = useRef(true);
  const pending = useRef<{ text: string; id: string } | null>(null);
  const locked = useRef(false);
  const q = set[session?.questionIndex ?? 0] ?? set[0];
  const solved = session?.messages.some(m => m.questionId === q.id && m.kind === "correct") ?? false;
  useEffect(() => {
    if (followLatest.current && thread.current) thread.current.scrollTop = thread.current.scrollHeight;
  }, [session?.messages.length]);

  async function start() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError("");
    const response = await mutate({ action: "coach-start", topic: topicId, planId, refresherFor });
    if (response?.session) setSession(response.session);
    else setError("Your coach couldn’t open. Please try again.");
    locked.current = false; setBusy(false);
  }
  async function send(value: string) {
    if (!session || !value.trim() || locked.current) return;
    locked.current = true; setBusy(true); setError(""); followLatest.current = true;
    if (pending.current?.text !== value) pending.current = { text: value, id: crypto.randomUUID() };
    const response = await mutate({ action: "coach-turn", sessionId: session.id, text: value, id: pending.current.id });
    if (response?.session) { setSession(response.session); setText(""); pending.current = null; }
    else setError("Your message wasn’t confirmed. Try sending it again.");
    locked.current = false; setBusy(false); composer.current?.focus({ preventScroll: true });
  }
  async function next() {
    if (!session || locked.current) return;
    locked.current = true; setBusy(true); setError(""); followLatest.current = true;
    const response = await mutate({ action: "coach-next", sessionId: session.id });
    if (response?.session) setSession(response.session);
    else setError("We couldn’t open the next question. Please try again.");
    locked.current = false; setBusy(false);
  }

  return <Modal title={`${topic.name} · Chat with Rova`} onClose={onClose} wide className="practice-dialog">
    {!session ? <div className="coach-welcome"><span className="topic-symbol sage"><Icon name="leaf" size={30}/></span><span className="eyebrow">A coach who helps you think</span><h3>Let’s talk it through.</h3><p>Share a guess, ask a question, or tell Rova where you’re stuck. Your conversation stays here, so you can always look back.</p><button className="btn btn-dark" onClick={start} disabled={busy}>{busy ? "Opening…" : "Start our conversation"}<Icon name="arrow"/></button>{error && <p role="alert">{error}</p>}</div>
    : <div className="practice-messenger">
      <div className="messenger-problem"><div className="messenger-problem-meta"><span>{planId ? "Assigned lesson" : "Practice"} · Question {session.questionIndex + 1} of {set.length}</span><span>{topic.standard}</span></div><h3>{q.prompt}</h3><LessonVisual key={q.id} question={q}/></div>
      <div className="messenger-thread" ref={thread} role="log" aria-label="Conversation with Rova" aria-live="polite" aria-relevant="additions" onScroll={e => { const el = e.currentTarget; followLatest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}>
        <div className="messenger-start"><Icon name="leaf" size={15}/>Rova is here to help you think</div>
        {session.messages.map((message, index) => {
          const previous = session.messages[index - 1];
          const visual = previous && ((message.kind === "hint" && /picture|visual|show/i.test(previous.text)) || message.kind === "explain") ? [questionById(workspace, message.questionId)].find(item => item && isBuiltIn(item.id) && hasChatPicture(item)) : null;
          const nextMessage = session.messages[index + 1];
          const newQuestion = message.role === "coach" && previous && previous.questionId !== message.questionId;
          return <div key={message.id} className={`messenger-turn ${message.role}`}>
            {newQuestion && <div className="messenger-divider">Question {set.findIndex(item => item.id === message.questionId) + 1}</div>}
            <article className={`coach-message ${message.role} ${message.kind ?? ""}`}><span>{message.role === "coach" ? "Rova" : "You"}</span><p>{message.text}</p>{visual && <details className="chat-visual-attachment" open={!nextMessage}><summary>Visual model</summary><LessonVisual question={visual} compact/></details>}<footer>{message.source && <span>{message.source}</span>}<time dateTime={message.at}>{new Date(message.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</time></footer></article>
          </div>;
        })}
      </div>
      <div className="messenger-compose">
        {solved ? <div className="messenger-solved" role="status"><span><Icon name="check" size={17}/>{session.completedAt ? "Lesson complete · Shared with your teacher" : "Answer checked. Nice thinking!"}</span><button className="btn btn-dark" disabled={busy} onClick={session.completedAt ? onClose : next}>{session.completedAt ? "Finish lesson" : "Next question"}<Icon name="arrow" size={16}/></button></div>
        : <div className="messenger-suggestions">{["I’m stuck", "Show me a picture", "Why does this work?"].map(value => <button key={value} disabled={busy} onClick={() => send(value)}>{value}</button>)}</div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <form onSubmit={e => { e.preventDefault(); void send(text); }}><label className="sr-only" htmlFor="rova-message">Message Rova or try an answer</label><textarea ref={composer} id="rova-message" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(text); } }} placeholder="Message Rova or try an answer…" maxLength={600} rows={1} readOnly={busy}/><button className="messenger-send" disabled={busy || !text.trim()} aria-label={busy ? "Sending message" : "Send message"}><Icon name="arrow" size={21}/></button></form>
        <small>Your teacher can see this conversation</small>
      </div>
    </div>}
  </Modal>;
}
