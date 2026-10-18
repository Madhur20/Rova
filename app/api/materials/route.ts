import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { currentAccount, database, materialsDirectory, sameOrigin, visibleWorkspace } from "@/lib/product/server";
import { MATERIAL_FILE_LIMIT, MATERIAL_FILE_TYPES, materialExtension, validateMaterial } from "@/lib/product/bank";

export const runtime = "nodejs";
// Adds a course material (handbook, course book, curriculum) with an optional PDF or document.
// The file is saved under the data directory with a generated name; the teacher's file name is
// kept only for display.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  let form: FormData;
  try { form = await request.formData(); } catch { return Response.json({ error: "Send the material as a form." }, { status: 400 }); }
  const upload = form.get("file");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  const ext = file ? materialExtension(file.name) : null;
  if (file && !ext) return Response.json({ error: "Upload a PDF, Word document, or text file." }, { status: 400 });
  if (file && file.size > MATERIAL_FILE_LIMIT) return Response.json({ error: "Files can be up to 10 MB." }, { status: 400 });
  let topics: unknown = [];
  try { topics = JSON.parse(String(form.get("topics") ?? "[]")); } catch { /* treated as none */ }
  const fields = validateMaterial({ title: form.get("title"), kind: form.get("kind"), topics, notes: form.get("notes") });
  if ("error" in fields) return Response.json({ error: fields.error }, { status: 400 });
  // A plain-text file fills in the notes when the teacher left them empty, so suggestions can quote it.
  if (file && !fields.notes && (ext === "txt" || ext === "md")) fields.notes = (await file.text()).replace(/\s+/g, " ").trim().slice(0, 2000);
  return database(async (db) => {
    const account = await currentAccount(db);
    if (!account) return Response.json({ error: "Please sign in." }, { status: 401 });
    if (account.role !== "teacher") return Response.json({ error: "This action isn’t available for your account." }, { status: 403 });
    if ((db.workspace.materials?.length ?? 0) >= 50) return Response.json({ error: "Remove a material before adding another." }, { status: 400 });
    const id = randomUUID();
    if (file && ext) {
      await mkdir(materialsDirectory, { recursive: true });
      await writeFile(path.join(materialsDirectory, `${id}.${ext}`), Buffer.from(await file.arrayBuffer()), { mode: 0o600 });
    }
    (db.workspace.materials ??= []).push({ id, ...fields, at: new Date().toISOString(), file: file && ext ? { name: file.name.slice(0, 120), type: MATERIAL_FILE_TYPES[ext], size: file.size, ext } : undefined });
    return Response.json({ workspace: visibleWorkspace(db.workspace, account) });
  });
}
