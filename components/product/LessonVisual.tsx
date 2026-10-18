"use client";
import { useState } from "react";
import type { PracticeQuestion } from "@/lib/product/curriculum";
import { isBuiltIn } from "@/lib/product/bank";
import { ConceptExplorer } from "./ConceptVisuals";

/** Code-drawn models: tied to the actual question, with no generated math text. */
// The question's picture plus, outside the chat, a hands-on model for the topic.
export function LessonVisual({ question, compact = false }: { question: PracticeQuestion; compact?: boolean }) {
  // Pictures are drawn for the built-in questions; a teacher-added question has none yet.
  if (!isBuiltIn(question.id)) return null;
  return compact ? <BaseVisual question={question} compact /> : <><BaseVisual question={question} /><ConceptExplorer question={question} /></>;
}
function BaseVisual({ question, compact = false }: { question: PracticeQuestion; compact?: boolean }) {
  const [explore, setExplore] = useState(false);
  const q = question;
  if (q.topic === "fractions") {
    const [numerator, denominator, target] = q.id === "fr1" ? [1, 2, 4] : q.id === "fr2" ? [2, 3, 6] : [3, 4, 12];
    const cells = explore || compact ? target : denominator;
    return <figure className="lesson-visual"><figcaption>Same whole. Smaller equal pieces.</figcaption>
      <svg viewBox="0 0 380 160" role="img" aria-label="Two equal-sized fraction bars. The same shaded area stays fixed as the lower bar is split into smaller pieces.">
        <rect x="12" y="14" width="300" height="42" rx="4" fill="#fffefa" stroke="#607d59"/>
        <rect x="12" y="14" width={300 * numerator / denominator} height="42" fill="#6e9661"/>
        {Array.from({ length: denominator - 1 }, (_, i) => <path key={i} d={`M${12 + (i + 1) * 300 / denominator} 14v42`} stroke="#3d6336"/>)}
        <text x="325" y="42">{numerator}/{denominator}</text>
        <rect x="12" y="90" width="300" height="42" rx="4" fill="#fffefa" stroke="#607d59"/>
        <rect x="12" y="90" width={300 * numerator / denominator} height="42" fill="#6e9661"/>
        {Array.from({ length: cells - 1 }, (_, i) => <path key={i} d={`M${12 + (i + 1) * 300 / cells} 90v42`} stroke="#3d6336"/>)}
        <text x="325" y="117">?/{target}</text>
      </svg>{!compact && <button className="btn btn-outline" aria-pressed={explore} onClick={() => setExplore(!explore)}>{explore ? "Compare the original pieces" : "Split into smaller pieces"}</button>}<p>Keep the shaded amount the same. Count the new pieces it covers.</p></figure>;
  }
  if (q.topic === "ratios") {
    const [labels, known, scaled] = q.id === "ra1" ? [["Lemon (cups)", "Water (cups)"], [2, 3], 6] : q.id === "ra2" ? [["Inches", "Miles"], [1, 5], 4] : [["First", "Second"], [4, 6], 10];
    return <figure className="lesson-visual"><figcaption>A ratio table: multiply both rows by the same number.</figcaption><table className="ratio-model"><tbody>{labels.map((label, i) => <tr key={label}><th scope="row">{label}</th><td>{known[i]}</td><td>{i === 0 ? scaled : "?"}</td></tr>)}</tbody></table><p>What was the top row multiplied by? Do the same to the bottom row.</p></figure>;
  }
  if (q.topic === "multiplication") {
    const [factor, first, second] = q.id === "mu1" ? [6, 10, 4] : q.id === "mu2" ? [4, 20, 3] : [32, 10, 2];
    return <figure className="lesson-visual"><figcaption>Build with partial products.</figcaption><div className="area-model"><div style={{ flex: first }}>{factor} × {first}</div><div style={{ flex: second }}>{factor} × {second}</div></div><p>Find each smaller rectangle’s total, then combine them. The whole is {factor} × ({first} + {second}).</p></figure>;
  }
  if (q.topic === "division") {
    const [whole, groups, chunk, rest] = q.id === "di1" ? [96, 4, 80, 16] : q.id === "di2" ? [156, 6, 120, 36] : [168, 7, 140, 28];
    return <figure className="lesson-visual"><figcaption>Share {whole} into {groups} equal groups.</figcaption><div className="sharing-model">{Array.from({ length: groups }, (_, i) => <span key={i} aria-label={`Group ${i + 1}, amount unknown`}>?</span>)}</div><div className="visual-equation">{chunk} ÷ {groups} <span>+</span> {rest} ÷ {groups}</div><p>Share a friendly chunk first. Then share what remains and combine each group’s two portions.</p></figure>;
  }
  if (q.topic === "place-value") {
    const digits = q.id === "pv1" ? "34582" : q.id === "pv2" ? "6325" : "42736";
    const places = ["ones", "tens", "hundreds", "thousands", "ten thousands"];
    return <figure className="lesson-visual"><figcaption>{q.id === "pv3" ? "The neighbor helps you round." : "Each place is ten times the place to its right."}</figcaption><div className="place-model">{digits.split("").map((digit, i) => <span key={i} className={digits.length - 1 - i === (q.id === "pv3" ? 2 : 3) ? "place-focus" : ""}><strong>{q.id === "pv2" ? "?" : digit}</strong><small>{places[digits.length - 1 - i]}</small></span>)}</div><p>{q.id === "pv3" ? "The highlighted hundreds digit tells you whether to keep the thousand or move up." : "Read the place label before deciding a digit’s value."}</p></figure>;
  }
  if (q.topic === "measurement") {
    const [count, amount, unit] = q.id === "me1" ? [3, 100, "cm"] : q.id === "me2" ? [2, 1000, "g"] : [3, 60, "min"];
    return <figure className="lesson-visual"><figcaption>One big unit, repeated {count} times.</figcaption><div className="unit-model">{Array.from({ length: count }, (_, i) => <span key={i}>{amount}<small>{unit}</small></span>)}</div><p>Add the equal units, or use multiplication. What is the total in {unit}?</p></figure>;
  }
  return <figure className="lesson-visual"><figcaption>{q.id === "ge1" ? "A square corner is a quarter-turn." : "The parts add up to the whole angle."}</figcaption><svg viewBox="0 0 280 160" role="img" aria-label={q.id === "ge2" ? "A straight angle split into a known sixty-degree angle and an unknown angle" : q.id === "ge3" ? "A right angle split into a known thirty-five-degree angle and an unknown angle" : "A right angle with a square corner marker"}>{q.id === "ge2" ? <><path d="M20 125h240M140 125 87 33"/><text x="72" y="113">60°</text><text x="186" y="100">?</text><text x="103" y="153">180° total</text></> : <><path d="M75 20v105h160M75 105h20v20"/>{q.id === "ge3" ? <><path d="m75 125 105-74"/><text x="148" y="118">35°</text><text x="92" y="66">?</text></> : <text x="117" y="80">?</text>}</>}</svg><p>{q.id === "ge1" ? "Four equal square corners fit into a full turn of 360°." : "Subtract the known part from the whole. Which part is missing?"}</p></figure>;
}
