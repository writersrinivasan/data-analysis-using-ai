import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Audience, Insights, OpResult, OpSpec, Profile, Row, Validation } from "../types";
import { profileForLLM, profileRows } from "../profile";
import { OP_CATALOG, runOp } from "../engine";
import { AUDIENCE_STYLE } from "../audience";

export interface TraceEvent {
  node: string;
  label: string;
  detail: string;
  ms?: number;
}

const AgentState = Annotation.Root({
  question: Annotation<string>(),
  audience: Annotation<Audience>(),
  datasetName: Annotation<string>(),
  func: Annotation<string>(),
  columns: Annotation<string[]>(),
  rows: Annotation<Row[]>(),
  profile: Annotation<Profile | null>(),
  plan: Annotation<{ restated: string; assumptions: string[]; ops: OpSpec[] } | null>(),
  results: Annotation<OpResult[]>(),
  planAttempts: Annotation<number>(),
  analystAttempts: Annotation<number>(),
  feedback: Annotation<string>(),
  insights: Annotation<Insights | null>(),
  validation: Annotation<Validation | null>(),
  report: Annotation<string>(),
  trace: Annotation<TraceEvent[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
});

type State = typeof AgentState.State;

function extractJSON<T>(text: string): T {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```json|```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Model did not return JSON");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

function compactResults(results: OpResult[], maxRows = 25) {
  return results.map((r) => ({
    id: r.id,
    title: r.title,
    op: r.op,
    formula: r.formula,
    note: r.note,
    error: r.error,
    columns: r.columns,
    rows: r.rows.slice(0, maxRows),
    truncated: r.rows.length > maxRows ? `${r.rows.length - maxRows} more rows not shown` : undefined,
  }));
}

/* Collect every number that appears in the computed result tables (plus common derived forms). */
function numberUniverse(results: OpResult[]) {
  const nums: number[] = [];
  const push = (n: number) => Number.isFinite(n) && nums.push(n);
  for (const r of results) {
    for (const row of r.rows) {
      for (const v of Object.values(row)) {
        const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[,₹%]/g, ""));
        if (Number.isFinite(n)) push(n);
      }
    }
    const txt = `${r.note ?? ""} ${r.formula ?? ""}`;
    for (const m of txt.matchAll(/-?\d[\d,]*\.?\d*/g)) push(Number(m[0].replace(/,/g, "")));
  }
  return nums;
}

function parseClaimNumbers(text: string): { raw: string; value: number }[] {
  const out: { raw: string; value: number }[] = [];
  const re = /(₹|INR|Rs\.?)?\s?(-?\d[\d,]*\.?\d*)\s?(%|cr|crore|lakh|lakhs|l\b|k\b|m\b|mn|million|x)?/gi;
  for (const m of text.matchAll(re)) {
    const rawNum = m[2].replace(/,/g, "");
    let v = Number(rawNum);
    if (!Number.isFinite(v)) continue;
    const unit = (m[3] ?? "").toLowerCase();
    if (/^(19|20)\d{2}$/.test(rawNum) && !unit) continue; // years
    if (Math.abs(v) < 10 && !unit && !rawNum.includes(".")) continue; // small counts like "top 5"
    if (unit === "cr" || unit === "crore") v *= 1e7;
    else if (unit.startsWith("lakh") || unit === "l") v *= 1e5;
    else if (unit === "k") v *= 1e3;
    else if (unit === "m" || unit === "mn" || unit === "million") v *= 1e6;
    out.push({ raw: m[0].trim(), value: v });
  }
  return out;
}

function grounded(value: number, universe: number[]) {
  const candidates = [value, Math.abs(value)];
  return universe.some((u) => candidates.some((c) => {
    const tol = Math.max(Math.abs(u) * 0.025, 0.6);
    return Math.abs(Math.abs(u) - c) <= tol || (Math.abs(u) < 1.5 && Math.abs(u * 100 - c) <= 1); // ratio shown as %
  }));
}

export function buildAgent(apiKey: string, modelName: string) {
  const llm = new ChatGroq({ apiKey, model: modelName, temperature: 0.2, maxTokens: 2500 });

  const callJSON = async <T,>(system: string, user: string) => {
    const res = await llm.invoke([new SystemMessage(system), new HumanMessage(user)], { response_format: { type: "json_object" } });
    return extractJSON<T>(typeof res.content === "string" ? res.content : JSON.stringify(res.content));
  };

  /* 1. Profiler — deterministic. The LLM never sees raw rows, only this profile. */
  const profiler = async (s: State): Promise<Partial<State>> => {
    const t = Date.now();
    const profile = profileRows(s.rows, s.columns);
    const pii = profile.columns.filter((c) => c.piiRisk).map((c) => `${c.name} (${c.piiRisk})`);
    return {
      profile,
      trace: [{
        node: "profiler",
        label: "Data Profiler",
        detail: `${profile.rowCount} rows × ${profile.columnCount} columns · ${profile.duplicateRows} duplicate rows · ${profile.columns.reduce((a, c) => a + c.missing, 0)} missing cells${pii.length ? ` · PII withheld from LLM: ${pii.join(", ")}` : ""}`,
        ms: Date.now() - t,
      }],
    };
  };

  /* 2. Planner — LLM turns the business question into a tool plan. */
  const planner = async (s: State): Promise<Partial<State>> => {
    const t = Date.now();
    const system = `You are the Planner agent in a data-analysis team for the ${s.func} function.
Translate the business question into 1-4 deterministic operations that a calculation engine will execute.
You never compute numbers yourself. Only use columns that exist in the profile. Prefer the simplest operations that answer the question.
${OP_CATALOG}
Return JSON: {"restated": "question restated in business terms", "assumptions": ["..."], "ops": [{"id":"op1","op":"aggregate","title":"short human title","why":"why this answers the question","params":{...},"chart":{"type":"bar|line|pie|stacked"}}]}`;
    const user = `Dataset: ${s.datasetName}
Profile: ${JSON.stringify(profileForLLM(s.profile!))}
Question: ${s.question}
${s.feedback ? `\nYour previous plan failed. Fix these errors:\n${s.feedback}` : ""}`;
    const plan = await callJSON<{ restated: string; assumptions: string[]; ops: OpSpec[] }>(system, user);
    plan.ops = (plan.ops ?? []).slice(0, 4).map((o, i) => ({ ...o, id: o.id || `op${i + 1}`, params: o.params ?? {} }));
    return {
      plan,
      planAttempts: (s.planAttempts ?? 0) + 1,
      feedback: "",
      trace: [{ node: "planner", label: `Planner${s.planAttempts ? ` (retry ${s.planAttempts})` : ""}`, detail: `${plan.restated} → ${plan.ops.map((o) => `${o.op}: ${o.title}`).join(" · ")}`, ms: Date.now() - t }],
    };
  };

  /* 3. Executor — runs the tools; errors are routed back to the planner. */
  const executor = async (s: State): Promise<Partial<State>> => {
    const t = Date.now();
    const results = s.plan!.ops.map((op) => runOp(s.rows, s.columns, op));
    const errors = results.filter((r) => r.error);
    const ok = results.filter((r) => !r.error);
    return {
      results: ok.length ? ok : results,
      feedback: errors.length ? errors.map((e) => `${e.id} (${e.op}): ${e.error}`).join("\n") : "",
      trace: [{ node: "executor", label: "Calculation Engine", detail: `${ok.length}/${results.length} operations succeeded${errors.length ? ` — errors: ${errors.map((e) => e.error).join("; ")}` : ""}`, ms: Date.now() - t }],
    };
  };

  /* 4. Analyst — LLM interprets computed tables only. */
  const analyst = async (s: State): Promise<Partial<State>> => {
    const t = Date.now();
    const system = `You are the Analyst agent. Interpret ONLY the computed result tables below — never invent numbers.
Every number you mention must be copied from the tables (you may round). If something cannot be concluded from the tables, say so.
Audience: ${AUDIENCE_STYLE[s.audience]}
Return JSON: {"headline":"one-sentence answer","observations":[{"text":"...","evidence":"op id"}],"trends":["..."],"anomalies":["..."],"management_questions":["..."],"human_validation":["what a human must verify before acting"],"caveats":["..."]}
Give 3-5 observations, up to 3 trends, up to 3 anomalies, 3-5 management questions.`;
    const user = `Question: ${s.question}
Dataset: ${s.datasetName} (${s.profile?.rowCount} rows; ${s.profile?.duplicateRows} duplicate rows; columns with missing values: ${s.profile?.columns.filter((c) => c.missing).map((c) => `${c.name}=${c.missing}`).join(", ") || "none"})
Assumptions: ${JSON.stringify(s.plan?.assumptions ?? [])}
Results: ${JSON.stringify(compactResults(s.results))}
${s.feedback ? `\nA validator found numbers in your previous draft that do not appear in the results: ${s.feedback}. Rewrite using only numbers from the tables.` : ""}`;
    const insights = await callJSON<Insights>(system, user);
    insights.observations = (insights.observations ?? []).map((o) => (typeof o === "string" ? { text: o } : o));
    for (const k of ["trends", "anomalies", "management_questions", "human_validation", "caveats"] as const) insights[k] = Array.isArray(insights[k]) ? insights[k] : [];
    return {
      insights,
      analystAttempts: (s.analystAttempts ?? 0) + 1,
      feedback: "",
      trace: [{ node: "analyst", label: `Insight Analyst${s.analystAttempts ? " (revision)" : ""}`, detail: insights.headline ?? "", ms: Date.now() - t }],
    };
  };

  /* 5. Validator — deterministic cross-check of every number the analyst used. */
  const validator = async (s: State): Promise<Partial<State>> => {
    const t = Date.now();
    const universe = numberUniverse(s.results);
    const ins = s.insights!;
    const unmatchedAll: string[] = [];
    ins.observations = ins.observations.map((o) => {
      const nums = parseClaimNumbers(o.text);
      const unmatched = nums.filter((n) => !grounded(n.value, universe)).map((n) => n.raw);
      unmatchedAll.push(...unmatched);
      return { ...o, grounded: unmatched.length === 0, unmatched };
    });
    const groundedCount = ins.observations.filter((o) => o.grounded).length;
    const total = ins.observations.length || 1;
    const p = s.profile!;
    const checks: Validation["checks"] = [
      { label: "Recalculate", status: "pass", detail: `All figures computed by the deterministic engine (${s.results.length} operation${s.results.length === 1 ? "" : "s"}); formulas shown on each table.` },
      { label: "Cross-check numbers", status: groundedCount === total ? "pass" : groundedCount / total >= 0.6 ? "warn" : "fail", detail: `${groundedCount}/${total} observations use only numbers found in the result tables${unmatchedAll.length ? `. Unverified: ${unmatchedAll.slice(0, 6).join(", ")}` : ""}` },
      { label: "Data quality", status: p.duplicateRows || p.columns.some((c) => c.variantGroups?.length || (c.outliers ?? 0) > 0) ? "warn" : "pass", detail: [p.duplicateRows ? `${p.duplicateRows} duplicate rows` : "", p.columns.filter((c) => c.variantGroups?.length).map((c) => `${c.name} has spelling variants`).join(", "), p.columns.filter((c) => c.outliers).map((c) => `${c.name}: ${c.outliers} extreme values`).join(", ")].filter(Boolean).join(" · ") || "No major issues detected" },
      { label: "Missing values", status: p.columns.some((c) => c.missing > 0) ? "warn" : "pass", detail: p.columns.filter((c) => c.missing).map((c) => `${c.name}: ${c.missing}`).join(", ") || "None" },
      { label: "Privacy", status: p.columns.some((c) => c.piiRisk) ? "warn" : "pass", detail: p.columns.some((c) => c.piiRisk) ? `Sensitive columns present (${p.columns.filter((c) => c.piiRisk).map((c) => c.name).join(", ")}). Only aggregates were sent to the LLM.` : "No PII columns detected" },
      { label: "Business review", status: "warn", detail: "A domain owner must confirm context, causes and the decision. AI output is a draft." },
    ];
    const validation: Validation = { groundedCount, total, score: Math.round((groundedCount / total) * 100), checks };
    const needsRevision = groundedCount < total && (s.analystAttempts ?? 0) < 2;
    return {
      insights: { ...ins },
      validation,
      feedback: needsRevision ? unmatchedAll.join(", ") : "",
      trace: [{ node: "validator", label: "Validator", detail: `Grounding score ${validation.score}% (${groundedCount}/${total})${needsRevision ? " → sending back to Analyst for revision" : ""}`, ms: Date.now() - t }],
    };
  };

  /* 6. Reporter — management summary. */
  const reporter = async (s: State): Promise<Partial<State>> => {
    const t = Date.now();
    const system = `You are the Reporting agent. Write a concise management report in GitHub-flavoured Markdown for the ${s.func} function.
Audience: ${AUDIENCE_STYLE[s.audience]}
Sections (use ### headings): Executive Summary (3 lines max), Key Findings (bullets with numbers), Business Implications, Risks, Recommended Questions, Action Items (owner + timeframe placeholders), What Needs Human Validation.
Use only numbers present in the insights/results. Mark unverified claims with "(unverified)". No preamble.`;
    const user = `Question: ${s.question}
Insights: ${JSON.stringify(s.insights)}
Validation: ${JSON.stringify(s.validation)}
Results: ${JSON.stringify(compactResults(s.results, 12))}`;
    const res = await llm.invoke([new SystemMessage(system), new HumanMessage(user)]);
    const report = (typeof res.content === "string" ? res.content : "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    return { report, trace: [{ node: "reporter", label: "Report Writer", detail: "Management summary drafted", ms: Date.now() - t }] };
  };

  return new StateGraph(AgentState)
    .addNode("profiler", profiler)
    .addNode("planner", planner)
    .addNode("executor", executor)
    .addNode("analyst", analyst)
    .addNode("validator", validator)
    .addNode("reporter", reporter)
    .addEdge(START, "profiler")
    .addEdge("profiler", "planner")
    .addEdge("planner", "executor")
    .addConditionalEdges("executor", (s: State) => (s.feedback && (s.planAttempts ?? 0) < 3 ? "planner" : "analyst"), ["planner", "analyst"])
    .addEdge("analyst", "validator")
    .addConditionalEdges("validator", (s: State) => (s.feedback ? "analyst" : "reporter"), ["analyst", "reporter"])
    .addEdge("reporter", END)
    .compile();
}
