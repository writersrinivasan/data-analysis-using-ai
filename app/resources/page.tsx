"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ExternalLink, FlaskConical, Search } from "lucide-react";
import { GLOSSARY, PROMPT_LIBRARY, RESOURCE_GROUPS } from "@/lib/content";
import { AUDIENCES } from "@/lib/audience";
import { useSettings } from "@/components/Providers";
import { CopyButton, SectionHeader, Tabs } from "@/components/ui";

const EXCEL_VS_AI = [
  { task: "Total spend by vendor", excel: "=SUMIFS(Total, Vendor, \"Apex Supplies\")  or a PivotTable", ai: "Give me total spend by vendor, sorted, with share of total." },
  { task: "Find duplicates", excel: "Conditional Formatting → Duplicate Values; COUNTIFS > 1", ai: "Find rows with the same vendor, amount and date but different PO numbers." },
  { task: "Month-on-month growth", excel: "=(B3-B2)/B2", ai: "Show monthly totals with MoM change % and flag months > ±20%." },
  { task: "Outliers", excel: "=QUARTILE.INC(..,3)+1.5*(Q3−Q1)", ai: "List transactions above Q3 + 1.5×IQR and explain each." },
  { task: "Standardize names", excel: "=PROPER(TRIM(A2)) + manual find/replace", ai: "Group spelling variants of vendor names and propose a standard name." },
  { task: "Conversion rate", excel: "=Joined/Applications", ai: "Compute stage-by-stage conversion for the hiring funnel by source." },
  { task: "Budget variance", excel: "=Actual−Budget ; =(Actual−Budget)/Budget", ai: "Rank departments by absolute budget variance with variance %." },
  { task: "Forecast", excel: "=FORECAST.LINEAR(x, known_y, known_x) or Forecast Sheet", ai: "Forecast next 3 months with a range and list the assumptions." },
];

const LANGGRAPH_SNIPPET = `import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";

const State = Annotation.Root({
  question: Annotation<string>(),
  plan: Annotation<OpSpec[]>(),
  results: Annotation<OpResult[]>(),
  feedback: Annotation<string>(),
  report: Annotation<string>(),
});

const llm = new ChatGroq({ apiKey: userKey, model: "llama-3.3-70b-versatile" });

const graph = new StateGraph(State)
  .addNode("planner",  plannerNode)   // LLM → JSON plan of engine ops
  .addNode("executor", executorNode)  // deterministic code computes numbers
  .addNode("analyst",  analystNode)   // LLM interprets result tables
  .addNode("validator", validatorNode)// code checks every number is grounded
  .addNode("reporter", reporterNode)  // LLM writes management summary
  .addEdge(START, "planner")
  .addEdge("planner", "executor")
  .addConditionalEdges("executor", s => s.feedback ? "planner" : "analyst")
  .addEdge("analyst", "validator")
  .addConditionalEdges("validator", s => s.feedback ? "analyst" : "reporter")
  .addEdge("reporter", END)
  .compile();

for await (const update of await graph.stream(input, { streamMode: "updates" })) {
  send(update); // stream each node's progress to the UI
}`;

const PANDAS_SNIPPET = `import pandas as pd

df = pd.read_csv("procurement_purchase_orders.csv")
df["Vendor"] = df["Vendor"].str.strip().str.title().replace({
    "Apex Supplies Pvt Ltd": "Apex Supplies", "Nimbus Cloud": "Nimbus Cloud Services"})
df["Date"] = pd.to_datetime(df["Date"], dayfirst=True, format="mixed")

before = df[df.Date < "2026-04-01"].groupby(["Vendor", "Item"])["Unit Price (INR)"].mean()
after  = df[df.Date >= "2026-04-01"].groupby(["Vendor", "Item"])["Unit Price (INR)"].mean()
change = ((after - before) / before * 100).round(1).sort_values(ascending=False)
print(change.head(10))`;

const CURL_SNIPPET = `curl https://api.groq.com/openai/v1/chat/completions \\
  -H "Authorization: Bearer $GROQ_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama-3.3-70b-versatile",
    "response_format": {"type": "json_object"},
    "messages": [
      {"role": "system", "content": "Return JSON: {\\"ops\\": [...]}"},
      {"role": "user", "content": "Top 5 vendors by spend"}
    ]
  }'`;

export default function ResourcesPage() {
  const { audience } = useSettings();
  const [level, setLevel] = useState<string>("all");
  const [q, setQ] = useState("");
  const [code, setCode] = useState<"langgraph" | "pandas" | "curl">("langgraph");
  const snippet = code === "langgraph" ? LANGGRAPH_SNIPPET : code === "pandas" ? PANDAS_SNIPPET : CURL_SNIPPET;
  return (
    <div className="space-y-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-sky-600 p-8 text-white sm:p-10">
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10" />
        <div className="relative max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Keep learning</div>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">Technical resources & toolkit</h1>
          <p className="mt-3 text-white/90">Curated links, a prompt library, Excel ↔ AI cheat sheet, glossary, and the code patterns behind this app.</p>
        </div>
      </div>

      <section>
        <SectionHeader
          kicker="Curated"
          title="Learning resources"
          right={
            <select className="input w-auto" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="all">All levels</option>
              {AUDIENCES.map((a) => (
                <option key={a.id} value={a.id}>{a.emoji} {a.label}{a.id === audience ? " (you)" : ""}</option>
              ))}
            </select>
          }
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {RESOURCE_GROUPS.map((g) => {
            const items = g.items.filter((r) => level === "all" || r.level === "all" || r.level === level);
            if (!items.length) return null;
            return (
              <div key={g.group} className="card card-pad">
                <h3 className="font-display text-lg font-bold">{g.emoji} {g.group}</h3>
                <div className="mt-3 space-y-2">
                  {items.map((r) => (
                    <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="group flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-violet-200 hover:bg-violet-50/40">
                      <span className={clsx("chip mt-0.5 shrink-0", { Docs: "bg-sky-100 text-sky-700", Course: "bg-emerald-100 text-emerald-700", Tool: "bg-amber-100 text-amber-700", Guide: "bg-violet-100 text-violet-700", Book: "bg-rose-100 text-rose-700", Dataset: "bg-cyan-100 text-cyan-700", Video: "bg-pink-100 text-pink-700" }[r.type])}>{r.type}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 text-sm font-semibold text-slate-800 group-hover:text-violet-700">
                          {r.title} <ExternalLink className="h-3 w-3 opacity-50" />
                        </div>
                        <p className="text-xs text-slate-600">{r.desc}</p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400">{r.level === "all" ? "all" : AUDIENCES.find((a) => a.id === r.level)?.short}</span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader kicker="Copy & use" title="Prompt library" sub="Grouped by workflow stage. Pair with the 6-part prompt structure from Module 2." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {PROMPT_LIBRARY.map((c, i) => (
            <div key={c.cat} className="card p-4">
              <div className={clsx("mb-3 inline-block rounded-lg px-2 py-1 text-xs font-bold text-white", ["bg-violet-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"][i])}>{c.cat}</div>
              <div className="space-y-2">
                {c.prompts.map((p) => (
                  <div key={p} className="rounded-xl bg-slate-50 p-2 text-xs text-slate-700">
                    {p}
                    <div className="mt-1 flex justify-end gap-1">
                      <CopyButton text={p} />
                      <Link href={`/sandbox?tab=agent&q=${encodeURIComponent(p)}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-violet-600 hover:bg-violet-50">
                        <FlaskConical className="h-3.5 w-3.5" /> Try
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader kicker="Cheat sheet" title="Excel formula ↔ AI prompt" sub="Use the formula to validate the AI; use the prompt to go faster." />
        <div className="card overflow-hidden">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-emerald-50 to-sky-50 text-left">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Excel / formula (validate)</th>
                  <th className="px-4 py-3">AI prompt (accelerate)</th>
                </tr>
              </thead>
              <tbody>
                {EXCEL_VS_AI.map((r) => (
                  <tr key={r.task} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 font-semibold">{r.task}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.excel}</td>
                    <td className="px-4 py-3 text-xs italic text-slate-700">&ldquo;{r.ai}&rdquo;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader kicker="For builders" title="Code patterns behind this app" sub="How the agentic workflow is wired — reuse it for your own internal tools." />
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-3">
            <Tabs value={code} onChange={setCode} tabs={[{ id: "langgraph", label: "LangGraph.js agent" }, { id: "pandas", label: "pandas validation" }, { id: "curl", label: "Groq API (JSON mode)" }]} />
          </div>
          <div className="relative">
            <CopyButton text={snippet} className="absolute right-3 top-3 bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white" />
            <pre className="scrollbar-thin overflow-x-auto bg-slate-950 p-5 text-xs leading-relaxed text-emerald-200">{snippet}</pre>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { t: "Plan with LLM, compute with code", d: "The planner emits JSON operations; a typed engine executes them. Numbers are reproducible and auditable." },
            { t: "Validate automatically", d: "Extract every number from the LLM's narrative and match it against computed tables. Loop back if it can't be grounded." },
            { t: "Minimise data exposure", d: "Send schema, distinct categories and aggregates to the model — not rows. Mask PII before anything leaves." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl bg-gradient-to-br from-violet-50 to-sky-50 p-4">
              <div className="font-semibold text-slate-800">{x.t}</div>
              <p className="mt-1 text-xs text-slate-600">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader kicker="Reference" title="Glossary" right={<div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className="input pl-9" placeholder="Search terms…" value={q} onChange={(e) => setQ(e.target.value)} /></div>} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GLOSSARY.filter((g) => (g.term + g.def).toLowerCase().includes(q.toLowerCase())).map((g) => (
            <div key={g.term} className="card p-4">
              <div className="font-display font-bold text-violet-700">{g.term}</div>
              <p className="mt-1 text-sm text-slate-600">{g.def}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
