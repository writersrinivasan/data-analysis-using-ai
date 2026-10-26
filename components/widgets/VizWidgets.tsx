"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { AlertTriangle, BarChart3, FlaskConical, Play } from "lucide-react";
import { FUNCTIONS } from "@/lib/content";
import { getDataset } from "@/lib/datasets";
import { runOp } from "@/lib/engine";
import type { ChartType, FunctionId, OpSpec } from "@/lib/types";
import { ResultChart } from "../ResultChart";
import { DataTable } from "../DataTable";
import { ResultCard } from "../ResultCard";
import { CopyButton } from "../ui";

/* Preset engine operations that illustrate each function's headline analysis (no AI needed). */
const FUNCTION_DEMO: Record<string, OpSpec> = {
  ld: { id: "d", op: "aggregate", title: "Participation vs score by course", params: { groupBy: ["Course"], metrics: [{ column: "*", agg: "count", as: "Enrolments" }, { column: "Assessment Score", agg: "avg", as: "Avg Score" }, { column: "Completion", agg: "pct_where", equals: "Completed", as: "Completion %" }] }, chart: { type: "bar" } },
  hr: { id: "d", op: "aggregate", title: "Attrition rate by department", params: { groupBy: ["Department"], metrics: [{ column: "*", agg: "count", as: "Headcount" }, { column: "Status", agg: "pct_where", equals: "Exited", as: "Attrition %" }], sortBy: "Attrition %" }, chart: { type: "bar" } },
  recruitment: { id: "d", op: "funnel", title: "Recruitment funnel", params: { stages: ["Applications", "Screened", "Interviewed", "Offers", "Joined"] } },
  procurement: { id: "d", op: "price_change", title: "Vendor price change (before vs after Apr 2026)", params: { entity: "Vendor", price: "Unit Price (INR)", date: "Date", item: "Item", splitDate: "2026-04-01" } },
  finance: { id: "d", op: "variance", title: "Budget vs actual by department (FY27 Q2)", params: { actual: "Actual (INR)", budget: "Budget (INR)", groupBy: ["Department"], filters: [{ column: "Month", op: "in", value: ["2026-07", "2026-08", "2026-09"] }, { column: "Line Item", op: "!=", value: "Revenue" }] } },
  admin: { id: "d", op: "trend", title: "Monthly admin spend by expense type", params: { date: "Month", metrics: [{ column: "Amount (INR)", agg: "sum" }], groupBy: "Expense Type" } },
  ir: { id: "d", op: "trend", title: "Revenue by segment per quarter", params: { date: "Quarter", metrics: [{ column: "Revenue (INR Cr)", agg: "sum" }], groupBy: "Segment" } },
  legal: { id: "d", op: "upcoming", title: "Contracts renewing in the next 60 days", params: { date: "Renewal Date", days: 60, asOf: "2026-10-26", show: ["Contract ID", "Counterparty", "Contract Type", "Contract Value (INR)", "Risk Category", "Auto Renew"] } },
};

export function FunctionTabs() {
  const [id, setId] = useState<FunctionId>("ld");
  const f = FUNCTIONS.find((x) => x.id === id)!;
  const demo = useMemo(() => {
    const ds = getDataset(id);
    return runOp(ds.rows, ds.columns, FUNCTION_DEMO[id]);
  }, [id]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FUNCTIONS.map((x) => (
          <button key={x.id} onClick={() => setId(x.id)} className={clsx("rounded-2xl px-4 py-2 text-sm font-bold transition", x.id === id ? `bg-gradient-to-r ${x.color} text-white shadow-lg` : "bg-white text-slate-600 shadow-sm hover:bg-slate-50")}>
            {x.emoji} {x.name}
          </button>
        ))}
      </div>
      <div className="card animate-pop overflow-hidden" key={id}>
        <div className={`bg-gradient-to-r ${f.color} p-5 text-white`}>
          <div className="text-xs font-bold uppercase tracking-widest text-white/80">4.{FUNCTIONS.indexOf(f) + 1} · {f.persona}</div>
          <h3 className="mt-1 font-display text-2xl font-bold">
            {f.emoji} {f.name}
          </h3>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-3">
          <div>
            <div className="label">Dataset</div>
            <div className="flex flex-wrap gap-1.5">
              {f.dataset.map((d) => (
                <span key={d} className="chip bg-sky-50 text-sky-700">{d}</span>
              ))}
            </div>
            <div className="label mt-4">AI analysis</div>
            <ul className="space-y-1 text-sm text-slate-700">
              {f.analyses.map((a) => (
                <li key={a} className="flex gap-2"><span className="text-violet-500">▸</span>{a}</li>
              ))}
            </ul>
            <div className="label mt-4">Best charts</div>
            <p className="text-sm text-slate-600">{f.chart}</p>
          </div>
          <div className="space-y-3 lg:col-span-2">
            <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-violet-600">Example prompt</div>
                <CopyButton text={f.prompt} />
              </div>
              <p className="mt-1 text-sm font-medium italic text-slate-800">&ldquo;{f.prompt}&rdquo;</p>
              <Link href={`/sandbox?dataset=${f.id}&tab=agent&q=${encodeURIComponent(f.prompt)}&run=1`} className="btn-primary mt-3">
                <Play className="h-4 w-4" /> Run with AI agents
              </Link>
            </div>
            {f.caution && (
              <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" /> <span><b>Important:</b> {f.caution}</span>
              </div>
            )}
            <div>
              <div className="mb-2 text-xs font-bold uppercase text-slate-500">Instant preview on the sample data (computed, no AI)</div>
              <ResultCard r={demo} />
            </div>
          </div>
        </div>
        <div className="grid gap-4 border-t border-slate-100 bg-slate-50/50 p-5 md:grid-cols-2">
          <div>
            <div className="text-sm font-bold text-rose-700">😩 Before AI — {f.before.time}</div>
            <ol className="mt-1 list-decimal pl-5 text-sm text-slate-600">{f.before.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-700">🦸 With AI — {f.after.time}</div>
            <ol className="mt-1 list-decimal pl-5 text-sm text-slate-600">{f.after.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ 5.1 / 5.2 Chart chooser */
const CHOOSER: { q: string; chart: string; type: ChartType; why: string; ds: FunctionId; op: OpSpec }[] = [
  { q: "Trend over time", chart: "Line chart", type: "line", why: "Shows direction and continuity; easy to spot turning points.", ds: "finance", op: { id: "c", op: "trend", title: "Monthly actual spend", params: { date: "Month", metrics: [{ column: "Actual (INR)", agg: "sum" }], filters: [{ column: "Line Item", op: "!=", value: "Revenue" }] } } },
  { q: "Compare departments", chart: "Bar chart", type: "bar", why: "Lengths are easy to compare; sort largest to smallest.", ds: "hr", op: { id: "c", op: "aggregate", title: "Average leave days by department", params: { groupBy: ["Department"], metrics: [{ column: "Leave Days (YTD)", agg: "avg" }] } } },
  { q: "Recruitment funnel", chart: "Funnel", type: "funnel", why: "Sequential stages with drop-off between each.", ds: "recruitment", op: { id: "c", op: "funnel", title: "Funnel", params: { stages: ["Applications", "Screened", "Interviewed", "Offers", "Joined"] } } },
  { q: "Budget vs actual", chart: "Column / Bar (clustered)", type: "bar", why: "Side-by-side bars make the gap visible per department.", ds: "finance", op: { id: "c", op: "variance", title: "Budget vs actual", params: { actual: "Actual (INR)", budget: "Budget (INR)", groupBy: ["Department"], filters: [{ column: "Line Item", op: "!=", value: "Revenue" }] } } },
  { q: "Contribution", chart: "Stacked bar / donut", type: "pie", why: "Part-to-whole. Donut only when ≤ 6 parts.", ds: "procurement", op: { id: "c", op: "share", title: "Spend share by category", params: { groupBy: "Category", metric: "Total Amount (INR)" } } },
  { q: "Relationship between variables", chart: "Scatter plot", type: "scatter", why: "Each dot is a record; look for slope and clusters.", ds: "hr", op: { id: "c", op: "correlation", title: "Tenure vs salary", params: { x: "Tenure (Years)", y: "Annual Salary (INR)" } } },
  { q: "Risk concentration", chart: "Heat map", type: "heatmap", why: "Colour intensity across two dimensions shows hot spots.", ds: "legal", op: { id: "c", op: "crosstab", title: "Contract value: type × risk", params: { rows: "Contract Type", cols: "Risk Category", metric: "Contract Value (INR)", agg: "sum" } } },
];

export function ChartChooser() {
  const [i, setI] = useState(0);
  const c = CHOOSER[i];
  const res = useMemo(() => {
    const ds = getDataset(c.ds);
    return runOp(ds.rows, ds.columns, c.op);
  }, [c]);
  return (
    <div className="card card-pad">
      <h3 className="h-section">5.1–5.2 Choosing the right chart</h3>
      <p className="mt-1 text-sm text-slate-600">Pick a business question — see the recommended chart rendered on real sample data.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-1">
          {CHOOSER.map((x, k) => (
            <button key={x.q} onClick={() => setI(k)} className={clsx("flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition", k === i ? "bg-emerald-600 text-white" : "hover:bg-slate-50")}>
              <span className="font-semibold">{x.q}</span>
              <span className={clsx("text-xs", k === i ? "text-white/80" : "text-slate-400")}>{x.chart}</span>
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4" key={i}>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            <div className="font-display text-lg font-bold">{c.chart}</div>
          </div>
          <p className="text-sm text-slate-600">{c.why}</p>
          <div className="mt-3">
            {res.chart.type === "table" ? <DataTable columns={res.columns} rows={res.rows} compact /> : <ResultChart chart={{ ...res.chart, type: c.type === "bar" && res.chart.type === "stacked" ? "bar" : res.chart.type }} rows={res.rows} columns={res.columns} />}
          </div>
          {res.note && <p className="mt-2 text-xs text-slate-500">💡 {res.note}</p>}
        </div>
      </div>
    </div>
  );
}

export function ChartGallery() {
  const items: { ds: FunctionId; op: OpSpec; tip: string }[] = [
    { ds: "procurement", op: { id: "g1", op: "share", title: "Vendor concentration (Pareto)", params: { groupBy: "Vendor", metric: "Total Amount (INR)" } }, tip: "Insight title: 'Top 2 vendors = most of our spend — concentration risk'" },
    { ds: "admin", op: { id: "g2", op: "crosstab", title: "Admin spend heat map: location × type", params: { rows: "Location", cols: "Expense Type", metric: "Amount (INR)", agg: "sum" } }, tip: "Insight title: 'Chennai HQ utilities dominate admin cost'" },
  ];
  const results = useMemo(() => items.map((it) => { const d = getDataset(it.ds); return { ...runOp(d.rows, d.columns, it.op), tip: it.tip }; }), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {results.map((r) => (
        <div key={r.id}>
          <ResultCard r={r} />
          <p className="mt-2 px-1 text-xs text-slate-600">✍️ {r.tip}</p>
        </div>
      ))}
      <div className="lg:col-span-2">
        <Link href="/sandbox?dataset=finance&tab=agent" className="btn-soft">
          <FlaskConical className="h-4 w-4" /> Generate your own charts + summary in the Sandbox
        </Link>
      </div>
    </div>
  );
}
