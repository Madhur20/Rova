"use client";
// Hands-on models for each topic, shown under the question's picture. They show the structure of
// the problem (equal parts, equal groups, places, jumps, turns) and never print the answer.
import { useState } from "react";
import type { PracticeQuestion } from "@/lib/product/curriculum";

const GREEN = "#6e9661";
const INK = "#244c3b";
const LIGHT = "#fffefa";

function slicePath(cx: number, cy: number, r: number, i: number, n: number) {
  if (n === 1) return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
  const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
  const [x0, y0, x1, y1] = [cx + r * Math.cos(a0), cy + r * Math.sin(a0), cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
  return `M${cx} ${cy}L${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`;
}

// Two same-size pies: the given fraction, and one cut into smaller pieces the learner can shade.
function FractionPies({ numerator, denominator, target }: { numerator: number; denominator: number; target: number }) {
  const [shaded, setShaded] = useState<number[]>([]);
  const toggle = (i: number) => setShaded((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  return (
    <figure className="concept-visual">
      <figcaption>Pie model: same whole, different-size slices. Tap slices on the right pie to shade them.</figcaption>
      <div className="pie-pair">
        <svg viewBox="0 0 120 142" role="img" aria-label={`A circle cut into ${denominator} equal slices with ${numerator} shaded`}>
          {Array.from({ length: denominator }, (_, i) => (
            <path key={i} d={slicePath(60, 60, 54, i, denominator)} fill={i < numerator ? GREEN : LIGHT} stroke={INK} strokeWidth="1.5" />
          ))}
          <text x="60" y="134" textAnchor="middle" className="pie-label">
            {numerator}/{denominator}
          </text>
        </svg>
        <span className="model-equals" aria-hidden="true">
          =
        </span>
        <svg viewBox="0 0 120 142" role="group" aria-label={`A circle cut into ${target} equal slices. ${shaded.length} shaded.`}>
          {Array.from({ length: target }, (_, i) => (
            <path
              key={i}
              d={slicePath(60, 60, 54, i, target)}
              fill={shaded.includes(i) ? GREEN : LIGHT}
              stroke={INK}
              strokeWidth="1.5"
              className="pie-slice"
              role="button"
              tabIndex={0}
              aria-pressed={shaded.includes(i)}
              aria-label={`Slice ${i + 1} of ${target}`}
              onClick={() => toggle(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(i);
                }
              }}
            />
          ))}
          <text x="60" y="134" textAnchor="middle" className="pie-label">
            ?/{target}
          </text>
        </svg>
      </div>
      <p aria-live="polite">
        You shaded {shaded.length} of {target} slices. Does it cover the same amount as the left pie?
      </p>
    </figure>
  );
}

// Two number lines that move together: each step on the top line matches one on the bottom.
function DoubleNumberLine({ labels, known, steps }: { labels: [string, string]; known: [number, number]; steps: number }) {
  const W = 360;
  const x = (i: number) => 70 + (i * (W - 90)) / steps;
  return (
    <figure className="concept-visual">
      <figcaption>Double number line: each jump adds one more copy of the ratio to both lines.</figcaption>
      <svg viewBox={`0 0 ${W} 110`} role="img" aria-label={`Double number line, ${known[0]} ${labels[0]} for every ${known[1]} ${labels[1]}, ${steps} jumps`}>
        {[0, 1].map((row) => (
          <g key={row}>
            <text x="4" y={row ? 86 : 34} className="dnl-label">
              {labels[row]}
            </text>
            <line x1={x(0)} x2={x(steps)} y1={row ? 76 : 24} y2={row ? 76 : 24} stroke={INK} strokeWidth="2" />
            {Array.from({ length: steps + 1 }, (_, i) => (
              <g key={i}>
                <line x1={x(i)} x2={x(i)} y1={(row ? 76 : 24) - 6} y2={(row ? 76 : 24) + 6} stroke={INK} strokeWidth="2" />
                <text x={x(i)} y={row ? 100 : 12} textAnchor="middle" className="dnl-tick">
                  {row === 1 && i === steps ? "?" : i * known[row]}
                </text>
              </g>
            ))}
          </g>
        ))}
        {Array.from({ length: steps }, (_, i) => (
          <path key={i} d={`M${x(i) + 4} 40q${(x(i + 1) - x(i)) / 2 - 4} 14 ${x(i + 1) - x(i) - 8} 0`} fill="none" stroke={GREEN} strokeWidth="1.5" />
        ))}
      </svg>
    </figure>
  );
}

// Equal rows of squares, split into a tens part and a ones part. Tap squares to count them.
function AreaGrid({ rows, tens, ones }: { rows: number; tens: number; ones: number }) {
  const cols = tens + ones;
  const size = Math.min(16, 300 / cols);
  const [counted, setCounted] = useState<string[]>([]);
  const toggle = (key: string) => setCounted((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]));
  return (
    <figure className="concept-visual">
      <figcaption>Area model: {rows} rows. Tap squares to count a part, then add the parts.</figcaption>
      <svg viewBox={`0 0 ${cols * size + 20} ${rows * size + 30}`} role="group" aria-label={`A grid of ${rows} rows split into a part ${tens} wide and a part ${ones} wide. ${counted.length} squares counted.`}>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const key = `${r}-${c}`;
            return (
              <rect
                key={key}
                x={c * size + (c >= tens ? 6 : 0)}
                y={r * size}
                width={size - 2}
                height={size - 2}
                rx="2"
                fill={c < tens ? GREEN : "#d4a23c"}
                opacity={counted.includes(key) ? 1 : 0.45}
                className="grid-cell"
                role="button"
                tabIndex={0}
                aria-pressed={counted.includes(key)}
                aria-label={`Row ${r + 1}, square ${c + 1}`}
                onClick={() => toggle(key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(key);
                  }
                }}
              />
            );
          }),
        )}
        <text x={(tens * size) / 2} y={rows * size + 20} textAnchor="middle" className="grid-label">
          {rows} × {tens}
        </text>
        <text x={tens * size + 6 + (ones * size) / 2} y={rows * size + 20} textAnchor="middle" className="grid-label">
          {rows} × {ones}
        </text>
      </svg>
      <p aria-live="polite">{counted.length ? `You counted ${counted.length} squares.` : "Tap a row to count it. One full row is one group."}</p>
    </figure>
  );
}

// A bar split into equal groups, with the friendly chunk marked.
function BarModel({ whole, groups, chunk }: { whole: number; groups: number; chunk: number }) {
  const W = 340;
  return (
    <figure className="concept-visual">
      <figcaption>Bar model: {whole} split into {groups} equal groups. The darker part is the friendly chunk.</figcaption>
      <svg viewBox={`0 0 ${W} 96`} role="img" aria-label={`A bar of ${whole} split into ${groups} equal parts, with ${chunk} shaded darker`}>
        <rect x="10" y="20" width={(W - 20) * (chunk / whole)} height="34" fill={GREEN} opacity=".85" />
        <rect x={10 + (W - 20) * (chunk / whole)} y="20" width={(W - 20) * (1 - chunk / whole)} height="34" fill="#d4a23c" opacity=".7" />
        {Array.from({ length: groups }, (_, i) => (
          <g key={i}>
            <rect x={10 + (i * (W - 20)) / groups} y="20" width={(W - 20) / groups} height="34" fill="none" stroke={INK} strokeWidth="2" />
            <text x={10 + ((i + 0.5) * (W - 20)) / groups} y="42" textAnchor="middle" className="grid-label">
              ?
            </text>
          </g>
        ))}
        <text x={W / 2} y="14" textAnchor="middle" className="grid-label">
          {whole}
        </text>
        <text x={10 + ((W - 20) * (chunk / whole)) / 2} y="74" textAnchor="middle" className="grid-label">
          {chunk}
        </text>
        <text x={10 + (W - 20) * (chunk / whole) + ((W - 20) * (1 - chunk / whole)) / 2} y="74" textAnchor="middle" className="grid-label">
          {whole - chunk}
        </text>
      </svg>
    </figure>
  );
}

// Each digit drawn as that many blocks in its place.
function PlaceBlocks({ digits, hideDigits = false }: { digits: string; hideDigits?: boolean }) {
  const places = ["ones", "tens", "hundreds", "thousands", "ten thousands"];
  return (
    <figure className="concept-visual">
      <figcaption>Place blocks: each block is worth ten of the blocks to its right.</figcaption>
      <div className="place-blocks">
        {digits.split("").map((d, i) => {
          const place = digits.length - 1 - i;
          return (
            <div key={i} className={`place-col place-${place}`} aria-label={hideDigits ? `${places[place]} place` : `${d} in the ${places[place]} place`}>
              <div className="blocks">
                {Array.from({ length: Number(d) }, (_, k) => (
                  <span key={k} />
                ))}
              </div>
              <strong>{hideDigits ? "?" : d}</strong>
              <small>{places[place]}</small>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

// Equal jumps along a line, with the last landing point left for the learner.
function JumpLine({ jumps, size, unit }: { jumps: number; size: number; unit: string }) {
  const W = 340;
  const x = (i: number) => 20 + (i * (W - 40)) / jumps;
  return (
    <figure className="concept-visual">
      <figcaption>
        Jump line: {jumps} equal jumps of {size} {unit}.
      </figcaption>
      <svg viewBox={`0 0 ${W} 90`} role="img" aria-label={`${jumps} jumps of ${size} ${unit} along a number line`}>
        <line x1={x(0)} x2={x(jumps)} y1="60" y2="60" stroke={INK} strokeWidth="2" />
        {Array.from({ length: jumps + 1 }, (_, i) => (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1="54" y2="66" stroke={INK} strokeWidth="2" />
            <text x={x(i)} y="84" textAnchor="middle" className="grid-label">
              {i === jumps ? "?" : i * size}
            </text>
            {i < jumps && <path d={`M${x(i) + 3} 54Q${(x(i) + x(i + 1)) / 2} 14 ${x(i + 1) - 3} 54`} fill="none" stroke={GREEN} strokeWidth="2" />}
            {i < jumps && (
              <text x={(x(i) + x(i + 1)) / 2} y="28" textAnchor="middle" className="grid-label">
                +{size}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  );
}

// Turn a ray with the slider to feel how big an angle is. With a known part, the learner's turn is
// the second part of a bigger angle, so they can feel how the two parts fill it.
function turnName(deg: number) {
  if (deg === 0) return "No turn yet";
  if (deg < 90) return "Acute: smaller than a square corner";
  if (deg === 90) return "A square corner: a quarter-turn";
  if (deg < 180) return "Obtuse: bigger than a square corner";
  return "A straight line: a half-turn";
}
function AngleExplorer({ whole, known = 0 }: { whole: number; known?: number }) {
  const [deg, setDeg] = useState(known ? 20 : 45);
  const r = 90;
  const ray = (angle: number, len: number) => [110 + len * Math.cos((angle * Math.PI) / 180), 110 - len * Math.sin((angle * Math.PI) / 180)] as const;
  const [kx, ky] = ray(known, r);
  const [ex, ey] = ray(known + deg, r);
  const arc = (from: number, to: number, rad: number) => {
    const [ax, ay] = ray(from, rad);
    const [bx, by] = ray(to, rad);
    return `M${ax.toFixed(1)} ${ay.toFixed(1)}A${rad} ${rad} 0 ${to - from > 180 ? 1 : 0} 0 ${bx.toFixed(1)} ${by.toFixed(1)}`;
  };
  const total = known + deg;
  return (
    <figure className="concept-visual">
      <figcaption>{known ? `The first part is ${known}°. Turn the second ray until the two parts fill the whole ${whole}° angle.` : "Turn the ray. A quarter-turn makes a square corner; a half-turn makes a straight line."}</figcaption>
      <svg viewBox="0 0 230 125" role="img" aria-label={known ? `A ${known} degree part plus a ${deg} degree part, ${total} degrees so far` : `An angle of ${deg} degrees`}>
        {known > 0 && <path d={arc(0, known, 40)} fill="none" stroke="#d4a23c" strokeWidth="3" />}
        {deg > 0 && <path d={arc(known, known + deg, known ? 52 : 40)} fill="none" stroke={GREEN} strokeWidth="3" />}
        <line x1="110" y1="110" x2="210" y2="110" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        {known > 0 && <line x1="110" y1="110" x2={kx} y2={ky} stroke="#b07a1b" strokeWidth="3" strokeLinecap="round" />}
        <line x1="110" y1="110" x2={ex} y2={ey} stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <circle cx="110" cy="110" r="4" fill={INK} />
      </svg>
      <label className="angle-slider">
        <span>{known ? `${known}° + ${deg}° = ${total}° of ${whole}°` : `Turn: ${deg}° · ${turnName(deg)}`}</span>
        <input type="range" min="0" max={whole - known} step="5" value={deg} onChange={(e) => setDeg(Number(e.target.value))} />
      </label>
      {known > 0 && <p aria-live="polite">{total === whole ? "The two parts fill the whole angle now." : total < whole ? `Keep turning: ${whole - total}° of the whole is still open.` : ""}</p>}
    </figure>
  );
}

export function ConceptExplorer({ question: q }: { question: PracticeQuestion }) {
  switch (q.topic) {
    case "fractions": {
      const [n, d, t] = q.id === "fr1" ? [1, 2, 4] : q.id === "fr2" ? [2, 3, 6] : [3, 4, 12];
      return <FractionPies numerator={n} denominator={d} target={t} />;
    }
    case "ratios":
      return q.id === "ra1" ? (
        <DoubleNumberLine labels={["Lemon", "Water"]} known={[2, 3]} steps={3} />
      ) : q.id === "ra2" ? (
        <DoubleNumberLine labels={["Inches", "Miles"]} known={[1, 5]} steps={4} />
      ) : (
        <DoubleNumberLine labels={["First", "Second"]} known={[2, 3]} steps={5} />
      );
    case "multiplication":
      return q.id === "mu1" ? <AreaGrid rows={6} tens={10} ones={4} /> : q.id === "mu2" ? <AreaGrid rows={4} tens={20} ones={3} /> : <AreaGrid rows={12} tens={30} ones={2} />;
    case "division":
      return q.id === "di1" ? <BarModel whole={96} groups={4} chunk={80} /> : q.id === "di2" ? <BarModel whole={156} groups={6} chunk={120} /> : <BarModel whole={168} groups={7} chunk={140} />;
    case "place-value":
      // pv2 asks the learner to build the number, so the block counts show but the digits stay hidden.
      return <PlaceBlocks digits={q.id === "pv1" ? "34582" : q.id === "pv2" ? "6325" : "42736"} hideDigits={q.id === "pv2"} />;
    case "measurement":
      return q.id === "me1" ? <JumpLine jumps={3} size={100} unit="cm" /> : q.id === "me2" ? <JumpLine jumps={2} size={1000} unit="g" /> : <JumpLine jumps={3} size={60} unit="min" />;
    case "geometry":
      return q.id === "ge2" ? <AngleExplorer whole={180} known={60} /> : q.id === "ge3" ? <AngleExplorer whole={90} known={35} /> : <AngleExplorer whole={180} />;
    default:
      return null;
  }
}
