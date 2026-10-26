"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, CheckCircle2, FlaskConical, Wand2 } from "lucide-react";
import { getDataset, DATASET_LIST } from "@/lib/datasets";
import { profileRows, quantile } from "@/lib/profile";
import { CLEAN_STEPS } from "@/lib/cleaning";
import type { FunctionId, Row } from "@/lib/types";
import { CopyButton, fmt } from "../ui";
import { askDatum } from "../AssistantWidget";

/* ------------------------------------------------------------ 2.1 Dataset anatomy */
export function DatasetAnatomy() {
  const ds = getDataset("hr");
  const profile = useMemo(() => profileRows(ds.rows.slice(0, 120), ds.columns), [ds]);
  const [hover, setHover] = useState<string | null>(null);
  const kindOf = (c: string) => profile.columns.find((p) => p.name === c)?.kind ?? "text";
  const role = (c: string) => {
    const k = kindOf(c);
    if (k === "numeric") return { tag: "Measure", cls: "bg-sky-100 text-sky-700 border-sky-300" };
    if (k === "id") return { tag: "Identifier", cls: "bg-amber-100 text-amber-700 border-amber-300" };
    if (k === "date") return { tag: "Time", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" };
    if (profile.columns.find((p) => p.name === c)?.piiRisk) return { tag: "PII", cls: "bg-rose-100 text-rose-700 border-rose-300" };
    return { tag: "Dimension", cls: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300" };
  };
  const rows = ds.rows.slice(0, 6);
  return (
    <div className="card card-pad">
      <h3 className="h-section">Anatomy of a business dataset</h3>
      <p className="mt-1 text-sm text-slate-600">HR employee master — hover a column to see how AI (and you) should treat it.</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {["Dimension", "Measure", "Time", "Identifier", "PII"].map((t) => (
          <span key={t} className={clsx("chip border", t === "Dimension" ? "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-700" : t === "Measure" ? "border-sky-300 bg-sky-100 text-sky-700" : t === "Time" ? "border-emerald-300 bg-emerald-100 text-emerald-700" : t === "Identifier" ? "border-amber-300 bg-amber-100 text-amber-700" : "border-rose-300 bg-rose-100 text-rose-700")}>
            {t}
          </span>
        ))}
      </div>
      <div className="scrollbar-thin mt-3 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {ds.columns.map((c) => {
                const r = role(c);
                return (
                  <th key={c} onMouseEnter={() => setHover(c)} onMouseLeave={() => setHover(null)} className={clsx("cursor-help whitespace-nowrap border-b-2 px-3 py-2 text-left", r.cls)}>
                    {c}
                    <div className="text-[10px] font-medium opacity-80">{r.tag}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                {ds.columns.map((c) => (
                  <td key={c} className={clsx("whitespace-nowrap px-3 py-1.5", hover === c && "bg-violet-50 font-semibold", r[c] === null && "bg-amber-50 text-amber-500")}>
                    {fmt(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 min-h-[44px] rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
        {hover ? (
          (() => {
            const p = profile.columns.find((x) => x.name === hover)!;
            const r = role(hover);
            const tips: Record<string, string> = {
              Measure: `Sum/average it. Range ${fmt(p.min)} → ${fmt(p.max)}, median ${fmt(p.median)}.`,
              Dimension: `Group or filter by it. ${p.unique} distinct values${p.variantGroups ? ` — watch the variants: ${p.variantGroups.map((g) => g.join(" / ")).join("; ")}` : ""}.`,
              Time: "Use it for trends (MoM, QoQ, YoY). Check the format and coverage.",
              Identifier: "Count it, never sum it. Useful for duplicates and joins.",
              PII: "Personal data — mask or drop before using any external AI tool.",
            };
            return (
              <>
                <b>{hover}</b> is a <b>{r.tag}</b>. {tips[r.tag]} {p.missing ? `${p.missing} missing value(s).` : ""}
              </>
            );
          })()
        ) : (
          <span className="text-slate-400">Hover a column header…</span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ 2.2 Cleaning demo */
export function CleaningDemo() {
  const [id, setId] = useState<FunctionId>("procurement");
  const ds = getDataset(id);
  const [applied, setApplied] = useState<number[]>([]);
  const result = useMemo(() => {
    let rows: Row[] = ds.rows;
    let cols = ds.columns;
    const logs = [];
    for (const i of applied) {
      const r = CLEAN_STEPS[i].fn(rows, cols);
      rows = r.rows;
      cols = r.columns;
      logs.push(r.log);
    }
    return { rows, cols, logs };
  }, [ds, applied]);
  const before = useMemo(() => profileRows(ds.rows, ds.columns), [ds]);
  const after = useMemo(() => profileRows(result.rows, result.cols), [result]);
  const variants = (p: typeof before) => p.columns.reduce((a, c) => a + (c.variantGroups?.length ?? 0), 0);
  return (
    <div className="card card-pad">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="h-section">Live cleaning demo</h3>
        <select className="input w-auto" value={id} onChange={(e) => { setId(e.target.value as FunctionId); setApplied([]); }}>
          {DATASET_LIST.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {CLEAN_STEPS.map((s, i) => (
          <button key={s.id} onClick={() => setApplied((a) => (a.includes(i) ? a.filter((x) => x !== i) : [...a, i].sort()))} className={clsx("rounded-full border px-3 py-1 text-xs font-semibold transition", applied.includes(i) ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
            {applied.includes(i) && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Rows", b: before.rowCount, a: after.rowCount },
          { l: "Duplicate rows", b: before.duplicateRows, a: after.duplicateRows },
          { l: "Spelling-variant groups", b: variants(before), a: variants(after) },
          { l: "Mixed-date columns", b: before.columns.filter((c) => c.mixedDateFormats).length, a: after.columns.filter((c) => c.mixedDateFormats).length },
        ].map((m) => (
          <div key={m.l} className="rounded-2xl bg-slate-50 p-3">
            <div className="text-[11px] font-semibold uppercase text-slate-500">{m.l}</div>
            <div className="mt-1 flex items-baseline gap-2 font-display text-xl font-bold">
              <span className="text-slate-400 line-through decoration-rose-400">{m.b}</span>
              <ArrowRight className="h-4 w-4 text-slate-300" />
              <span className={m.a < m.b ? "text-emerald-600" : "text-slate-800"}>{m.a}</span>
            </div>
          </div>
        ))}
      </div>
      {result.logs.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-slate-600">
          {result.logs.map((l, i) => (
            <li key={i}>
              <b className="text-slate-800">{l.step}:</b> {l.details.join(" · ")}
            </li>
          ))}
        </ul>
      )}
      <Link href={`/sandbox?dataset=${id}&tab=clean`} className="btn-soft mt-4">
        <FlaskConical className="h-4 w-4" /> Open in Sandbox with AI standardize
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------ 2.4 Prompt builder */
const PB_PRESETS = [
  {
    name: "Recruitment (TOC example)",
    context: "You are analyzing our recruitment data for FY27 H1.",
    dataset: "recruitment_funnel.csv — monthly rows by job role & source: Applications, Screened, Interviewed, Offers, Joined, time-to-hire, hiring cost.",
    objective: "Identify the top sources of candidates and where we lose them.",
    analysis: "Calculate conversion rates at each recruitment stage by source and role, identify bottlenecks, and compute cost per hire.",
    output: "Present the findings as a management summary: 3-line summary, a table of conversion by stage, top 3 bottlenecks, recommended actions.",
    constraints: "Use only the data provided; show formulas; flag assumptions; do not include candidate names.",
  },
  {
    name: "Finance variance",
    context: "You are an FP&A analyst preparing month-end commentary for the CFO.",
    dataset: "finance_budget_actuals.csv — Month, Department, Cost Center, Line Item, Budget, Actual (24 months).",
    objective: "Explain the largest budget variances this quarter.",
    analysis: "Compute Actual − Budget and variance % by department and line item for Jul–Sep 2026; rank by absolute variance; compare with the same quarter last year.",
    output: "Top 5 variances table + 5 bullet commentary + questions for department heads.",
    constraints: "Do not speculate on causes without labelling them hypotheses. Round to ₹ lakh.",
  },
  {
    name: "Procurement price check",
    context: "You support the procurement head before vendor negotiations.",
    dataset: "procurement_purchase_orders.csv — PO, date, vendor, category, item, qty, unit price, total, payment status.",
    objective: "Find vendors whose prices increased significantly.",
    analysis: "Standardise vendor names, compare average unit price per vendor-item before vs after April 2026, flag increases > 5%, and check for duplicate POs.",
    output: "Table of vendor, item, before, after, % change; short negotiation brief.",
    constraints: "Use exact numbers from the data; list any data-quality issues found.",
  },
];

const PB_FIELDS = [
  { k: "context", label: "Context", hint: "Who are you / what situation?", color: "border-fuchsia-300 bg-fuchsia-50" },
  { k: "dataset", label: "Dataset", hint: "What file, what columns, what period?", color: "border-sky-300 bg-sky-50" },
  { k: "objective", label: "Objective", hint: "What decision or question?", color: "border-violet-300 bg-violet-50" },
  { k: "analysis", label: "Analysis", hint: "Which calculations / comparisons?", color: "border-emerald-300 bg-emerald-50" },
  { k: "output", label: "Output format", hint: "Table, bullets, summary, chart?", color: "border-amber-300 bg-amber-50" },
  { k: "constraints", label: "Constraints", hint: "Privacy, rounding, no speculation…", color: "border-rose-300 bg-rose-50" },
] as const;

type PBKey = (typeof PB_FIELDS)[number]["k"];

export function PromptBuilder() {
  const [v, setV] = useState<Record<PBKey, string>>({ ...PB_PRESETS[0] });
  const prompt = PB_FIELDS.map((f) => v[f.k].trim()).filter(Boolean).join("\n\n");
  const filled = PB_FIELDS.filter((f) => v[f.k].trim()).length;
  return (
    <div className="card card-pad">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="h-section">2.4 Prompt structure builder</h3>
          <p className="text-sm text-slate-600">Context + Dataset + Objective + Analysis + Output Format + Constraints</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {PB_PRESETS.map((p) => (
            <button key={p.name} className="btn-ghost px-2 py-1 text-xs" onClick={() => setV({ ...p })}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {PB_FIELDS.map((f) => (
            <div key={f.k} className={clsx("rounded-xl border-l-4 p-2", f.color)}>
              <div className="flex justify-between text-xs font-bold text-slate-700">
                {f.label} <span className="font-normal text-slate-400">{f.hint}</span>
              </div>
              <textarea className="mt-1 w-full resize-y rounded-lg bg-white/80 p-2 text-sm outline-none" rows={2} value={v[f.k]} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} />
            </div>
          ))}
        </div>
        <div className="flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Your prompt</div>
            <div className="flex items-center gap-2">
              <span className={clsx("chip", filled === 6 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{filled}/6 parts</span>
              <CopyButton text={prompt} />
            </div>
          </div>
          <pre className="flex-1 whitespace-pre-wrap rounded-2xl bg-slate-900 p-4 text-sm leading-relaxed text-slate-100">{prompt}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => askDatum(`Critique and improve this data-analysis prompt. Score each of the 6 parts (context, dataset, objective, analysis, output, constraints) out of 5 and give an improved version:\n\n${prompt}`)}>
              <Wand2 className="h-4 w-4" /> Ask AI to critique it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ 3.2 Stats playground */
export function StatsPlayground() {
  const [vals, setVals] = useState("4500, 2500, 600, 6000, 9000, 4500, 1800, 11000, 2500, 4500");
  const [outlier, setOutlier] = useState(false);
  const nums = useMemo(() => {
    const base = vals.split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n));
    return outlier ? [...base, 98000] : base;
  }, [vals, outlier]);
  const sorted = nums.slice().sort((a, b) => a - b);
  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = sum / (nums.length || 1);
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, nums.length - 1);
  const stats = [
    { l: "Count", v: nums.length, xl: "=COUNT(A:A)" },
    { l: "Sum", v: sum, xl: "=SUM(A:A)" },
    { l: "Average", v: mean, xl: "=AVERAGE(A:A)" },
    { l: "Median", v: quantile(sorted, 0.5), xl: "=MEDIAN(A:A)" },
    { l: "Min", v: sorted[0], xl: "=MIN(A:A)" },
    { l: "Max", v: sorted[sorted.length - 1], xl: "=MAX(A:A)" },
    { l: "Std Dev", v: Math.sqrt(variance), xl: "=STDEV.S(A:A)" },
    { l: "Variance", v: variance, xl: "=VAR.S(A:A)" },
  ];
  const max = sorted[sorted.length - 1] || 1;
  return (
    <div className="card card-pad">
      <h3 className="h-section">3.2 Descriptive statistics playground</h3>
      <p className="mt-1 text-sm text-slate-600">Training costs per course (₹). Add the &ldquo;extra zero&rdquo; typo and watch which statistics move.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input className="input font-mono" value={vals} onChange={(e) => setVals(e.target.value)} />
        <label className={clsx("btn whitespace-nowrap", outlier ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700")}>
          <input type="checkbox" className="hidden" checked={outlier} onChange={(e) => setOutlier(e.target.checked)} />
          {outlier ? "Remove" : "Add"} ₹98,000 typo
        </label>
      </div>
      <div className="mt-3 flex h-20 items-end gap-1 rounded-xl bg-slate-50 p-2">
        {nums.map((n, i) => (
          <div key={i} className={clsx("flex-1 rounded-t", n === 98000 && outlier ? "bg-rose-500" : "bg-violet-400")} style={{ height: `${Math.max(3, (n / max) * 100)}%` }} title={fmt(n)} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className={clsx("rounded-xl p-3", outlier && ["Average", "Max", "Std Dev", "Variance", "Sum"].includes(s.l) ? "bg-rose-50" : "bg-slate-50")}>
            <div className="text-[11px] font-semibold uppercase text-slate-500">{s.l}</div>
            <div className="font-display text-lg font-bold">{fmt(Math.round(s.v * 100) / 100)}</div>
            <div className="font-mono text-[10px] text-slate-400">{s.xl}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-600">
        👉 One typo moves the <b>average</b> by {outlier ? `₹${fmt(Math.round(mean - (sum - 98000) / (nums.length - 1)))}` : "a lot"} while the <b>median</b> barely changes. Growth rate formula: <span className="font-mono">(this − previous) ÷ previous × 100</span>.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ Exercises */
export function ExerciseCard({ n, title, steps, deliverables, minutes, href }: { n: number; title: string; steps: string[]; deliverables: string[]; minutes: number; href: string }) {
  const [done, setDone] = useState<boolean[]>(deliverables.map(() => false));
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
          Hands-on exercise {n} · {minutes} min
        </div>
        <h3 className="mt-1 font-display text-2xl font-bold">&ldquo;{title}&rdquo;</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-white/90">How</div>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-white/90">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
          <div>
            <div className="text-sm font-semibold text-white/90">Deliverables (tick as you go)</div>
            <div className="mt-1 space-y-1">
              {deliverables.map((d, i) => (
                <label key={d} className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15">
                  <input type="checkbox" className="h-4 w-4 accent-emerald-400" checked={done[i]} onChange={() => setDone(done.map((x, j) => (j === i ? !x : x)))} />
                  <span className={done[i] ? "line-through opacity-70" : ""}>{d}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <Link href={href} className="btn mt-5 bg-white text-violet-700 hover:bg-violet-50">
          <FlaskConical className="h-4 w-4" /> Start in the Sandbox
        </Link>
      </div>
    </div>
  );
}

export const Exercise1 = () => (
  <ExerciseCard
    n={1}
    minutes={8}
    title="Ask Questions to Your Dataset"
    href="/sandbox?dataset=capstone&tab=agent&q=Give%20me%20five%20key%20observations%2C%20three%20trends%2C%20three%20anomalies%20and%20five%20questions%20management%20should%20ask%20of%20this%20dataset."
    steps={["Pick a sample dataset in the Sandbox (or your function's)", "Run the 'Understand' tab first", "Ask the AI agents for observations, trends, anomalies and questions", "Compare with the trainer answer key"]}
    deliverables={["Five key observations", "Three trends", "Three anomalies", "Five management questions"]}
  />
);

export const Exercise2 = () => (
  <ExerciseCard
    n={2}
    minutes={8}
    title="From Spreadsheet to Management Report"
    href="/sandbox?dataset=finance&tab=agent&q=Compare%20budget%20versus%20actual%20expenditure%20by%20department%20and%20highlight%20the%20five%20largest%20variances."
    steps={["Load a dataset and clean it (Run all 7 steps)", "Ask a business question in the Agents tab", "Review charts — switch to table view to check numbers", "Open 'Management report', edit, and download .md"]}
    deliverables={["Analysis", "Charts", "Insights", "Executive Summary"]}
  />
);
