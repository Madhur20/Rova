"use client";
import { topicById } from "@/lib/product/curriculum";
import type { Profile, Workspace } from "@/lib/product/model";
import { currentUnit, studentStatus } from "@/lib/product/progress";
import { skillName, traceStatus, type TraceStatus } from "@/lib/product/rootCause";
import { familyLabel, familyWhy, practiceDays } from "@/lib/product/why";
import { ConfidenceChart, StatusBadge } from "./charts";
import { FamilyActivities } from "./FamilyActivities";
import { Avatar, Empty, type Mutate } from "./Shared";
import { Icon } from "./Brand";

// Plain words for a refresher's progress, for families.
const refresherWords: Record<TraceStatus, string> = {
  "Refresher suggested": "ready to start",
  "Refresher in progress": "in progress",
  "Refresher completed": "done; the harder problem is next",
  "Solved after refresher": "done, and the harder problem was solved",
  "Solved without refresher": "not needed; the harder problem was solved",
};
const shortDate = (at: string) => new Date(at).toLocaleDateString("en-US", { month: "long", day: "numeric" });

// "This week" answers, in order: is my child okay, why, what is the school doing, what can I do
// tonight, is it working, and what did the teacher say. "Progress" shows only the charts.
export function ParentDashboard({
  profile,
  workspace,
  section,
  mutate,
}: {
  profile: Profile;
  workspace: Workspace;
  section: string;
  mutate: Mutate;
}) {
  const child = workspace.students[0];
  if (!child)
    return <Empty title="No child connected yet." text="Use the family code from your child’s profile to connect." />;
  const name = child.name.split(" ")[0];
  const status = studentStatus(child, workspace);
  const known = status.topics.filter((t) => t.status !== "no_data");
  const onTrack = known.filter((t) => t.status === "on_track").length;
  const focus = status.focus && status.focus.status !== "on_track" ? status.focus : null;
  const plans = workspace.plans.filter((p) => p.studentIds.includes(child.id));
  const focusPlan = focus && plans.find((p) => p.topic === focus.topic);
  const traces = (workspace.sessions ?? []).filter((s) => s.studentId === child.id && s.trace);
  const notes = workspace.notes.filter((n) => n.studentId === child.id).slice().reverse();
  const unit = currentUnit();
  const why = familyWhy(workspace, child, status);

  // Wins come from live practice only, never from the simulated starting history.
  const wins: string[] = [];
  const rising = [...known]
    .filter((t) => t.perWeek > 0 && !t.points.some((p) => p.simulated))
    .sort((a, b) => b.perWeek - a.perWeek)[0];
  if (rising) wins.push(`${topicById(rising.topic).name}: up ${rising.perWeek} points a week`);
  const days = practiceDays(workspace, child.id);
  if (days) wins.push(`Practiced ${days} of the last 7 days`);
  const lessons = (workspace.sessions ?? []).filter((s) => s.studentId === child.id && s.completedAt).length;
  if (lessons) wins.push(`Finished ${lessons} coached lesson${lessons === 1 ? "" : "s"}`);
  if (traces.some((s) => s.trace!.fixedAt)) wins.push("Solved the ratio problem after a fractions refresher");

  if (section === "progress")
    return (
      <section className="parent-progress">
        <p className="parent-lede">
          Each chart shows {name}’s confidence in one topic, from practice answers, against the class goal of 70% by{" "}
          {unit.end.toLocaleDateString("en-US", { month: "long", day: "numeric" })}. Hollow points are earlier estimates.
        </p>
        <div className="parent-chart-grid">
          {status.topics.map((t) => (
            <article key={t.topic} className="surface">
              <header>
                <h3>{topicById(t.topic).name}</h3>
                <StatusBadge status={t.status} label={familyLabel[t.status]} />
              </header>
              <ConfidenceChart
                title={`${name}’s ${topicById(t.topic).name.toLowerCase()} confidence`}
                points={t.points}
                unitStart={unit.start}
                unitEnd={unit.end}
                projected={t.projected}
              />
            </article>
          ))}
        </div>
      </section>
    );

  return (
    <div className="parent-week">
      <section className="parent-status surface">
        <Avatar name={child.name} id={child.id} color={child.avatar} />
        <div>
          <h2>
            {name} is on track in {onTrack} of {known.length || 6} topics.
          </h2>
          {focus ? (
            <p>
              {topicById(focus.topic).name} {focus.status === "stagnant" ? "needs extra help" : "is catching up, but needs more practice to reach the class goal"}
              {focusPlan ? ". The teacher has started a small group for it." : "."}
            </p>
          ) : (
            <p>Keep the practice going. Tonight’s activity is below.</p>
          )}
        </div>
        <ul className="parent-topics" aria-label="Topics">
          {status.topics.map((t) => (
            <li key={t.topic}>
              <span>{topicById(t.topic).name}</span>
              <StatusBadge status={t.status} label={familyLabel[t.status]} />
            </li>
          ))}
        </ul>
      </section>

      <div className="parent-columns">
        <section className="surface">
          <h3 className="with-ai-mark"><span className="ai-mark" title="Written by Rova from checked practice"><Icon name="sparkle" size={18}/></span>What we noticed</h3>
          {why.length ? (
            <ul className="parent-why">
              {why.map((line) => <li key={line}>{line}</li>)}
            </ul>
          ) : (
            <p>Nothing needs extra attention right now. {name} is at, or on pace for, the class goal in every topic practiced so far.</p>
          )}
          {(plans.length > 0 || traces.length > 0) && (
            <>
              <h4>What school is doing about it</h4>
              <ul className="parent-actions">
                {plans.map((p) => (
                  <li key={p.id}>
                    {topicById(p.topic).name} small group, started {shortDate(p.at)}
                  </li>
                ))}
                {traces.map((s) => (
                  <li key={s.id}>
                    {skillName(s.trace!.prerequisite)} refresher: {refresherWords[traceStatus(s.trace!)]}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="surface">
          <h3>Wins</h3>
          {wins.length ? (
            <ul className="parent-wins">
              {wins.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : (
            <p className="quiet">Wins will appear after {name} practices.</p>
          )}
        </section>
      </div>

      <section aria-labelledby="tonight">
        <h3 id="tonight" className="parent-section-title">
          Tonight’s 10 minutes
        </h3>
        <FamilyActivities child={child} profile={profile} workspace={workspace} mutate={mutate} />
      </section>

      <section className="surface" aria-labelledby="messages">
        <h3 id="messages">Messages</h3>
        {notes.length ? (
          notes.map((n) => (
            <article className="family-message" key={n.id}>
              <Avatar name={n.author} id={n.authorId} color="peach" />
              <div>
                <div className="message-meta">
                  <strong>{n.author}</strong>
                  {n.automatic && <span className="auto-tag">Automatic · saved in Rova, not texted</span>}
                  <time>{shortDate(n.at)}</time>
                </div>
                <p>{n.text}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="quiet">Messages from the teacher will appear here.</p>
        )}
      </section>
    </div>
  );
}
