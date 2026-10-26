export const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export const SUGGESTED_MODELS = [
  { id: "llama-3.3-70b-versatile", note: "Best all-rounder for analysis & JSON planning" },
  { id: "openai/gpt-oss-120b", note: "Strong reasoning, larger context" },
  { id: "openai/gpt-oss-20b", note: "Fast reasoning model" },
  { id: "qwen/qwen3-32b", note: "Good structured output" },
  { id: "llama-3.1-8b-instant", note: "Fastest & cheapest — fine for chat" },
];

export function getKey(req: Request) {
  const key = req.headers.get("x-groq-key")?.trim();
  if (!key) throw new HttpError(401, "No Groq API key provided. Click the 🔑 button and paste your key (BYOK).");
  return key;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function friendlyError(e: unknown): { status: number; message: string } {
  if (e instanceof HttpError) return { status: e.status, message: e.message };
  const msg = (e as Error)?.message ?? String(e);
  if (/401|invalid api key|invalid_api_key/i.test(msg)) return { status: 401, message: "Groq rejected the API key. Check it at console.groq.com/keys." };
  if (/429|rate limit/i.test(msg)) return { status: 429, message: "Groq rate limit reached. Wait a few seconds, or switch to a smaller model in settings." };
  if (/model.*(not found|decommissioned|does not exist)/i.test(msg)) return { status: 400, message: "That model is not available on your Groq account. Pick another in 🔑 settings." };
  return { status: 500, message: msg.slice(0, 400) };
}
