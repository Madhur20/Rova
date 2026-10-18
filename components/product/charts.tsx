"use client";
// Small, dependency-free charts for teacher and parent views. Status colors always come with an
// icon and a label (never color alone); every mark has a hover and keyboard tooltip, and each chart
// has a text equivalent.
import { useId, useState } from "react";
import { statusLabel, TARGET, type Point, type Status } from "@/lib/product/progress";

export function StatusIcon({ status, size = 14 }: { status: Status; size?: number }) {
  const shapes: Record<Status, React.ReactNode> = {
    on_track: <path d="M4.5 8.5 7 11l4.5-6" />,
    behind: <path d="M4.5 11 11 5M6.5 5H11v4.5" />,
    stagnant: <path d="M4 8h8" />,
    no_data: <path d="M5 8h.01M8 8h.01M11 8h.01" />,
  };
  return (
    <svg className={`status-icon status-${status}`} viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <circle cx="8" cy="8" r="7.25" />
      <g>{shapes[status]}</g>
    </svg>
  );
}

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  return (
    <span className={`status-badge status-${status}`}>
      <StatusIcon status={status} />
      {label ?? statusLabel[status]}
    </span>
  );
}

// One tooltip per chart. Handlers find the chart's box (the nearest [data-tip-host]) from the
// hovered element, so no refs are read during render.
function useTip() {
  const [tip, setTip] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);
  const show = (content: React.ReactNode) => (e: React.PointerEvent | React.FocusEvent) => {
    const el = e.currentTarget as Element;
    const host = el.closest("[data-tip-host]");
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const target = el.getBoundingClientRect();
    const x = "clientX" in e ? e.clientX - rect.left : target.left + target.width / 2 - rect.left;
    const y = "clientY" in e ? e.clientY - rect.top : target.top - rect.top;
    setTip({ x, y, content });
  };
  const hide = () => setTip(null);
  return { tip, show, hide };
}

function ChartTip({ tip }: { tip: { x: number; y: number; content: React.ReactNode } | null }) {
  if (!tip) return null;
  return (
    <div className="chart-tip" style={{ left: tip.x, top: tip.y }} role="status">
      {tip.content}
    </div>
  );
}

export function StatusLegend({ statuses = ["on_track", "behind", "stagnant"] }: { statuses?: Status[] }) {
  return (
    <ul className="status-legend" aria-label="Legend">
      {statuses.map((s) => (
        <li key={s}>
          <StatusIcon status={s} />
          {statusLabel[s]}
        </li>
      ))}
    </ul>
  );
}

// A 100% stacked bar of learners by status. Segments are buttons when `onSelect` is given.
export function StatusBar({
  counts,
  label,
  onSelect,
  active,
}: {
  counts: Record<Status, number>;
  label: string;
  onSelect?: (status: Status) => void;
  active?: Status | null;
}) {
  const tip = useTip();
  const order: Status[] = ["on_track", "behind", "stagnant", "no_data"];
  return (
    <div className="status-bar-wrap" data-tip-host>
      <div className="status-bar" role="group" aria-label={label}>
        {order
          .filter((s) => counts[s] > 0)
          .map((s) => {
            const text = `${counts[s]} ${statusLabel[s].toLowerCase()}`;
            const content = (
              <>
                <strong>{counts[s]}</strong> {statusLabel[s].toLowerCase()}
                <small>{label}</small>
              </>
            );
            const props = {
              className: `status-segment status-${s} ${active === s ? "is-active" : ""}`,
              style: { flexGrow: counts[s] },
              onPointerMove: tip.show(content),
              onPointerLeave: tip.hide,
              onFocus: tip.show(content),
              onBlur: tip.hide,
            };
            const inner = <span>{counts[s]}</span>;
            return onSelect ? (
              <button key={s} type="button" {...props} aria-label={`${label}: ${text}`} aria-pressed={active === s} onClick={() => onSelect(s)}>
                {inner}
              </button>
            ) : (
              <span key={s} {...props} tabIndex={0} aria-label={`${label}: ${text}`}>
                {inner}
              </span>
            );
          })}
      </div>
      <ChartTip tip={tip.tip} />
    </div>
  );
}

// Class momentum: one bar per moment (unit start, today), with the change in learners on track.
export function MomentumChart({
  history,
  onSelect,
  active,
}: {
  history: { label: string; detail: string; counts: Record<Status, number> }[];
  onSelect?: (status: Status) => void;
  active?: Status | null;
}) {
  const first = history[0];
  const last = history.at(-1)!;
  const change = last.counts.on_track - first.counts.on_track;
  return (
    <figure className="momentum-chart">
      <StatusLegend statuses={["on_track", "behind", "stagnant"]} />
      {history.map((h, i) => (
        <div key={h.label} className="momentum-row">
          <span className="momentum-label">
            {h.label}
            <small>{h.detail}</small>
          </span>
          <StatusBar
            counts={h.counts}
            label={`${h.label}, ${h.detail}`}
            onSelect={i === history.length - 1 ? onSelect : undefined}
            active={i === history.length - 1 ? active : null}
          />
        </div>
      ))}
      <figcaption>
        {change > 0
          ? `${change} more learner${change === 1 ? "" : "s"} on track since the unit started.`
          : change < 0
            ? `${-change} fewer learner${change === -1 ? "" : "s"} on track since the unit started.`
            : "The same number of learners are on track as when the unit started."}
      </figcaption>
    </figure>
  );
}

const DAY = 86_400_000;
const short = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Confidence over time with the target line and, when below target, the projection to the unit's end.
export function ConfidenceChart({
  points,
  unitStart,
  unitEnd,
  projected,
  title,
}: {
  points: Point[];
  unitStart: Date;
  unitEnd: Date;
  projected: number | null;
  title: string;
}) {
  const id = useId();
  const tip = useTip();
  const [hover, setHover] = useState<number | null>(null);
  if (points.length < 2) return <p className="quiet">Not enough answers yet to draw a trend.</p>;
  const W = 520;
  const H = 200;
  const pad = { l: 36, r: 16, t: 14, b: 28 };
  const t0 = Math.min(new Date(points[0].at).getTime(), unitStart.getTime());
  const t1 = unitEnd.getTime();
  const x = (t: number) => pad.l + ((t - t0) / (t1 - t0)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  const xy = points.map((p) => [x(new Date(p.at).getTime()), y(p.score)] as const);
  const last = points.at(-1)!;
  const lastX = xy.at(-1)![0];
  const showProjection = projected !== null && last.score < TARGET;
  const ticks = [0, 25, 50, 75, 100];
  const content = (p: Point) => (
    <>
      <strong>{p.score}%</strong> {short(new Date(p.at))}
      <small>{p.simulated ? "Starting profile" : "From live practice"}</small>
    </>
  );
  return (
    <figure className="confidence-chart" data-tip-host>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t`}>
        <title id={`${id}-t`}>
          {`${title}: ${points.map((p) => `${short(new Date(p.at))} ${p.score}%`).join(", ")}. Target ${TARGET}% by ${short(unitEnd)}.${showProjection ? ` At this pace, ${projected}% by then.` : ""}`}
        </title>
        {ticks.map((v) => (
          <g key={v} className="chart-grid">
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <rect className="unit-window" x={x(unitStart.getTime())} y={pad.t} width={x(t1) - x(unitStart.getTime())} height={H - pad.t - pad.b} />
        <text className="chart-axis" x={x(unitStart.getTime()) + 4} y={H - 8}>
          Unit start {short(unitStart)}
        </text>
        <text className="chart-axis" x={x(t1) - 4} y={H - 8} textAnchor="end">
          Unit end {short(unitEnd)}
        </text>
        <line className="target-line" x1={pad.l} x2={W - pad.r} y1={y(TARGET)} y2={y(TARGET)} />
        <text className="target-label" x={pad.l + 6} y={y(TARGET) - 6}>
          Target {TARGET}%
        </text>
        {showProjection && (
          <>
            <line className="projection-line" x1={lastX} y1={y(last.score)} x2={x(t1)} y2={y(projected!)} />
            <text className="projection-label" x={x(t1) - 4} y={y(projected!) + (projected! > TARGET - 8 ? 16 : -8)} textAnchor="end">
              At this pace: {projected}%
            </text>
          </>
        )}
        <polyline className="confidence-line" points={xy.map(([a, b]) => `${a},${b}`).join(" ")} />
        {xy.map(([a, b], i) => (
          <g key={i}>
            <circle className={`confidence-dot ${points[i].simulated ? "is-simulated" : ""} ${hover === i ? "is-hover" : ""}`} cx={a} cy={b} r={i === xy.length - 1 ? 5 : 4} />
            <circle
              className="hit"
              cx={a}
              cy={b}
              r={14}
              tabIndex={0}
              aria-label={`${short(new Date(points[i].at))}: ${points[i].score}%${points[i].simulated ? ", simulated" : ""}`}
              onPointerMove={(e) => {
                setHover(i);
                tip.show(content(points[i]))(e);
              }}
              onPointerLeave={() => {
                setHover(null);
                tip.hide();
              }}
              onFocus={(e) => {
                setHover(i);
                tip.show(content(points[i]))(e);
              }}
              onBlur={() => {
                setHover(null);
                tip.hide();
              }}
            />
          </g>
        ))}
        <text className="end-label" x={lastX} y={y(last.score) - 12} textAnchor="middle">
          {last.score}%
        </text>
      </svg>
      <ChartTip tip={tip.tip} />
      {points.some((p) => p.simulated) && <figcaption>Hollow points are the starting profile; the filled point is today.</figcaption>}
    </figure>
  );
}

export function Sparkline({ points, label }: { points: Point[]; label: string }) {
  if (points.length < 2) return <span className="sparkline-empty">—</span>;
  const W = 84;
  const H = 26;
  const t0 = new Date(points[0].at).getTime();
  const t1 = Math.max(t0 + DAY, new Date(points.at(-1)!.at).getTime());
  const x = (p: Point) => 2 + ((new Date(p.at).getTime() - t0) / (t1 - t0)) * (W - 6);
  const y = (p: Point) => 3 + (1 - p.score / 100) * (H - 6);
  const end = points.at(-1)!;
  return (
    <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={label}>
      <line className="spark-target" x1="0" x2={W} y1={3 + (1 - TARGET / 100) * (H - 6)} y2={3 + (1 - TARGET / 100) * (H - 6)} />
      <polyline points={points.map((p) => `${x(p)},${y(p)}`).join(" ")} />
      <circle cx={x(end)} cy={y(end)} r="2.6" />
    </svg>
  );
}
