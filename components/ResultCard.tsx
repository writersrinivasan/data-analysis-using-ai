"use client";

import { useState } from "react";
import { AlertTriangle, BarChart3, Sigma, Table2 } from "lucide-react";
import type { OpResult } from "@/lib/types";
import { ResultChart } from "./ResultChart";
import { DataTable } from "./DataTable";
import { toCSV } from "@/lib/datasets";
import { CopyButton } from "./ui";

export function ResultCard({ r, index }: { r: OpResult; index?: number }) {
  const hasChart = r.chart.type !== "table" && r.rows.length > 0;
  const [view, setView] = useState<"chart" | "table">(hasChart ? "chart" : "table");
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-violet-50/80 via-white to-sky-50/80 px-4 py-3">
        {index !== undefined && <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-600 text-xs font-bold text-white">{index + 1}</span>}
        <div className="flex-1">
          <div className="font-semibold text-slate-800">{r.title}</div>
          <div className="text-[11px] font-mono text-slate-500">
            {r.op} · {r.rows.length} row{r.rows.length === 1 ? "" : "s"}
          </div>
        </div>
        {hasChart && (
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            <button onClick={() => setView("chart")} className={`rounded-md px-2 py-1 ${view === "chart" ? "bg-white shadow-sm" : ""}`} aria-label="Chart view">
              <BarChart3 className="h-4 w-4 text-violet-600" />
            </button>
            <button onClick={() => setView("table")} className={`rounded-md px-2 py-1 ${view === "table" ? "bg-white shadow-sm" : ""}`} aria-label="Table view">
              <Table2 className="h-4 w-4 text-violet-600" />
            </button>
          </div>
        )}
        <CopyButton text={toCSV(r.columns, r.rows)} label="CSV" />
      </div>
      <div className="p-4">
        {r.error ? (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {r.error}
          </div>
        ) : view === "chart" ? (
          <ResultChart chart={r.chart} rows={r.rows} columns={r.columns} />
        ) : (
          <DataTable columns={r.columns} rows={r.rows} pageSize={10} compact />
        )}
        {(r.note || r.formula) && (
          <div className="mt-3 space-y-1 text-xs">
            {r.note && <div className="rounded-lg bg-amber-50 px-3 py-1.5 font-medium text-amber-800">💡 {r.note}</div>}
            {r.formula && (
              <div className="flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 font-mono text-slate-600">
                <Sigma className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" /> {r.formula}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
