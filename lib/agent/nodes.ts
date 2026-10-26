/* Client-safe description of the LangGraph workflow (kept separate so the UI does not bundle LangGraph). */
export const GRAPH_NODES = [
  { id: "profiler", label: "Data Profiler", kind: "tool", desc: "Profiles schema, missing values, duplicates & PII. Raw rows never leave the server." },
  { id: "planner", label: "Planner", kind: "llm", desc: "LLM converts your question into a plan of engine operations." },
  { id: "executor", label: "Calculation Engine", kind: "tool", desc: "Deterministic code computes every number. Errors loop back to the Planner." },
  { id: "analyst", label: "Insight Analyst", kind: "llm", desc: "LLM interprets computed tables into observations, trends & anomalies." },
  { id: "validator", label: "Validator", kind: "tool", desc: "Cross-checks every number the Analyst used. Ungrounded claims loop back." },
  { id: "reporter", label: "Report Writer", kind: "llm", desc: "LLM drafts the management summary with validation status." },
] as const;
