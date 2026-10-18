"use client";
import { useMemo, useState } from "react";
import { topicById, topics, type TopicId } from "@/lib/product/curriculum";
import { filterLog, paginate, type LogFilters } from "@/lib/product/interventionLog";
import type { Learner, Profile, Workspace } from "@/lib/product/model";
import {
  classStatuses,
  countByStatus,
  currentUnit,
  momentumHistory,
  planImpact,
  statusLabel,
  statusOrder,
  topicStatusCounts,
  type Status,
  type StudentStatus,
} from "@/lib/product/progress";
import { interventionLogCsv, progressReport } from "@/lib/product/report";
import { strengthLine, whyLine } from "@/lib/product/why";
import { Icon } from "./Brand";
import { MomentumChart, Sparkline, StatusBadge, StatusBar, StatusLegend } from "./charts";
import { Avatar, Empty } from "./Shared";

export interface ReportFilters {
  status: Status | "all";
  topic: TopicId | "all";
}
type Range = "unit" | "all";
type Sort = "status" | "name" | "score";

const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function ProgressReport({
  workspace,
  profile,
  filters,
  onFilters,
  onOpenStudent,
}: {
  workspace: Workspace;
  profile: Profile;
  filters: ReportFilters;
  onFilters: (f: ReportFilters) => void;
  onOpenStudent: (student: Learner) => void;
}) {
  const [range, setRange] = useState<Range>("unit");
  const [sort, setSort] = useState<Sort>("status");
  const [log, setLog] = useState<Omit<LogFilters, "since" | "studentIds">>({ search: "", topic: "all", type: "all", outcome: "all" });
  const [page, setPage] = useState(1);

  const report = progressReport(workspace);
  const unit = currentUnit();
  const statuses = useMemo(() => classStatuses(workspace), [workspace]);
  const history = useMemo(() => momentumHistory(workspace), [workspace]);
  const byTopic = useMemo(() => topicStatusCounts(workspace), [workspace]);

  // A learner matches the status filter by their overall status, or by that topic's status when a
  // topic is chosen too.
  const matches = (s: StudentStatus) => {
    const status = filters.topic === "all" ? s.status : s.topics.find((t) => t.topic === filters.topic)!.status;
    return filters.status === "all" || status === filters.status;
  };
  const shown = statuses
    .filter(matches)
    .sort((a, b) =>
      sort === "name"
        ? a.student.name.localeCompare(b.student.name)
        : sort === "score"
          ? (a.focus?.score ?? 0) - (b.focus?.score ?? 0)
          : statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
    );
  const counts = countByStatus(statuses.filter(matches));
  const filtered = filters.status !== "all" || filters.topic !== "all";

  // The log has its own filters below; the status and topic filters above shape only the
  // learner table and charts, so an alert link never empties the log.
  const since = range === "unit" ? unit.start.toISOString().slice(0, 10) : undefined;
  const logRows = filterLog(report.rows, { ...log, since });
  const pageView = paginate(logRows, page);
  const impacts = workspace.plans.map((p) => planImpact(workspace, p));
  const setLogFilter = (change: Partial<typeof log>) => {
    setLog({ ...log, ...change });
    setPage(1);
  };

  function download() {
    const url = URL.createObjectURL(new Blob([interventionLogCsv(logRows)], { type: "text/csv" }));
    const link = Object.assign(document.createElement("a"), {
      href: url,
      download: `rova-intervention-log-${report.generatedAt.slice(0, 10)}.csv`,
    });
    link.click();
    URL.revokeObjectURL(url);
  }

  const m = report.metrics;
  return (
    <section className="progress-report">
      <div className="report-head">
        <div>
          <h2>{report.className}</h2>
          <p>
            {profile.name} · Grade 4 mathematics · {workspace.students.length} learners
          </p>
        </div>
        <div className="report-actions">
          <button className="btn btn-outline" onClick={download} disabled={!logRows.length}>
            Export log (CSV)
          </button>
          <button className="btn btn-dark" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      <div className="report-filters" role="group" aria-label="Report filters">
        <label>
          Time
          <select value={range} onChange={(e) => { setRange(e.target.value as Range); setPage(1); }}>
            <option value="unit">This unit</option>
            <option value="all">All time</option>
          </select>
        </label>
        <label>
          Topic
          <select value={filters.topic} onChange={(e) => { onFilters({ ...filters, topic: e.target.value as TopicId | "all" }); setPage(1); }}>
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={filters.status} onChange={(e) => { onFilters({ ...filters, status: e.target.value as Status | "all" }); setPage(1); }}>
            <option value="all">All learners</option>
            {(["stagnant", "behind", "on_track", "no_data"] as Status[]).map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </label>
        {filtered && (
          <button className="text-link" onClick={() => onFilters({ status: "all", topic: "all" })}>
            Clear filters
          </button>
        )}
      </div>

      <div className="report-tiles">
        <div>
          <span>Learners shown</span>
          <strong>{shown.length}</strong>
          <small>
            {counts.on_track} on track · {counts.behind} behind · {counts.stagnant} stagnant
          </small>
        </div>
        <div>
          <span>Coached lessons</span>
          <strong>{m.coachedLessons}</strong>
          <small>{m.lessonsCompleted} completed</small>
        </div>
        <div>
          <span>Answers checked by code</span>
          <strong>{m.questionsChecked}</strong>
          <small>{m.solvedIndependently} solved on the first try</small>
        </div>
        <div>
          <span>Root causes found</span>
          <strong>{m.rootCausesFound}</strong>
          <small>{m.solvedAfterTrace} solved after a refresher</small>
        </div>
        <div>
          <span>Family updates</span>
          <strong>{m.familyUpdates}</strong>
          <small>Saved in Rova, not texted</small>
        </div>
      </div>

      <div className="report-charts">
        <section className="surface">
          <h3>Class momentum</h3>
          <MomentumChart
            history={history}
            active={filters.status === "all" ? null : filters.status}
            onSelect={(s) => onFilters({ ...filters, status: filters.status === s ? "all" : s })}
          />
        </section>
        <section className="surface">
          <div className="section-heading">
            <h3>Topics by status</h3>
            <StatusLegend />
          </div>
          <div className="topic-status-chart">
            {byTopic.map((row) => (
              <div key={row.topic.id} className={`topic-status-row ${filters.topic === row.topic.id ? "is-active" : ""}`}>
                <span className="topic-status-name">{row.topic.name}</span>
                <StatusBar
                  counts={row.counts}
                  label={row.topic.name}
                  active={filters.topic === row.topic.id && filters.status !== "all" ? filters.status : null}
                  onSelect={(status) => onFilters({ status, topic: row.topic.id })}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface" id="report-learners">
        <div className="section-heading">
          <h3>Learners</h3>
          <label className="sort-control">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="status">Most urgent</option>
              <option value="score">Lowest confidence</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        {shown.length ? (
          <div className="report-table-wrap">
            <table className="report-table learner-table">
              <thead>
                <tr>
                  <th scope="col">Learner</th>
                  <th scope="col">Status</th>
                  <th scope="col">{filters.topic === "all" ? "Focus topic" : topicById(filters.topic).name}</th>
                  <th scope="col">Trend</th>
                  <th scope="col">What’s behind it</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => {
                  const t = filters.topic === "all" ? s.focus : s.topics.find((x) => x.topic === filters.topic)!;
                  const why = whyLine(workspace, s);
                  return (
                    <tr key={s.student.id}>
                      <th scope="row">
                        <button className="row-link" onClick={() => onOpenStudent(s.student)}>
                          <Avatar name={s.student.name} id={s.student.id} color={s.student.avatar} small />
                          {s.student.name}
                        </button>
                      </th>
                      <td>
                        <StatusBadge status={t?.status ?? s.status} />
                      </td>
                      <td>
                        {t ? (
                          <>
                            {topicById(t.topic).name} <strong>{t.score ?? "—"}%</strong>
                            <small>{t.perWeek === 0 ? "No change" : `${t.perWeek > 0 ? "+" : ""}${t.perWeek} a week`}</small>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{t && <Sparkline points={t.points} label={`${s.student.name}, ${topicById(t.topic).name} trend`} />}</td>
                      <td className="why-cell">{why ?? strengthLine(s)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No learners match these filters." text="Clear a filter to see more learners." />
        )}
      </section>

      {impacts.length > 0 && (
        <section className="surface">
          <div className="section-heading">
            <div>
              <h3>Is it working?</h3>
              <p>For each group lesson: how many learners practiced that topic since it was shared, and how many rose 5 or more points.</p>
            </div>
          </div>
          <div className="report-table-wrap">
            <table className="report-table impact-table">
              <thead>
                <tr>
                  <th scope="col">Group lesson</th>
                  <th scope="col">Shared</th>
                  <th scope="col">Learners</th>
                  <th scope="col">Practiced since</th>
                  <th scope="col">Rose 5+ points</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                {impacts.map((i) => (
                  <tr key={i.plan.id}>
                    <th scope="row">{topicById(i.plan.topic).name}</th>
                    <td className="nowrap">{shortDate(new Date(i.plan.at))}</td>
                    <td>{i.members.length}</td>
                    <td>{i.practiced ? `${i.practiced} of ${i.members.length}` : "None yet"}</td>
                    <td>{i.practiced ? `${i.improved} of ${i.practiced}` : "—"}</td>
                    <td>
                      <span className={`impact-verdict verdict-${i.verdict.replace(/ /g, "-").toLowerCase()}`}>{i.verdict === "No practice yet" ? "Waiting for practice" : i.verdict}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="surface intervention-log">
        <div className="section-heading">
          <div>
            <h3>Intervention log</h3>
            <p>Every coached lesson, refresher, and group lesson, newest first. Filter it with the controls below.</p>
          </div>
        </div>
        <div className="log-filters" role="group" aria-label="Filter the intervention log">
          <label className="search-field">
            <Icon name="search" size={16} />
            <input placeholder="Search learner or skill" value={log.search} onChange={(e) => setLogFilter({ search: e.target.value })} aria-label="Search the log" />
          </label>
          <select aria-label="Log topic" value={log.topic} onChange={(e) => setLogFilter({ topic: e.target.value as TopicId | "all" })}>
            <option value="all">Any topic</option>
            {[...topics, topicById("ratios")].map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select aria-label="Intervention type" value={log.type} onChange={(e) => setLogFilter({ type: e.target.value as LogFilters["type"] })}>
            <option value="all">Any type</option>
            <option value="Assigned lesson">Assigned lesson</option>
            <option value="Coached practice">Coached practice</option>
            <option value="Refresher">Included a refresher</option>
            <option value="Group lesson assigned">Group lesson</option>
          </select>
          <select aria-label="Result" value={log.outcome} onChange={(e) => setLogFilter({ outcome: e.target.value as LogFilters["outcome"] })}>
            <option value="all">Any result</option>
            <option value="Solved">Solved</option>
            <option value="In progress">In progress</option>
            <option value="Needs follow-up">Needs follow-up</option>
            <option value="Improved">Group improved</option>
            <option value="No practice yet">No practice yet</option>
          </select>
        </div>
        {logRows.length ? (
          <>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th scope="col">Learner</th>
                    <th scope="col">Focus skill</th>
                    <th scope="col">What was tried</th>
                    <th scope="col">Date</th>
                    <th scope="col">Result</th>
                    <th scope="col">Next step</th>
                  </tr>
                </thead>
                <tbody>
                  {logRows.map((r, i) => (
                    <tr key={i} className={i < pageView.from - 1 || i >= pageView.to ? "print-only" : ""}>
                      <td>{r.learner}</td>
                      <td>{r.focus}</td>
                      <td>{r.tried}</td>
                      <td className="nowrap"><time dateTime={r.date}>{new Date(`${r.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></td>
                      <td>
                        {r.outcome && <span className={`outcome outcome-${r.outcome.replace(/ /g, "-").toLowerCase()}`}>{r.outcome}</span>}
                        <small>{r.result}</small>
                      </td>
                      <td>{r.next}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav className="pager" aria-label="Log pages">
              <span>
                Showing {pageView.from}–{pageView.to} of {pageView.total}
              </span>
              <button className="btn btn-outline btn-small" disabled={pageView.page === 1} onClick={() => setPage(pageView.page - 1)}>
                Previous
              </button>
              <span aria-live="polite">
                Page {pageView.page} of {pageView.pages}
              </span>
              <button className="btn btn-outline btn-small" disabled={pageView.page === pageView.pages} onClick={() => setPage(pageView.page + 1)}>
                Next
              </button>
            </nav>
          </>
        ) : (
          <Empty
            title={report.rows.length ? "No entries match." : "The log fills in as learners practice."}
            text={report.rows.length ? "Change a filter to see more entries." : "Each coached lesson, refresher, and group lesson becomes a dated entry."}
          />
        )}
      </section>
      <p className="data-caption">
        Counts come from saved, code-checked answers. Status uses the 70% target and each learner’s pace; before today it
        uses each learner’s starting profile.
      </p>
    </section>
  );
}
