// Filtering and paging for the report's intervention log.
import type { TopicId } from "./curriculum";
import type { InterventionOutcome, InterventionRow, InterventionType } from "./report";

export const LOG_PAGE_SIZE = 5;

export interface LogFilters {
  search: string;
  topic: TopicId | "all";
  type: InterventionType | "Refresher" | "all";
  outcome: InterventionOutcome | "all";
  since?: string; // ISO date (YYYY-MM-DD); rows before it are hidden
  studentIds?: string[]; // limit to these learners (from the report's status filter)
}

export function filterLog(rows: InterventionRow[], f: LogFilters): InterventionRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!q || `${r.learner} ${r.focus} ${r.tried}`.toLowerCase().includes(q)) &&
      (f.topic === "all" || r.topic === f.topic) &&
      (f.type === "all" || (f.type === "Refresher" ? r.refresher : r.type === f.type)) &&
      (f.outcome === "all" || r.outcome === f.outcome) &&
      (!f.since || r.date >= f.since) &&
      (!f.studentIds || (r.studentIds ?? []).some((id) => f.studentIds!.includes(id))),
  );
}

export function paginate<T>(items: T[], page: number, size = LOG_PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * size;
  return { items: items.slice(start, start + size), page: current, pages, from: items.length ? start + 1 : 0, to: Math.min(start + size, items.length), total: items.length };
}
