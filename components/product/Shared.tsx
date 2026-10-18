"use client";
import { useEffect, useId, useRef } from "react";
import { Icon } from "./Brand";
import { samplePhotos, weeklyActivity, type Attempt, type CoachSession } from "@/lib/product/model";

export function Modal({ title, onClose, children, wide = false, className = "" }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
  return <dialog ref={ref} className={`product-dialog ${wide?"dialog-wide":""} ${className}`} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}} aria-labelledby={headingId}><div className="dialog-head"><h2 id={headingId}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close"/></button></div>{children}</dialog>;
}
// Shows the sample account’s picture when `id` has one, otherwise initials on the chosen color.
// The pictures are tiny local SVGs, so next/image would add nothing.
// eslint-disable-next-line @next/next/no-img-element
export function Avatar({ name, id, color = "sage", small = false }: { name: string; id?: string; color?: string; small?: boolean }) { const photo = id ? samplePhotos[id] : undefined; return <span className={`avatar ${color} ${small?"avatar-small":""} ${photo?"avatar-photo":""}`}>{photo ? <img src={photo} alt=""/> : name.split(" ").map(n=>n[0]).slice(0,2).join("")}</span>; }
export function ActivityChart({ attempts, studentId }: { attempts: Attempt[]; studentId?: string }) {
  const days=weeklyActivity(attempts,studentId);const max=Math.max(5,...days.map(d=>d.attempts));
  return <div className="activity-chart" role="img" aria-label={`Practice this week: ${days.map(d=>`${d.label}: ${d.attempts} attempts, ${d.correct} correct`).join("; ")}`}><div className="chart-bars">{days.map((d,i)=><div key={i} className="chart-day"><span className="chart-count">{d.attempts||""}</span><div className="chart-bar-space"><div className={`chart-bar ${i===6?"today":""}`} style={{height:`${Math.max(d.attempts?8:2,d.attempts/max*100)}%`}}><i style={{height:`${d.attempts?d.correct/d.attempts*100:0}%`}}/></div></div><span>{d.label}</span></div>)}</div><div className="chart-legend"><span><i className="strong"/> Correct</span><span><i className="growing"/> Still practicing</span></div></div>;
}
export function Empty({ title, text }: { title: string; text: string }) { return <div className="empty-state"><Icon name="leaf" size={30}/><h3>{title}</h3><p>{text}</p></div>; }
// JSON bodies go to /api/learning; a FormData body (a course material with its file) goes to /api/materials.
export type Mutate = (body: Record<string, unknown> | FormData) => Promise<{ correct?: boolean; session?: CoachSession } | null>;
