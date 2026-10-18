import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { currentAccount, database, hashPassword, publicProfile, sameOrigin, setSession, verifyPassword, visibleWorkspace } from "@/lib/product/server";
import type { Role } from "@/lib/product/curriculum";

export const runtime = "nodejs";
export async function GET() {
  return database(async (db) => {
    const account = await currentAccount(db);
    return account ? Response.json({ profile: publicProfile(account), workspace: visibleWorkspace(db.workspace, account) }, { headers: { "Cache-Control": "no-store" } }) : Response.json({ error: "Please sign in to continue." }, { status: 401 });
  });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json();
    if (body.action === "logout") { (await cookies()).delete("rova_session"); return Response.json({ ok: true }); }
    return await database(async (db) => {
      if (body.action === "profile") {
        const account = await currentAccount(db);
        if (!account) return Response.json({ error: "Please sign in." }, { status: 401 });
        const name = String(body.name ?? "").trim().slice(0, 60);
        if (!name) return Response.json({ error: "Please enter your name." }, { status: 400 });
        account.name = name; account.school = String(body.school ?? "").slice(0, 100); account.goal = Math.max(5, Math.min(30, Number(body.goal) || 10));
        if (["sage", "peach", "lavender", "blue"].includes(body.avatar)) account.avatar = body.avatar;
        const student = db.workspace.students.find((s) => s.id === account.id);
        if (student) { student.name = account.name; student.avatar = account.avatar; }
        return Response.json({ profile: publicProfile(account) });
      }
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      if (password.length > 128 || email.length > 254) return Response.json({ error: "Please check your account details." }, { status: 400 });
      if (body.action === "login") {
        const account = db.accounts.find((a) => a.email === email);
        if (!account || !verifyPassword(password, account)) return Response.json({ error: "That email and password don’t match. Please try again." }, { status: 401 });
        await setSession(account.id, db.secret);
        return Response.json({ profile: publicProfile(account) });
      }
      if (body.action !== "signup") return Response.json({ error: "Unknown account action." }, { status: 400 });
      const name = String(body.name ?? "").trim().slice(0, 60);
      const role = body.role as Role;
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || !["teacher", "student", "parent"].includes(role)) return Response.json({ error: "Enter your name, a valid email, and a password of at least 8 characters." }, { status: 400 });
      if (db.accounts.some((a) => a.email === email)) return Response.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
      const code = String(body.code ?? "").trim();
      const linkedStudentId = code === "MAYA4" ? "maya" : code.startsWith("FAMILY-") ? code.slice(7) : "";
      if (role === "student" && code.toUpperCase() !== db.workspace.code) return Response.json({ error: "Ask your teacher for your class code. The sample classroom uses MAPLE4." }, { status: 400 });
      if (role === "parent" && !db.workspace.students.some((s) => s.id === linkedStudentId)) return Response.json({ error: "Enter the family code from your child’s profile. The sample family uses MAYA4." }, { status: 400 });
      const salt = randomBytes(16).toString("hex");
      const account = { id: randomUUID(), email, name, role, school: String(body.school || "Maplewood Elementary").slice(0, 100), goal: 10, avatar: "sage", salt, hash: hashPassword(password, salt), linkedStudentId: role === "parent" ? linkedStudentId : undefined };
      db.accounts.push(account);
      if (role === "student") db.workspace.students.push({ id: account.id, name, avatar: "sage", scores: {} });
      await setSession(account.id, db.secret);
      return Response.json({ profile: publicProfile(account) }, { status: 201 });
    });
  } catch { return Response.json({ error: "We couldn’t save your account. Please try again." }, { status: 500 }); }
}
