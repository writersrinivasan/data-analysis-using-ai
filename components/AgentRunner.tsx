"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, Bot, CheckCircle2, ChevronRight, Cpu, Download, KeyRound, Loader2, Play, ShieldCheck, Sparkles, Wrench, XCircle } from "lucide-react";
import type { Insights, OpResult, OpSpec, Profile, Row, Validation } from "@/lib/types";
import type { TraceEvent } from "@/lib/agent/graph";
import { GRAPH_NODES } from "@/lib/agent/nodes";
import { useSettings } from "./Providers";
import { ResultCard } from "./ResultCard";
import { CopyButton, Markdown } from "./ui";

interface RunState {
  trace: TraceEvent[];
  plan: { restated: string; assumptions: string[]; ops: OpSpec[] } | null;
  results: OpResult[];
  insights: Insights | null;
  validation: Validation | null;
  report: string;
  profile: Profile | null;
  active: string | null;
  visits: Record<string, number>;
  error: string | null;
  done: boolean;
}

const EMPTY: RunState = { trace: [], plan: null, results: [], insights: null, validation: null, report: "", profile: null, active: null, visits: {}, error: null, done: false };

const NEXT: Record<string, string> = { profiler: "planner", planner: "executor", executor: "analyst", analyst: "validator", validator: "reporter" };

export function AgentRunner({ dataset, question, setQuestion, suggestions, autoRun }: { dataset: { name: string; func: string; columns: string[]; rows: Row[] }; question: string; setQuestion: (q: string) => void; suggestions: string[]; autoRun?: boolean }) {
  const { apiKey, audience, model, openSettings } = useSettings();
  const [st, setSt] = useState<RunState>(EMPTY);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<"insights" | "report" | "plan">("insights");
  const abortRef = useRef<AbortController | null>(null);
  const autoRan = useRef(false);

  const run = async (q = question) => {
    if (!q.trim()) return;
    if (!apiKey) {
      openSettings();
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setRunning(true);
    setTab("insights");
    setSt({ ...EMPTY, active: "profiler" });
    try {
      const r = await fetch("/api/agent", {
        method: "POST",
        signal: ac.signal,
        headers: { "Content-Type": "application/json", "x-groq-key": apiKey },
        body: JSON.stringify({ question: q, audience, model, datasetName: dataset.name, func: dataset.func, columns: dataset.columns, rows: dataset.rows }),
      });
      if (!r.ok || !r.body) {
        const j = await r.json().catch(() => ({ error: r.statusText }));
        setSt((s) => ({ ...s, error: j.error, active: null }));
        return;
      }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === "update") {
            const d = ev.data as Partial<RunState> & { feedback?: string };
            setSt((s) => {
              let nextNode = NEXT[ev.node] ?? null;
              if (ev.node === "executor" && d.feedback) nextNode = "planner";
              if (ev.node === "validator" && d.feedback) nextNode = "analyst";
              return {
                ...s,
                trace: [...s.trace, ...(d.trace ?? [])],
                plan: d.plan ?? s.plan,
                results: d.results ?? s.results,
                insights: d.insights ?? s.insights,
                validation: d.validation ?? s.validation,
                report: d.report ?? s.report,
                profile: d.profile ?? s.profile,
                visits: { ...s.visits, [ev.node]: (s.visits[ev.node] ?? 0) + 1 },
                active: nextNode,
              };
            });
          } else if (ev.type === "error") {
            setSt((s) => ({ ...s, error: ev.message, active: null }));
          } else if (ev.type === "done") {
            setSt((s) => ({ ...s, done: true, active: null }));
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setSt((s) => ({ ...s, error: (e as Error).message, active: null }));
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (autoRun && !autoRan.current && apiKey && question) {
      autoRan.current = true;
      void run(question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, apiKey]);

  const downloadReport = () => {
    const md = `# ${dataset.name} — AI Analysis\n\n**Question:** ${question}\n\n${st.report}\n\n---\n_Validation score: ${st.validation?.score ?? "n/a"}%. Generated with a LangGraph agent on Groq (${model}). Verify before use._\n`;
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dataset.name.replace(/\W+/g, "_").toLowerCase()}_report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Question box */}
      <div className="card card-pad">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Sparkles className="h-4 w-4 text-fuchsia-500" /> Ask your data a question
        </div>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          <textarea className="input min-h-[52px] flex-1 resize-y" rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Which vendors raised prices since April?" />
          <button className="btn-primary sm:w-40" disabled={running || !question.trim()}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : apiKey ? <Play className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
            {running ? "Agents working" : apiKey ? "Run agents" : "Add key"}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => { setQuestion(s); void run(s); }} disabled={running} className="rounded-full border border-violet-100 bg-violet-50/60 px-3 py-1 text-left text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50">
              {s.length > 90 ? s.slice(0, 88) + "…" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Graph */}
      <div className="card card-pad">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Cpu className="h-4 w-4 text-violet-500" /> LangGraph workflow {running && <span className="chip bg-violet-100 text-violet-700">live</span>}
          </div>
          <div className="flex gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Bot className="h-3 w-3 text-fuchsia-500" /> LLM node</span>
            <span className="flex items-center gap-1"><Wrench className="h-3 w-3 text-sky-500" /> Deterministic tool</span>
          </div>
        </div>
        <div className="scrollbar-thin flex items-stretch gap-1 overflow-x-auto pb-2">
          {GRAPH_NODES.map((n, i) => {
            const visits = st.visits[n.id] ?? 0;
            const isActive = st.active === n.id && running;
            return (
              <div key={n.id} className="flex items-center">
                <div
                  className={clsx(
                    "relative w-40 shrink-0 rounded-2xl border-2 p-3 transition",
                    isActive ? "border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/20" : visits ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-white",
                  )}
                  title={n.desc}
                >
                  <div className="flex items-center gap-1.5">
                    {n.kind === "llm" ? <Bot className="h-4 w-4 text-fuchsia-500" /> : <Wrench className="h-4 w-4 text-sky-500" />}
                    <span className="text-xs font-bold text-slate-800">{n.label}</span>
                  </div>
                  <p className="mt-1 line-clamp-3 text-[10.5px] leading-snug text-slate-500">{n.desc}</p>
                  <div className="absolute -right-1.5 -top-1.5">
                    {isActive ? <Loader2 className="h-5 w-5 animate-spin rounded-full bg-white text-violet-600" /> : visits ? <CheckCircle2 className="h-5 w-5 rounded-full bg-white text-emerald-500" /> : null}
                  </div>
                  {visits > 1 && <span className="chip absolute -bottom-2 right-2 bg-amber-100 text-amber-700">×{visits} loop</span>}
                </div>
                {i < GRAPH_NODES.length - 1 && <ChevronRight className="mx-0.5 h-4 w-4 shrink-0 text-slate-300" />}
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">Loops: Calculation Engine → Planner on tool errors (max 3) · Validator → Analyst when numbers can&apos;t be traced to computed tables (max 1 revision).</p>
        {st.trace.length > 0 && (
          <ol className="mt-3 space-y-1.5 border-l-2 border-violet-100 pl-4">
            {st.trace.map((t, i) => (
              <li key={i} className="text-xs">
                <span className="font-semibold text-violet-700">{t.label}</span>
                {t.ms !== undefined && <span className="ml-1 text-slate-400">{(t.ms / 1000).toFixed(1)}s</span>}
                <span className="text-slate-600"> — {t.detail}</span>
              </li>
            ))}
          </ol>
        )}
        {st.error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {st.error}
          </div>
        )}
      </div>

      {/* Results */}
      {st.results.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {st.results.map((r, i) => (
            <ResultCard key={r.id + i} r={r} index={i} />
          ))}
        </div>
      )}

      {(st.insights || st.plan) && (
        <div className="card card-pad">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(["insights", "report", "plan"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={clsx("rounded-xl px-3 py-1.5 text-sm font-semibold", tab === t ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                {t === "insights" ? "Insights & validation" : t === "report" ? "Management report" : "Agent plan (JSON)"}
              </button>
            ))}
            {st.validation && (
              <span className={clsx("chip ml-auto", st.validation.score >= 80 ? "bg-emerald-100 text-emerald-700" : st.validation.score >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700")}>
                <ShieldCheck className="h-3.5 w-3.5" /> Grounding {st.validation.score}%
              </span>
            )}
          </div>

          {tab === "insights" && st.insights && (
            <div className="grid gap-5 lg:grid-cols-5">
              <div className="space-y-4 lg:col-span-3">
                <div className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 p-4 text-white">
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/70">Headline</div>
                  <div className="mt-1 font-display text-lg font-bold">{st.insights.headline}</div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-bold text-slate-800">Key observations</h4>
                  <ul className="space-y-2">
                    {st.insights.observations.map((o, i) => (
                      <li key={i} className="flex gap-2 rounded-xl border border-slate-100 bg-white p-3 text-sm">
                        {o.grounded === false ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
                        <div>
                          <div className="text-slate-700">{o.text}</div>
                          {o.grounded === false && <div className="mt-1 text-xs text-amber-700">Not found in computed tables: {o.unmatched?.join(", ")} — verify manually.</div>}
                          {o.evidence && <div className="mt-0.5 text-[11px] text-slate-400">evidence: {o.evidence}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ListBlock title="📈 Trends" items={st.insights.trends} tone="sky" />
                  <ListBlock title="🚨 Anomalies" items={st.insights.anomalies} tone="rose" />
                  <ListBlock title="❓ Management questions" items={st.insights.management_questions} tone="violet" />
                  <ListBlock title="🧑‍⚖️ Needs human validation" items={st.insights.human_validation} tone="amber" />
                </div>
              </div>
              <div className="lg:col-span-2">
                <h4 className="mb-2 text-sm font-bold text-slate-800">Validation checklist (auto)</h4>
                <div className="space-y-2">
                  {st.validation?.checks.map((c) => (
                    <div key={c.label} className="rounded-xl border border-slate-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {c.status === "pass" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : c.status === "warn" ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                        {c.label}
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{c.detail}</p>
                    </div>
                  ))}
                  {!st.validation && <p className="text-xs text-slate-400">Waiting for the Validator…</p>}
                </div>
                {st.insights.caveats.length > 0 && <ListBlock title="⚠️ Caveats" items={st.insights.caveats} tone="slate" />}
              </div>
            </div>
          )}

          {tab === "report" &&
            (st.report ? (
              <div>
                <div className="mb-3 flex gap-2">
                  <button className="btn-soft" onClick={downloadReport}>
                    <Download className="h-4 w-4" /> Download .md
                  </button>
                  <CopyButton text={st.report} label="Copy report" className="btn-ghost" />
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-5">
                  <Markdown>{st.report}</Markdown>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">{running ? "The Report Writer is drafting…" : "No report yet."}</p>
            ))}

          {tab === "plan" && st.plan && (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                <b>Restated question:</b> {st.plan.restated}
              </p>
              {st.plan.assumptions?.length > 0 && <ListBlock title="Assumptions the Planner made (check these!)" items={st.plan.assumptions} tone="amber" />}
              <pre className="scrollbar-thin max-h-96 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-emerald-200">{JSON.stringify(st.plan.ops, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ListBlock({ title, items, tone }: { title: string; items: string[]; tone: "sky" | "rose" | "violet" | "amber" | "slate" }) {
  if (!items?.length) return null;
  const tones = { sky: "bg-sky-50 border-sky-100", rose: "bg-rose-50 border-rose-100", violet: "bg-violet-50 border-violet-100", amber: "bg-amber-50 border-amber-100", slate: "bg-slate-50 border-slate-100" };
  return (
    <div className={clsx("mt-3 rounded-xl border p-3", tones[tone])}>
      <div className="mb-1 text-xs font-bold text-slate-700">{title}</div>
      <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
