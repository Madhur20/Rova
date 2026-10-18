import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import accounts from "./mock-accounts.json";
import { sampleWorkspace, upgradeSampleWorkspace, type Profile, type Workspace } from "./model";
import type { Role } from "./curriculum";

// Deliberately JSON-backed for the requested presentation. No real student data.
// The writable directory can be supplied by a local host; it is not a production database.
const directory = process.env.ROVA_DATA_DIR || path.join(process.cwd(), ".rova");
// Uploaded course materials live beside the workspace file, never inside it.
export const materialsDirectory = path.join(directory, "materials");
const filename = path.join(directory, "workspace.json");
interface Account extends Profile { hash: string; salt: string; linkedStudentId?: string }
interface Database { accounts: Account[]; workspace: Workspace; secret: string }
const singleton = globalThis as typeof globalThis & { rovaWriteQueue?: Promise<unknown> };
export function hashPassword(password: string, salt: string): string { return scryptSync(password, salt, 64).toString("hex"); }
export function verifyPassword(password: string, account: Pick<Account, "salt" | "hash">): boolean {
  const expected = Buffer.from(account.hash, "hex");
  const actual = Buffer.from(hashPassword(password, account.salt), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
async function readDatabase(): Promise<Database> {
  try { const db: Database = JSON.parse(await readFile(filename, "utf8")); db.workspace = upgradeSampleWorkspace(db.workspace); return db; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { accounts: accounts.map((a) => { const salt = randomBytes(16).toString("hex"); return { id: a.id, email: a.email, name: a.name, role: a.role as Role, school: a.school, goal: a.goal, avatar: a.avatar, salt, hash: hashPassword(a.password, salt), linkedStudentId: a.role === "parent" ? "maya" : undefined }; }), workspace: sampleWorkspace(), secret: randomBytes(32).toString("hex") };
  }
}
export async function database<T>(action: (db: Database) => T | Promise<T>): Promise<T> {
  const next = (singleton.rovaWriteQueue ?? Promise.resolve()).catch(() => {}).then(async () => {
    const db = await readDatabase();
    const result = await action(db);
    await mkdir(directory, { recursive: true });
    const temp = `${filename}.${randomBytes(6).toString("hex")}.tmp`;
    await writeFile(temp, JSON.stringify(db), { mode: 0o600 });
    await rename(temp, filename);
    return result;
  });
  singleton.rovaWriteQueue = next;
  return next;
}
export function publicProfile(account: Account): Profile {
  return { id: account.id, name: account.name, email: account.email, role: account.role, school: account.school, goal: account.goal, avatar: account.avatar, familyCode: account.role === "student" ? `FAMILY-${account.id}` : undefined };
}
// Parents see their child’s lesson outcomes and root-cause traces, but never the conversation.
export function visibleWorkspace(workspace: Workspace, account: Account): Workspace {
  if (account.role === "teacher") return workspace;
  const studentId = account.role === "parent" ? account.linkedStudentId : account.id;
  // Course materials stay with the teacher; bank questions travel so lessons can show them.
  return { ...workspace, code: "", materials: undefined, sessions: (workspace.sessions ?? []).filter(s => s.studentId === studentId).map(s => account.role === "student" ? s : { ...s, messages: [], trace: s.trace && { ...s.trace, wrongAnswers: [] } }), students: workspace.students.filter((s) => s.id === studentId), attempts: workspace.attempts.filter((a) => a.studentId === studentId), plans: workspace.plans.filter((p) => p.studentIds.includes(studentId ?? "")).map((p) => ({ ...p, studentIds: [studentId!] })), notes: workspace.notes.filter((n) => n.studentId === studentId), checks: workspace.checks.filter((c) => c.startsWith(`${account.id}:`)) };
}
function signature(value: string, secret: string) { return createHmac("sha256", secret).update(value).digest("hex"); }
export async function setSession(id: string, secret: string) {
  const value = `${id}.${Date.now() + 7 * 86400000}`;
  (await cookies()).set("rova_session", `${value}.${signature(value, secret)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
}
export async function currentAccount(db: Database): Promise<Account | null> {
  const value = (await cookies()).get("rova_session")?.value;
  if (!value) return null;
  const [id, expires, mac] = value.split(".");
  if (!id || !expires || !mac || Number(expires) < Date.now()) return null;
  const expected = Buffer.from(signature(`${id}.${expires}`, db.secret));
  const actual = Buffer.from(mac);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return db.accounts.find((a) => a.id === id) ?? null;
}
export function sameOrigin(request: Request): boolean { return request.headers.get("origin") === new URL(request.url).origin; }
