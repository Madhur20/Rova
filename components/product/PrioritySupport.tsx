import { topics } from "@/lib/product/curriculum";
import { supportTopics } from "@/lib/product/insights";
import type { Learner, Workspace } from "@/lib/product/model";
import { Icon } from "./Brand";
import { Avatar } from "./Shared";

export function PrioritySupport({ workspace, onSelect }: { workspace: Workspace; onSelect: (student: Learner) => void }) {
  const learners = workspace.students.filter(s => supportTopics(s, workspace).length === topics.length);
  if (!learners.length) return null;
  return <section className="priority-support"><span className="priority-support-icon"><Icon name="flag" size={26}/></span><div><span className="eyebrow">Priority check-in · Across-topic learning risk</span><h2>{learners.length === 1 ? `${learners[0].name} needs a closer look.` : `${learners.length} learners need a closer look.`}</h2><p>Current confidence is below 60% in all six topics. Start with a personal check-in and one focused foundation.</p><small>Based on practice signals and starting profiles, not a diagnosis.</small></div><div className="priority-support-actions">{learners.map(s => <button key={s.id} className="btn btn-dark" onClick={() => onSelect(s)}><Avatar name={s.name} id={s.id} color={s.avatar} small/>Review {s.name.split(" ")[0]}’s learning<Icon name="arrow" size={17}/></button>)}</div></section>;
}
