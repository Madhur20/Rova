"use client";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Brand, Icon } from "./Brand";
import { Avatar, Modal } from "./Shared";
import { StudentDashboard } from "./StudentDashboard";
import { TeacherDashboard } from "./TeacherDashboard";
import { ParentDashboard } from "./ParentDashboard";
import type { CoachSession, Profile, Workspace } from "@/lib/product/model";
import type { Role } from "@/lib/product/curriculum";
import { navigation, sectionFromHash, subscribeToNavigation } from "./navigation";


export function WorkspaceApp({ role }: { role: Role }) {
  const router=useRouter();const [profile,setProfile]=useState<Profile|null>(null);const [workspace,setWorkspace]=useState<Workspace|null>(null);
  const section = useSyncExternalStore(subscribeToNavigation, () => sectionFromHash(role, window.location.hash), () => "overview");
  useEffect(() => { document.getElementById("main-content")?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); }, [section]);
  const [error,setError]=useState("");const [editing,setEditing]=useState(false);const [mobile,setMobile]=useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const load=useCallback(async()=>{try{const response=await fetch("/api/account",{cache:"no-store"});if(response.status===401){router.replace("/login");return;}if(!response.ok)throw new Error("Your workspace couldn’t be loaded. Please try again.");const data=await response.json();if(data.profile.role!==role){router.replace(`/${data.profile.role}`);return;}setProfile(data.profile);setWorkspace(data.workspace);setError("");}catch(e){setError(e instanceof Error?e.message:"Please try again.");}},[role,router]);
  useEffect(()=>{const initial=setTimeout(()=>{void load();},0);const onFocus=()=>{void load();};const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setMobile(false);};window.addEventListener("keydown",onKey);window.addEventListener("focus",onFocus);const timer=setInterval(()=>{if(!document.hidden)void load();},5000);return()=>{clearTimeout(initial);window.removeEventListener("keydown",onKey);window.removeEventListener("focus",onFocus);clearInterval(timer);};},[load]);
  async function mutate(body: Record<string,unknown>|FormData) {setError("");try{const response=body instanceof FormData?await fetch("/api/materials",{method:"POST",body}):await fetch("/api/learning",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error);setWorkspace(data.workspace);return {correct:data.correct as boolean|undefined,session:data.session as CoachSession|undefined};}catch(e){setError(e instanceof Error?e.message:"Your update couldn’t be saved.");return null;}}
  async function logout(){try{const response=await fetch("/api/account",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"logout"})});if(!response.ok)throw new Error();router.push("/login");router.refresh();}catch{setError("We couldn’t sign you out. Please try again.");}}
  if(!profile||!workspace)return <main className="workspace-loading"><Brand/><span className="loading-leaf"><Icon name="leaf" size={32}/></span><h1>A little room for learning.</h1><p>{error||"Opening your workspace…"}</p>{error&&<button className="btn btn-dark" onClick={load}>Try again</button>}</main>;
  return <div data-section={section} className={`workspace-layout ${collapsed ? "workspace-collapsed" : ""}`}>
    <aside id="workspace-navigation" className={`workspace-sidebar ${mobile ? "sidebar-open" : ""}`}><Brand/>
      <div className="sidebar-school"><span className="school-icon"><Icon name="book" size={18}/></span><div><strong>{profile.school || "Our learning community"}</strong><span>Grade 4 math</span></div></div>
      <span className="sidebar-label">Your workspace</span>
      <nav aria-label="Workspace navigation">{navigation[role].map(item => <a key={item.id} href={`#${item.id}`} className={section === item.id ? "active" : ""} title={item.label} aria-label={item.label} aria-current={section === item.id ? "page" : undefined} onClick={() => { setMobile(false); window.scrollTo({ top: 0, behavior: "instant" }); }}><Icon name={item.icon}/><span>{item.label}</span>{role === "teacher" && item.id === "plans" && workspace.plans.some(p => !p.completed) && <small>{workspace.plans.filter(p => !p.completed).length}</small>}</a>)}</nav>
      
      <div className="sidebar-bottom"><button aria-label="Log out" title="Log out" onClick={logout}><Icon name="logout"/><span>Log out</span></button></div>
      <button className="sidebar-profile" aria-label="Edit my profile" onClick={() => { setEditing(true); setMobile(false); }}><Avatar name={profile.name} id={profile.id} color={profile.avatar}/><span><strong>{profile.name}</strong><small>View my profile</small></span><Icon name="chevron" size={14}/></button>
    </aside>{mobile && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobile(false)}/>}
    <div className="workspace-main"><header className="workspace-topbar">
      <button className="desktop-menu icon-button" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} aria-controls="workspace-navigation" onClick={() => setCollapsed(!collapsed)}><Icon name="menu"/></button>
      <button className="mobile-menu icon-button" aria-label={mobile ? "Close navigation" : "Open navigation"} aria-expanded={mobile} aria-controls="workspace-navigation" onClick={() => setMobile(!mobile)}><Icon name="menu"/></button>
      <span className="topbar-context">{navigation[role].find(item => item.id === section)?.label}<span className="context-pickers"><label><span className="sr-only">Subject</span><select value="math" onChange={() => {}} aria-label="Subject"><option value="math">Mathematics</option></select></label>{role === "teacher" && <label><span className="sr-only">Class</span><select value="main" onChange={() => {}} aria-label="Class and section"><option value="main">{workspace.name} · Grade 4</option></select></label>}</span></span>
      <div><span className="today-date">{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span><button className="profile-top-button" onClick={() => setEditing(true)} aria-label="Edit my profile"><Avatar name={profile.name} id={profile.id} color={profile.avatar} small/></button></div>
    </header><main className="workspace-content" id="main-content" tabIndex={-1}>
      {section !== "overview" && <div className="section-page-heading"><h1>{navigation[role].find(item => item.id === section)?.label}</h1></div>}
      {error && <div className="form-error" role="alert">{error}<button className="text-link" onClick={() => setError("")}>Dismiss</button></div>}
      {role === "teacher" ? <TeacherDashboard profile={profile} workspace={workspace} section={section} mutate={mutate}/> : role === "student" ? <StudentDashboard profile={profile} workspace={workspace} section={section} mutate={mutate}/> : <ParentDashboard profile={profile} workspace={workspace} section={section} mutate={mutate}/>}
      <footer className="workspace-footer"><span>Rova · Grade 4 mathematics</span></footer>
    </main></div>
    {editing&&<ProfileEditor profile={profile} onClose={()=>setEditing(false)} onSave={p=>{setProfile(p);setEditing(false);void load();}}/>}
  </div>;
}

function ProfileEditor({profile,onClose,onSave}:{profile:Profile;onClose:()=>void;onSave:(profile:Profile)=>void}) {
  const [avatar,setAvatar]=useState(profile.avatar);const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  return <Modal title="A little more you." onClose={onClose}><form className="profile-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError("");const values=Object.fromEntries(new FormData(e.currentTarget));try{const response=await fetch("/api/account",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...values,avatar,action:"profile"})});const data=await response.json();if(!response.ok)throw new Error(data.error);onSave(data.profile);}catch(e){setError(e instanceof Error?e.message:"Please try again.");}finally{setBusy(false);}}}><div className="profile-avatar-picker"><Avatar name={profile.name} id={profile.id} color={avatar}/><div><strong>Choose your color</strong><div>{["sage","peach","lavender","blue"].map(color=><button key={color} type="button" className={`color-choice ${color} ${avatar===color?"selected":""}`} aria-label={`${color} profile color`} aria-pressed={avatar===color} onClick={()=>setAvatar(color)}>{avatar===color&&<Icon name="check" size={14}/>}</button>)}</div></div></div><label htmlFor="profile-name">Your name</label><input id="profile-name" name="name" defaultValue={profile.name} required maxLength={60}/><label htmlFor="profile-email">Email address</label><input id="profile-email" value={profile.email??""} disabled/><label htmlFor="profile-school">School</label><input id="profile-school" name="school" defaultValue={profile.school} maxLength={100}/>{profile.role==="student"&&<><label htmlFor="profile-goal">My daily practice goal</label><select id="profile-goal" name="goal" defaultValue={profile.goal}>{[5,10,15,20,30].map(n=><option key={n} value={n}>{n} questions</option>)}</select><div className="family-code"><Icon name="people"/><div><strong>Your family connection code</strong><code>{profile.familyCode}</code><p>Share with your parent or guardian to connect their account.</p></div></div></>}{error&&<p className="form-error" role="alert">{error}</p>}<button className="btn btn-dark" disabled={busy}>{busy?"Saving…":"Save my profile"}<Icon name="check" size={17}/></button></form></Modal>;
}
