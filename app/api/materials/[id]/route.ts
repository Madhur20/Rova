import { readFile } from "node:fs/promises";
import path from "node:path";
import { currentAccount, database, materialsDirectory } from "@/lib/product/server";

export const runtime = "nodejs";
// Serves a teacher's uploaded course file. Only the teacher's account can open it; the path is
// built from the saved record, never from the request.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return database(async (db) => {
    const account = await currentAccount(db);
    if (!account) return Response.json({ error: "Please sign in." }, { status: 401 });
    if (account.role !== "teacher") return Response.json({ error: "This file isn’t available for your account." }, { status: 403 });
    const material = db.workspace.materials?.find((m) => m.id === id);
    if (!material?.file) return Response.json({ error: "That file isn’t here." }, { status: 404 });
    try {
      const body = await readFile(path.join(materialsDirectory, `${material.id}.${material.file.ext}`));
      const name = material.file.name.replace(/[^\w.() -]/g, "_");
      return new Response(new Uint8Array(body), { headers: { "Content-Type": material.file.type, "Content-Disposition": `inline; filename="${name}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
    } catch { return Response.json({ error: "That file isn’t here." }, { status: 404 }); }
  });
}
