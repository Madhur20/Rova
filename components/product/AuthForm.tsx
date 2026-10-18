"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand, Icon, Mark } from "./Brand";
import type { Role } from "@/lib/product/curriculum";

export function AuthForm({ signup = false, initialRole = "teacher" }: { signup?: boolean; initialRole?: Role }) {
  const router = useRouter();
  const [role,setRole] = useState<Role>(initialRole);
  const [email,setEmail] = useState(""); const [password,setPassword] = useState("");
  const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  const [samples,setSamples] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, action: signup ? "signup" : "login", role, email, password }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      router.push(`/${result.profile.role}`); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); } finally { setBusy(false); }
  }
  return <main className="auth-layout"><section className="auth-story"><Brand light/><div><span className="eyebrow">A clearer picture of learning</span><h1>Little steps.<br/>Lasting<br/><em>understanding.</em></h1><p>For the student finding their way.<br/>The teacher helping them forward.<br/>And the family cheering them on.</p><div className="auth-drawing"><div className="auth-step step-one">1</div><div className="auth-step step-two">2</div><div className="auth-step step-three"><Icon name="leaf" size={38}/></div><svg viewBox="0 0 350 140" aria-hidden="true"><path d="M35 115C100 150 100 0 180 60s100 30 140-40" fill="none" stroke="#A9B99C" strokeWidth="2" strokeDasharray="6 7"/></svg></div></div><span className="auth-story-footer">Every learner. A way forward.</span></section><section className="auth-form-side"><Link href="/" className="auth-back">← Back to Rova</Link><div className="auth-form-wrap"><div className="auth-mobile-brand"><Brand/></div><span className="auth-mark"><Mark size={42}/></span><h2>{signup?"A good place to begin.":"Good to see you again."}</h2><p>{signup?"Create your account. Find your way forward.":"Your next little breakthrough is waiting."}</p><form onSubmit={submit}>
      {signup&&<><label>I’m here as a</label><div className="role-picker">{(["teacher","student","parent"] as Role[]).map(r=><button key={r} type="button" onClick={()=>setRole(r)} aria-pressed={role===r} className={role===r?"selected":""}><Icon name={r==="teacher"?"people":r==="student"?"book":"home"}/>{r[0].toUpperCase()+r.slice(1)}</button>)}</div><label htmlFor="name">Your name</label><input id="name" name="name" autoComplete="name" placeholder="First and last name" required maxLength={60}/></>}
      <label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={signup?"new-password":"current-password"} placeholder={signup?"At least 8 characters":"Enter your password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={signup?8:1} maxLength={128}/>
      {signup&&role!=="teacher"&&<><label htmlFor="code">{role==="student"?"Class code":"Family connection code"}</label><input id="code" name="code" required placeholder={role==="student"?"From your teacher":"From your child’s profile"}/><small className="field-help">{role==="student"?"This connects you to your teacher’s classroom.":"This connects you to your child’s learning journey."}</small></>}
      {error&&<p className="form-error" role="alert">{error}</p>}<button className="btn btn-dark auth-submit" disabled={busy}>{busy?"One moment…":signup?"Create my account":"Log in"}<Icon name="arrow" size={18}/></button>
    </form><p className="auth-switch">{signup?"Already part of Rova?":"New to Rova?"} <Link href={signup?"/login":"/signup"}>{signup?"Log in":"Create an account"}</Link></p><div className="sample-login"><button type="button" onClick={()=>setSamples(!samples)} aria-expanded={samples}>Explore with a sample account <span>{samples?"−":"+"}</span></button>{samples&&<div><p>Simulated classroom · JSON-backed accounts</p><div className="sample-roles">{(["teacher","student","parent"] as Role[]).map(r=><button key={r} onClick={()=>{setEmail(`${r}@rova.school`);setPassword("rova2026");setRole(r);}}>{r[0].toUpperCase()+r.slice(1)}</button>)}</div><small>Password: rova2026 · Class: MAPLE4 · Family: MAYA4</small></div>}</div></div><p className="auth-bottom">Made for learning. Built around people.</p></section></main>;
}
