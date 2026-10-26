import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DEFAULT_MODEL, friendlyError, getKey } from "@/lib/groq";

export const runtime = "nodejs";

/** AI-assisted standardisation: the LLM only sees distinct category values, never rows. */
export async function POST(req: Request) {
  try {
    const key = getKey(req);
    const { columns, model } = (await req.json()) as { columns: { name: string; values: { value: string; count: number }[] }[]; model?: string };
    const llm = new ChatGroq({ apiKey: key, model: model || DEFAULT_MODEL, temperature: 0 });
    const res = await llm.invoke(
      [
        new SystemMessage(`You are a data-cleaning assistant. For each categorical column, find values that refer to the same real-world entity but are written differently (case, spacing, abbreviations, legal suffixes, synonyms).
Map each variant to the canonical value (prefer the most frequent well-formed spelling). Do not merge genuinely different entities. Only include values that need changing.
Return JSON: {"mappings": {"<column>": {"<variant>": "<canonical>"}}, "notes": ["short explanation of each decision"]}`),
        new HumanMessage(JSON.stringify(columns)),
      ],
      { response_format: { type: "json_object" } },
    );
    const text = typeof res.content === "string" ? res.content : "{}";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return Response.json({ mappings: json.mappings ?? {}, notes: json.notes ?? [] });
  } catch (e) {
    const { status, message } = friendlyError(e);
    return Response.json({ error: message }, { status });
  }
}
