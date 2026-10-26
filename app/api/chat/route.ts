import { ChatGroq } from "@langchain/groq";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AUDIENCE_STYLE } from "@/lib/audience";
import { DEFAULT_MODEL, friendlyError, getKey } from "@/lib/groq";
import type { Audience } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const key = getKey(req);
    const body = (await req.json()) as { messages: { role: "user" | "assistant"; content: string }[]; audience?: Audience; context?: string; model?: string; mode?: string };
    const persona =
      body.mode === "coach"
        ? "You are a hands-on exercise coach. Give hints and check the participant's thinking; do not just hand over full answers unless asked."
        : "You are 'Datum', the AI teaching assistant for a 2-hour corporate workshop called 'Data Analysis Using AI'.";
    const system = `${persona}
Workshop modules: 1 Intro to AI-assisted analysis, 2 Working with business data, 3 AI-powered EDA, 4 Function-wise use cases (L&D, HR, Recruitment, Procurement, Finance, Administration, Investor Relations, Legal), 5 Visualization & reporting, 6 Advanced techniques (segmentation, what-if, scenarios, forecasting, root cause), 7 Privacy, accuracy & responsible AI, 8 Capstone.
Learner profile: ${AUDIENCE_STYLE[body.audience ?? "intermediate"]}
Rules: be practical and industry-focused (Indian & global corporate context is fine). Use short sections, bullets and example prompts. When showing formulas give the Excel version too. Always remind about validation when numbers are involved. Never ask users to paste personal or confidential data; suggest masking.
${body.context ? `Current page context: ${body.context}` : ""}`;
    const llm = new ChatGroq({ apiKey: key, model: body.model || DEFAULT_MODEL, temperature: 0.4, maxTokens: 1500 });
    const msgs = [new SystemMessage(system), ...body.messages.slice(-12).map((m) => (m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)))];
    const s = await llm.stream(msgs);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of s) {
            const t = typeof chunk.content === "string" ? chunk.content : "";
            if (t) controller.enqueue(encoder.encode(t));
          }
        } catch (e) {
          controller.enqueue(encoder.encode(`\n\n⚠️ ${friendlyError(e).message}`));
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (e) {
    const { status, message } = friendlyError(e);
    return Response.json({ error: message }, { status });
  }
}
