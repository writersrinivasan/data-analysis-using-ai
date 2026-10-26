import { friendlyError, getKey } from "@/lib/groq";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const key = getKey(req);
    const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!r.ok) return Response.json({ ok: false, error: r.status === 401 ? "Invalid API key" : `Groq returned ${r.status}` }, { status: 200 });
    const data = (await r.json()) as { data: { id: string; active?: boolean; owned_by?: string }[] };
    const models = data.data
      .filter((m) => m.active !== false && !/whisper|tts|guard|playai|orpheus|prompt-guard|distil/i.test(m.id))
      .map((m) => m.id)
      .sort();
    return Response.json({ ok: true, models });
  } catch (e) {
    const { status, message } = friendlyError(e);
    return Response.json({ ok: false, error: message }, { status });
  }
}
