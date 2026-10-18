import { resetLLM } from "@/lib/llm";

export async function POST() {
  resetLLM();
  return Response.json({ ok: true });
}
