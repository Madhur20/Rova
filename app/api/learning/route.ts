import { rm } from "node:fs/promises";
import path from "node:path";
import { currentAccount, database, materialsDirectory, sameOrigin } from "@/lib/product/server";
import { applyLearning } from "@/lib/product/learning";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (process.env.VERCEL) return Response.json({ error: "This deployment uses a simulated browser workspace, not server storage." }, { status: 503 });
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json();
    return await database(async db => applyLearning(db, await currentAccount(db), body, async material => {
      await rm(path.join(materialsDirectory, `${material.id}.${material.file!.ext}`), { force: true });
    }));
  } catch { return Response.json({ error: "Your update couldn’t be saved. Please try again." }, { status: 500 }); }
}
