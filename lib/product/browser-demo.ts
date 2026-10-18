import samples from "./mock-accounts.json";
import { sampleWorkspace, upgradeSampleWorkspace, type Profile, type Workspace } from "./model";
import { applyLearning } from "./learning";
import { visibleWorkspace } from "./visibility";
import { MATERIAL_FILE_LIMIT, MATERIAL_FILE_TYPES, materialExtension, validateMaterial } from "./bank";
import type { DemoFiles } from "./demo-files";

export const DEMO_KEY = "rova-product-demo-v1";
export const DEMO_SESSION_KEY = "rova-product-demo-session-v1";
type Account = Profile & { linkedStudentId?: string; credential?: { salt: string; hash: string } };
interface DemoData { version: 1; generation: string; accounts: Account[]; workspace: Workspace }
interface Dependencies {
  local: Pick<Storage, "getItem" | "setItem">;
  session: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  files: DemoFiles;
  lock: <T>(action: () => Promise<T>) => Promise<T>;
}
const json = (data: unknown, status = 200) => Response.json(data, { status });
const clean = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
const uuid = () => crypto.randomUUID();
function seed(): DemoData {
  return { version: 1, generation: uuid(), workspace: sampleWorkspace(), accounts: samples.map(a => ({ id: a.id, name: a.name, email: a.email, role: a.role as Profile["role"], school: a.school, goal: a.goal, avatar: a.avatar, sample: true, linkedStudentId: a.role === "parent" ? "maya" : undefined })) };
}
function profile(account: Account): Profile {
  const { credential: _credential, linkedStudentId: _linked, ...publicFields } = account;
  void _credential; void _linked;
  return { ...publicFields, familyCode: account.role === "student" ? `FAMILY-${account.id}` : undefined };
}
async function passwordHash(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bytes = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", iterations: 100000, salt: encoder.encode(salt) }, key, 256);
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

// Demo-only role simulation. All roles' data is inspectable by the browser owner.
// The shared lock covers the complete read/modify/write cycle across tabs.
export function createDemoStore({ local, session, files, lock }: Dependencies) {
  function save(db: DemoData) {
    try { local.setItem(DEMO_KEY, JSON.stringify(db)); }
    catch { throw new Error("Rova couldn’t save in this browser. Free some browser storage or allow site storage, then retry. Your previous saved progress has not been reset."); }
  }
  function read(): DemoData {
    const raw = local.getItem(DEMO_KEY);
    if (raw === null) { const db = seed(); save(db); return db; }
    let db: DemoData;
    try {
      db = JSON.parse(raw);
      if (db.version !== 1 || typeof db.generation !== "string" || !Array.isArray(db.accounts) || !db.workspace || ![db.workspace.students, db.workspace.attempts, db.workspace.plans, db.workspace.notes, db.workspace.checks].every(Array.isArray)) throw new Error();
    } catch { throw new Error("The saved Rova demo cannot be read. Use Reset demo to start again; it has not been overwritten."); }
    db.workspace = upgradeSampleWorkspace(db.workspace);
    return db;
  }
  function active(db: DemoData) {
    const raw = session.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    try { const saved = JSON.parse(raw); return saved.generation === db.generation ? db.accounts.find(a => a.id === saved.id) ?? null : null; }
    catch { return null; }
  }
  function signIn(db: DemoData, account: Account) { session.setItem(DEMO_SESSION_KEY, JSON.stringify({ id: account.id, generation: db.generation })); }

  async function accountAction(db: DemoData, body: Record<string, unknown>): Promise<Response> {
    const account = active(db);
    if (body.action === "logout") { session.removeItem(DEMO_SESSION_KEY); return json({ ok: true }); }
    if (body.action === "profile") {
      if (!account) return json({ error: "Please sign in." }, 401);
      const name = clean(body.name, 60);
      if (!name) return json({ error: "Please enter your name." }, 400);
      account.name = name; account.school = clean(body.school, 100);
      account.goal = Math.max(5, Math.min(30, Number(body.goal) || 10));
      if (["sage", "peach", "lavender", "blue"].includes(String(body.avatar))) account.avatar = String(body.avatar);
      const student = db.workspace.students.find(s => s.id === account.id);
      if (student) { student.name = account.name; student.avatar = account.avatar; }
      save(db);
      return json({ profile: profile(account) });
    }
    const email = clean(body.email, 254).toLowerCase();
    const password = String(body.password ?? "");
    if (password.length > 128) return json({ error: "Use a demo password of at most 128 characters." }, 400);
    if (body.action === "login") {
      const found = db.accounts.find(a => a.email === email);
      const valid = found && (found.credential ? await passwordHash(password, found.credential.salt) === found.credential.hash : samples.some(a => a.id === found.id && a.password === password));
      if (!found || !valid) return json({ error: "That demo email and password don’t match." }, 401);
      signIn(db, found);
      return json({ profile: profile(found) });
    }
    if (body.action !== "signup") return json({ error: "Unknown account action." }, 400);
    const name = clean(body.name, 60), role = body.role;
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || (role !== "teacher" && role !== "student" && role !== "parent")) return json({ error: "Enter a fictional name, demo email, role, and password of at least 8 characters." }, 400);
    if (db.accounts.some(a => a.email === email)) return json({ error: "This demo email already exists in this browser." }, 409);
    const code = clean(body.code, 100);
    const linkedStudentId = code === "MAYA4" ? "maya" : code.startsWith("FAMILY-") ? code.slice(7) : "";
    if (role === "student" && code.toUpperCase() !== db.workspace.code) return json({ error: "Use the class code MAPLE4." }, 400);
    if (role === "parent" && !db.workspace.students.some(s => s.id === linkedStudentId)) return json({ error: "Use a valid family code, such as MAYA4." }, 400);
    const salt = uuid();
    const created: Account = { id: uuid(), name, email, role, school: clean(body.school || "Maplewood Elementary", 100), goal: 10, avatar: "sage", linkedStudentId: role === "parent" ? linkedStudentId : undefined, credential: { salt, hash: await passwordHash(password, salt) } };
    db.accounts.push(created);
    if (role === "student") db.workspace.students.push({ id: created.id, name, avatar: "sage", scores: {} });
    save(db); signIn(db, created);
    return json({ profile: profile(created) }, 201);
  }

  async function upload(db: DemoData, form: FormData) {
    const account = active(db);
    if (!account) return json({ error: "Please sign in." }, 401);
    if (account.role !== "teacher") return json({ error: "Only the simulated teacher can add materials." }, 403);
    const rawFile = form.get("file");
    const file = rawFile instanceof File && rawFile.size ? rawFile : null;
    const ext = file ? materialExtension(file.name) : null;
    if (file && !ext) return json({ error: "Upload a PDF, Word document, or text file." }, 400);
    if (file && file.size > MATERIAL_FILE_LIMIT) return json({ error: "Files can be up to 10 MB." }, 400);
    let topics: unknown = [];
    try { topics = JSON.parse(String(form.get("topics") ?? "[]")); } catch { /* validated below */ }
    const fields = validateMaterial({ title: form.get("title"), kind: form.get("kind"), topics, notes: form.get("notes") });
    if ("error" in fields) return json({ error: fields.error }, 400);
    if ((db.workspace.materials?.length ?? 0) >= 50) return json({ error: "Remove a material before adding another." }, 400);
    if (file && !fields.notes && (ext === "txt" || ext === "md")) fields.notes = (await file.text()).replace(/\s+/g, " ").trim().slice(0, 2000);
    const id = uuid();
    if (file) await files.put(id, file);
    (db.workspace.materials ??= []).push({ id, ...fields, at: new Date().toISOString(), file: file && ext ? { name: file.name.slice(0, 120), type: MATERIAL_FILE_TYPES[ext], size: file.size, ext } : undefined });
    try { save(db); } catch (error) { if (file) await files.remove(id); throw error; }
    return json({ workspace: visibleWorkspace(db.workspace, account) });
  }

  return {
    async request(url: string, init?: RequestInit): Promise<Response> {
      try {
        return await lock(async () => {
          const db = read();
          if (url === "/api/account") {
            if (!init?.method || init.method === "GET") {
              const account = active(db);
              return account ? json({ profile: profile(account), workspace: visibleWorkspace(db.workspace, account) }) : json({ error: "Please sign in." }, 401);
            }
            return accountAction(db, JSON.parse(String(init.body ?? "{}")));
          }
          if (url === "/api/materials" && init?.body instanceof FormData) return upload(db, init.body);
          if (url === "/api/learning" && init?.method === "POST") {
            const removed: string[] = [];
            const response = await applyLearning(db, active(db), JSON.parse(String(init.body ?? "{}")), async material => { removed.push(material.id); });
            if (response.ok) { save(db); for (const id of removed) await files.remove(id); }
            return response;
          }
          return json({ error: "Unknown browser demo action." }, 404);
        });
      } catch (error) { return json({ error: error instanceof Error ? error.message : "Browser storage is unavailable." }, 500); }
    },
    async reset() {
      await lock(async () => {
        // No localStorage.clear(): leave every other app's data untouched.
        const fresh = seed(); save(fresh);
        session.removeItem(DEMO_SESSION_KEY);
        await files.clear();
      });
    },
    async material(id: string) {
      return lock(async () => {
        const db = read(), account = active(db);
        if (account?.role !== "teacher") throw new Error("Sign in as the simulated teacher to open this file.");
        const material = db.workspace.materials?.find(m => m.id === id);
        if (!material?.file) throw new Error("That material is not available.");
        const file = await files.get(id);
        if (!file) throw new Error("This file is no longer saved in this browser.");
        return { file, name: material.file.name };
      });
    },
  };
}
