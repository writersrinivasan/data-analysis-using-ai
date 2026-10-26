"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Papa from "papaparse";
import clsx from "clsx";
import { AlertTriangle, Bot, Calculator, CheckCircle2, ClipboardPaste, Database, Download, Eraser, Eye, EyeOff, FlaskConical, Loader2, RotateCcw, ScanSearch, ShieldCheck, Upload, Wand2 } from "lucide-react";
import { DATASET_LIST, getDataset, toCSV } from "@/lib/datasets";
import type { Dataset, FunctionId, OpResult, Profile, Row } from "@/lib/types";
import { profileRows } from "@/lib/profile";
import { CLEAN_STEPS, applyMappings, type CleanLog } from "@/lib/cleaning";
import { maskRows } from "@/lib/privacy";
import { OP_NAMES, runOp } from "@/lib/engine";
import { DataTable } from "@/components/DataTable";
import { AgentRunner } from "@/components/AgentRunner";
import { ResultCard } from "@/components/ResultCard";
import { PiiScanner } from "@/components/widgets/PiiScanner";
import { useSettings } from "@/components/Providers";
import { Stat, Tabs, fmt } from "@/components/ui";

type Tab = "data" | "profile" | "clean" | "privacy" | "agent" | "manual";

interface Working {
  id: FunctionId | "upload";
  name: string;
  func: string;
  file: string;
  description: string;
  columns: string[];
  rows: Row[];
  original: Row[];
  originalColumns: string[];
  plantedIssues: string[];
  plantedInsights: string[];
  prompts: string[];
}

function fromDataset(d: Dataset): Working {
  return { ...d, original: d.rows, originalColumns: d.columns };
}

export default function SandboxPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading sandbox…</div>}>
      <Sandbox />
    </Suspense>
  );
}

function Sandbox() {
  const params = useSearchParams();
  const { apiKey, model, openSettings } = useSettings();
  const initialId = (params.get("dataset") as FunctionId) || "procurement";
  const [w, setW] = useState<Working>(() => fromDataset(getDataset(DATASET_LIST.some((d) => d.id === initialId) ? initialId : "procurement")));
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || (params.get("q") ? "agent" : "data"));
  const [question, setQuestion] = useState(params.get("q") ?? w.prompts[0] ?? "");
  const [logs, setLogs] = useState<CleanLog[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNotes, setAiNotes] = useState<string[]>([]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const profile: Profile = useMemo(() => profileRows(w.rows, w.columns), [w.rows, w.columns]);

  const pick = (id: FunctionId) => {
    const d = fromDataset(getDataset(id));
    setW(d);
    setLogs([]);
    setAiNotes([]);
    setQuestion(d.prompts[0]);
  };

  const loadCSV = (text: string, name: string) => {
    const parsed = Papa.parse<Record<string, string>>(text.trim(), { header: true, dynamicTyping: true, skipEmptyLines: true });
    const rows = (parsed.data as Row[]).slice(0, 10000);
    if (!rows.length) return;
    const columns = parsed.meta.fields ?? Object.keys(rows[0]);
    setW({ id: "upload", name, func: "Business", file: name, description: "Your uploaded data. Mask PII before sending to AI!", columns, rows, original: rows, originalColumns: columns, plantedIssues: [], plantedInsights: [], prompts: ["What does this dataset contain? Describe it and list data-quality issues.", "What are the most important trends and anomalies?", "What questions should management ask of this data?"] });
    setLogs([]);
    setQuestion("What does this dataset contain? Describe it and list data-quality issues.");
    setTab("profile");
  };

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => loadCSV(String(reader.result), f.name);
    reader.readAsText(f);
  };

  const applyStep = (i: number) => {
    const step = CLEAN_STEPS[i];
    const res = step.fn(w.rows, w.columns);
    setW({ ...w, rows: res.rows, columns: res.columns });
    setLogs((l) => [...l, res.log]);
  };

  const runAll = () => {
    let rows = w.rows;
    let columns = w.columns;
    const newLogs: CleanLog[] = [];
    for (const s of CLEAN_STEPS) {
      const r = s.fn(rows, columns);
      rows = r.rows;
      columns = r.columns;
      newLogs.push(r.log);
    }
    setW({ ...w, rows, columns });
    setLogs((l) => [...l, ...newLogs]);
  };

  const aiStandardize = async () => {
    if (!apiKey) return openSettings();
    setAiBusy(true);
    setAiNotes([]);
    try {
      const cols = profile.columns.filter((c) => c.kind === "categorical" && !c.piiRisk && c.unique <= 60).map((c) => ({ name: c.name, values: c.top ?? [] }));
      const r = await fetch("/api/clean-suggest", { method: "POST", headers: { "Content-Type": "application/json", "x-groq-key": apiKey }, body: JSON.stringify({ columns: cols, model }) });
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      const res = applyMappings(w.rows, w.columns, j.mappings, "AI standardize (Groq)");
      setW({ ...w, rows: res.rows });
      setLogs((l) => [...l, res.log]);
      setAiNotes(j.notes ?? []);
    } catch (e) {
      setAiNotes([`⚠️ ${(e as Error).message}`]);
    } finally {
      setAiBusy(false);
    }
  };

  const mask = () => {
    const { rows, maskedColumns } = maskRows(w.rows, w.columns);
    setW({ ...w, rows });
    setLogs((l) => [...l, { step: "Mask PII", changed: maskedColumns.length, details: maskedColumns.length ? [`Masked: ${maskedColumns.join(", ")} (names → pseudonyms, salary → bands, contact → partially hidden)`] : ["No PII columns found"] }]);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([toCSV(w.columns, w.rows)], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = w.file.replace(/\.csv$/, "") + "_cleaned.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const issues = profile.columns.reduce((a, c) => a + (c.variantGroups?.length ?? 0) + (c.outliers ?? 0) + (c.mixedDateFormats ? 1 : 0), 0) + profile.duplicateRows;
  const missing = profile.columns.reduce((a, c) => a + c.missing, 0);
  const pii = profile.columns.filter((c) => c.piiRisk);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-500 p-6 text-white sm:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
              <FlaskConical className="h-4 w-4" /> AI Data Sandbox
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Load → Clean → Ask → Validate → Report</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">Practice on realistic, deliberately messy datasets for 8 functions — or upload your own CSV. A LangGraph multi-agent team (on your Groq key) plans the analysis, a deterministic engine computes every number, and a validator checks the AI&apos;s claims.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="card p-4">
            <div className="label">Sample datasets</div>
            <div className="space-y-1">
              {DATASET_LIST.map((d) => (
                <button key={d.id} onClick={() => pick(d.id)} className={clsx("w-full rounded-xl px-3 py-2 text-left transition", w.id === d.id ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow" : "hover:bg-slate-50")}>
                  <div className="text-sm font-semibold">{d.name}</div>
                  <div className={clsx("text-[11px]", w.id === d.id ? "text-white/80" : "text-slate-500")}>{d.func}</div>
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="btn-ghost cursor-pointer px-2 text-xs">
                <Upload className="h-4 w-4" /> Upload CSV
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
              </label>
              <button className="btn-ghost px-2 text-xs" onClick={() => setPasteOpen(!pasteOpen)}>
                <ClipboardPaste className="h-4 w-4" /> Paste
              </button>
            </div>
            {pasteOpen && (
              <div className="mt-2">
                <textarea className="input h-28 font-mono text-[11px]" placeholder={"Month,Department,Spend\n2026-01,Sales,120000"} value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
                <button className="btn-soft mt-2 w-full" onClick={() => { loadCSV(pasteText, "pasted_data.csv"); setPasteOpen(false); }}>
                  Load pasted data
                </button>
              </div>
            )}
          </div>

          {(w.plantedIssues.length > 0 || w.plantedInsights.length > 0) && (
            <div className="card p-4">
              <button onClick={() => setShowKey(!showKey)} className="flex w-full items-center justify-between text-sm font-semibold text-slate-700">
                <span>🔑 Trainer answer key</span>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <p className="mt-1 text-[11px] text-slate-500">What we planted in this data — check whether AI finds it.</p>
              {showKey && (
                <div className="mt-3 space-y-3 text-xs">
                  <div>
                    <div className="mb-1 font-bold text-rose-600">Data-quality issues</div>
                    <ul className="list-disc space-y-1 pl-4 text-slate-600">{w.plantedIssues.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                  <div>
                    <div className="mb-1 font-bold text-emerald-600">Real insights</div>
                    <ul className="list-disc space-y-1 pl-4 text-slate-600">{w.plantedInsights.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Main */}
        <section className="min-w-0 space-y-4">
          <div className="card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-violet-600" />
                  <h2 className="font-display text-xl font-bold">{w.name}</h2>
                  <span className="chip bg-violet-100 text-violet-700">{w.func}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{w.description}</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-400">{w.file}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => { setW({ ...w, rows: w.original, columns: w.originalColumns }); setLogs([]); }}>
                  <RotateCcw className="h-4 w-4" /> Reset
                </button>
                <button className="btn-ghost" onClick={download}>
                  <Download className="h-4 w-4" /> CSV
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Rows" value={profile.rowCount.toLocaleString()} sub={`${profile.columnCount} columns`} tone="violet" />
              <Stat label="Missing cells" value={missing} sub={`${profile.columns.filter((c) => c.missing).length} columns affected`} tone="amber" />
              <Stat label="Quality flags" value={issues} sub={`${profile.duplicateRows} duplicate rows`} tone="rose" />
              <Stat label="PII columns" value={pii.length} sub={pii.length ? pii.map((c) => c.name).join(", ") : "none detected"} tone={pii.length ? "rose" : "emerald"} />
            </div>
          </div>

          <Tabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "data", label: "📋 Data" },
              { id: "profile", label: "🔎 Understand" },
              { id: "clean", label: "🧹 Clean" },
              { id: "privacy", label: "🛡️ Privacy" },
              { id: "agent", label: "🤖 Ask AI Agents" },
              { id: "manual", label: "🧮 Manual Tools" },
            ]}
          />

          {tab === "data" && (
            <div className="card card-pad">
              <DataTable columns={w.columns} rows={w.rows} pageSize={15} highlight={(c, v) => (c === "⚠ Data Flag" && v ? "bg-rose-50 text-rose-700 font-semibold" : undefined)} />
              <p className="mt-2 text-[11px] text-slate-500">Amber cells are missing values. Click a column header to sort — sorting is the fastest way to find typos at the extremes.</p>
            </div>
          )}

          {tab === "profile" && <ProfileView profile={profile} />}

          {tab === "clean" && (
            <div className="space-y-4">
              <div className="card card-pad">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-bold">AI-assisted cleaning</h3>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-soft" onClick={aiStandardize} disabled={aiBusy}>
                      {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} AI standardize (Groq)
                    </button>
                    <button className="btn-primary" onClick={runAll}>
                      <Eraser className="h-4 w-4" /> Run all 7 steps
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {CLEAN_STEPS.map((s, i) => (
                    <button key={s.id} onClick={() => applyStep(i)} className="group rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-100 text-xs text-violet-700">{i + 1}</span>
                        {s.label}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{s.desc}</p>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-slate-500">AI standardize sends only distinct category values (never rows, never PII columns) to Groq and asks the model which spellings refer to the same entity.</p>
                {aiNotes.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 rounded-xl bg-violet-50 p-3 pl-7 text-xs text-violet-800">
                    {aiNotes.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                )}
              </div>
              <div className="card card-pad">
                <h3 className="mb-2 font-display text-lg font-bold">Cleaning log</h3>
                {!logs.length && <p className="text-sm text-slate-500">No steps applied yet. Every change is logged here so it can be audited and repeated next month.</p>}
                <ol className="space-y-2">
                  {logs.map((l, i) => (
                    <li key={i} className="rounded-xl border border-slate-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {l.step} <span className="chip bg-slate-100 text-slate-600">{l.changed} change(s)</span>
                      </div>
                      <ul className="mt-1 list-disc pl-6 text-xs text-slate-600">{l.details.map((d, j) => <li key={j}>{d}</li>)}</ul>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {tab === "privacy" && (
            <div className="space-y-4">
              <div className="card card-pad">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" /> Column-level PII check
                  </h3>
                  <button className="btn-primary" onClick={mask} disabled={!pii.length}>
                    <ScanSearch className="h-4 w-4" /> Mask PII columns
                  </button>
                </div>
                {pii.length ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {pii.map((c) => (
                      <div key={c.name} className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm">
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                        <b>{c.name}</b> <span className="text-rose-700">— {c.piiRisk}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-emerald-700">No PII columns detected. 👍 (Tip: load the HR dataset to see masking in action.)</p>
                )}
                <p className="mt-3 text-xs text-slate-500">Masking replaces names with consistent pseudonyms (Person-0007), turns salaries into bands and partially hides emails/phones — analysis by department, tenure or band still works.</p>
              </div>
              <PiiScanner />
            </div>
          )}

          {tab === "agent" && <AgentRunner dataset={{ name: w.name, func: w.func, columns: w.columns, rows: w.rows }} question={question} setQuestion={setQuestion} suggestions={w.prompts} autoRun={params.get("run") === "1"} />}

          {tab === "manual" && <ManualTools key={w.id + w.columns.join()} rows={w.rows} columns={w.columns} profile={profile} />}
        </section>
      </div>
    </div>
  );
}

function ProfileView({ profile }: { profile: Profile }) {
  const kindColor: Record<string, string> = { numeric: "bg-sky-100 text-sky-700", categorical: "bg-fuchsia-100 text-fuchsia-700", date: "bg-emerald-100 text-emerald-700", text: "bg-slate-100 text-slate-700", id: "bg-amber-100 text-amber-700" };
  return (
    <div className="space-y-3">
      <div className="card card-pad text-sm text-slate-600">
        <b>Dimensions</b> (group by): {profile.columns.filter((c) => c.kind === "categorical" || c.kind === "date").map((c) => c.name).join(", ") || "—"}
        <br />
        <b>Measures</b> (aggregate): {profile.columns.filter((c) => c.kind === "numeric").map((c) => c.name).join(", ") || "—"}
        <br />
        <b>Identifiers</b> (count, never sum): {profile.columns.filter((c) => c.kind === "id").map((c) => c.name).join(", ") || "—"}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {profile.columns.map((c) => (
          <div key={c.name} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate font-semibold text-slate-800" title={c.name}>{c.name}</div>
              <span className={clsx("chip", kindColor[c.kind])}>{c.kind}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className={clsx("chip", c.missing ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500")}>{c.missing} missing</span>
              <span className="chip bg-slate-100 text-slate-500">{c.unique} unique</span>
              {c.piiRisk && <span className="chip bg-rose-100 text-rose-700">PII: {c.piiRisk}</span>}
              {(c.outliers ?? 0) > 0 && <span className="chip bg-rose-100 text-rose-700">{c.outliers} extreme</span>}
              {c.mixedDateFormats && <span className="chip bg-rose-100 text-rose-700">mixed date formats</span>}
            </div>
            {c.kind === "numeric" && (
              <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-slate-600">
                <div><span className="text-slate-400">min</span><br />{fmt(c.min)}</div>
                <div><span className="text-slate-400">median</span><br />{fmt(c.median)}</div>
                <div><span className="text-slate-400">max</span><br />{fmt(c.max)}</div>
              </div>
            )}
            {c.kind === "date" && <div className="mt-2 text-[11px] text-slate-600">{c.dateMin} → {c.dateMax}</div>}
            {c.top && c.kind === "categorical" && <div className="mt-2 truncate text-[11px] text-slate-500">Top: {c.top.slice(0, 4).map((t) => `${t.value} (${t.count})`).join(", ")}</div>}
            {c.variantGroups?.map((g, i) => (
              <div key={i} className="mt-2 rounded-lg bg-rose-50 px-2 py-1 text-[11px] text-rose-700">Variants: {g.map((v) => `"${v}"`).join(" · ")}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ManualTools({ rows, columns, profile }: { rows: Row[]; columns: string[]; profile: Profile }) {
  const cat = profile.columns.find((c) => c.kind === "categorical")?.name ?? columns[0];
  const cat2 = profile.columns.filter((c) => c.kind === "categorical")[1]?.name ?? cat;
  const nums = profile.columns.filter((c) => c.kind === "numeric").map((c) => c.name);
  const num = nums[0] ?? columns[1];
  const date = profile.columns.find((c) => c.kind === "date")?.name ?? columns[0];
  const templates: Record<string, Record<string, unknown>> = {
    describe: {},
    aggregate: { groupBy: [cat], metrics: [{ column: num, agg: "sum" }, { column: "*", agg: "count" }], limit: 10 },
    trend: { date, metrics: [{ column: num, agg: "sum" }], period: "month" },
    outliers: { column: num, method: "iqr" },
    correlation: { x: num, y: nums[1] ?? num },
    funnel: { stages: nums.slice(0, 5) },
    variance: { actual: nums.find((n) => /actual/i.test(n)) ?? num, budget: nums.find((n) => /budget/i.test(n)) ?? num, groupBy: [cat] },
    price_change: { entity: cat, price: nums.find((n) => /price/i.test(n)) ?? num, date },
    share: { groupBy: cat, metric: num },
    duplicates: { keys: [cat, num, date] },
    upcoming: { date, days: 90, asOf: "2026-10-26" },
    crosstab: { rows: cat, cols: cat2, metric: num, agg: "sum" },
    filter_rows: { filters: [{ column: num, op: ">", value: profile.columns.find((c) => c.name === num)?.median ?? 0 }], sortBy: num, limit: 10 },
    whatif: { metric: num, changePct: 10, groupBy: cat },
    forecast: { date, metric: num, period: "month", periods: 3 },
  };
  const [op, setOp] = useState("aggregate");
  const [json, setJson] = useState(JSON.stringify(templates.aggregate, null, 2));
  const [result, setResult] = useState<OpResult | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    setJson(JSON.stringify(templates[op] ?? {}, null, 2));
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [op]);

  const run = () => {
    try {
      const params = JSON.parse(json);
      setErr("");
      setResult(runOp(rows, columns, { id: "manual", op, title: `${op} (manual)`, params }));
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <div className="card card-pad">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <Calculator className="h-5 w-5 text-sky-600" /> Formula-driven mode
        </h3>
        <p className="mt-1 text-xs text-slate-600">No AI here — these are the exact deterministic operations the Planner agent chooses from. Use them to <b>recalculate and validate</b> AI answers, or when you have no API key.</p>
        <label className="label mt-4">Operation</label>
        <select className="input" value={op} onChange={(e) => setOp(e.target.value)}>
          {OP_NAMES.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <label className="label mt-3">Parameters (JSON)</label>
        <textarea className="input h-56 font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} />
        {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
        <button className="btn-primary mt-3 w-full" onClick={run}>
          <Bot className="h-4 w-4" /> Run operation
        </button>
        <details className="mt-3 text-[11px] text-slate-500">
          <summary className="cursor-pointer font-semibold">Columns</summary>
          <div className="mt-1 font-mono">{columns.join(" · ")}</div>
        </details>
      </div>
      <div>{result ? <ResultCard r={result} /> : <div className="card card-pad grid h-full min-h-48 place-items-center text-sm text-slate-400">Run an operation to see the result, chart and formula.</div>}</div>
    </div>
  );
}
