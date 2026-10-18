import { topics, type TopicId } from "@/lib/product/curriculum";
import { scoreFor, type Learner, type Workspace } from "@/lib/product/model";
import { Icon } from "./Brand";

export function StudentLearningInsights({ student, workspace, onPractice }: { student: Learner; workspace: Workspace; onPractice: (topic: TopicId) => void }) {
  const skills = topics.map(t => ({ ...t, score: scoreFor(student, t.id, workspace.attempts) }));
  const strengths = skills.filter(t => t.score !== null && t.score >= 80);
  const growth = skills.filter(t => t.score !== null && t.score < 80).sort((a, b) => a.score! - b.score!).slice(0, 3);
  return <div className="dashboard-bottom-grid learning-balance"><section className="surface wins-panel"><h2>Your strengths</h2>{strengths.length ? strengths.map(t => <div className="strength-row" key={t.id}><span className={`topic-symbol small ${t.color}`}>{t.symbol}</span><div><strong>{t.name}</strong></div><Icon name="check" size={18}/></div>) : <p>Your strengths will take shape as you practice. Start with a topic that makes you curious.</p>}</section><section className="surface growth-panel"><h2>Practice next</h2>{growth.length ? growth.map(t => <button key={t.id} className="growth-topic" onClick={() => onPractice(t.id)}><span className={`topic-symbol small ${t.color}`}>{t.symbol}</span><span><strong>{t.name}</strong><small>{t.score! < 60 ? "Let’s build this together" : "A little more practice to feel confident"}</small></span><Icon name="arrow" size={17}/></button>) : <p className="growth-empty">No current support gaps in your practiced topics. Keep exploring fresh problems with Rova.</p>}<p className="data-caption">Your next try can change these.</p></section></div>;
}
