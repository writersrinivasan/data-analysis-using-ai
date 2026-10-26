import { buildAgent } from "@/lib/agent/graph";
import { DEFAULT_MODEL, friendlyError, getKey } from "@/lib/groq";
import type { Audience, Row } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_ROWS = 10000;

export async function POST(req: Request) {
  let key: string;
  try {
    key = getKey(req);
  } catch (e) {
    const { status, message } = friendlyError(e);
    return Response.json({ error: message }, { status });
  }
  const body = (await req.json()) as { question: string; audience?: Audience; datasetName?: string; func?: string; columns: string[]; rows: Row[]; model?: string };
  if (!body.question?.trim() || !Array.isArray(body.rows) || !body.rows.length) return Response.json({ error: "Question and dataset rows are required." }, { status: 400 });

  const graph = buildAgent(key, body.model || DEFAULT_MODEL);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const updates = await graph.stream(
          {
            question: body.question.slice(0, 2000),
            audience: body.audience ?? "intermediate",
            datasetName: body.datasetName ?? "Uploaded dataset",
            func: body.func ?? "Business",
            columns: body.columns,
            rows: body.rows.slice(0, MAX_ROWS),
            planAttempts: 0,
            analystAttempts: 0,
            feedback: "",
            results: [],
            profile: null,
            plan: null,
            insights: null,
            validation: null,
            report: "",
          },
          { streamMode: "updates", recursionLimit: 30 },
        );
        for await (const chunk of updates) {
          for (const [node, update] of Object.entries(chunk as Record<string, Record<string, unknown>>)) {
            const { rows: _r, ...rest } = update ?? {};
            send({ type: "update", node, data: rest });
          }
        }
        send({ type: "done" });
      } catch (e) {
        send({ type: "error", message: friendlyError(e).message });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
