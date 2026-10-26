"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDataset } from "@/lib/datasets";
import { runOp } from "@/lib/engine";
import { toNumber } from "@/lib/profile";
import { ResultChart } from "../ResultChart";
import { fmt } from "../ui";

const cr = (n: number) => `₹${(n / 1e7).toFixed(2)} Cr`;

/* ------------------------------------------------------------ 6.1 Segmentation */
export function Segmentation() {
  const hr = getDataset("hr");
  const segs = useMemo(() => {
    const rows = hr.rows.filter((r) => toNumber(r["Performance Rating"]) !== null);
    const seg = (r: (typeof rows)[number]) => {
      const p = Number(r["Performance Rating"]);
      const t = Number(r["Tenure (Years)"]);
      if (p >= 4 && t < 4) return "Rising stars (high perf, < 4 yrs)";
      if (p >= 4) return "Core high performers";
      if (p <= 2) return "Needs support (rating ≤ 2)";
      if (t < 2) return "New joiners (< 2 yrs)";
      return "Steady contributors";
    };
    const map = new Map<string, { n: number; exited: number; sal: number }>();
    for (const r of rows) {
      const k = seg(r);
      const m = map.get(k) ?? { n: 0, exited: 0, sal: 0 };
      m.n++;
      if (r.Status === "Exited") m.exited++;
      m.sal += toNumber(r["Annual Salary (INR)"]) ?? 0;
      map.set(k, m);
    }
    return Array.from(map.entries()).map(([k, m]) => ({ Segment: k, Employees: m.n, "Attrition %": Math.round((m.exited / m.n) * 1000) / 10, "Avg Salary (L)": Math.round(m.sal / m.n / 1000) / 100 })).sort((a, b) => b["Attrition %"] - a["Attrition %"]);
  }, [hr]);
  return (
    <div className="card card-pad">
      <h3 className="h-section">6.1 Segmentation — employees by performance & tenure</h3>
      <p className="mt-1 text-sm text-slate-600">Rule-based segments on the HR sample. Ask AI to propose segments, then make the rules explicit like this so they&apos;re auditable.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ResultChart chart={{ type: "bar", x: "Segment", y: ["Attrition %"] }} rows={segs} columns={["Segment", "Employees", "Attrition %", "Avg Salary (L)"]} />
        <div className="space-y-2">
          {segs.map((s, i) => (
            <div key={s.Segment} className={clsx("flex items-center justify-between rounded-xl p-3 text-sm", i === 0 ? "bg-rose-50" : "bg-slate-50")}>
              <span className="font-semibold">{s.Segment}</span>
              <span className="text-xs text-slate-600">{s.Employees} people · {s["Attrition %"]}% exited · ₹{s["Avg Salary (L)"]}L avg</span>
            </div>
          ))}
          <p className="text-xs text-slate-500">Other segmentations: customers by value (RFM), vendors by spend (Kraljic), candidates by source.</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ 6.2 What-if */
export function WhatIf() {
  const [exp, setExp] = useState(10);
  const [hire, setHire] = useState(20);
  const [train, setTrain] = useState(15);

  const base = useMemo(() => {
    const fin = getDataset("finance");
    const fy = fin.rows.filter((r) => String(r.Month) >= "2025-10" && r["Line Item"] !== "Revenue");
    const expense = fy.reduce((a, r) => a + (toNumber(r["Actual (INR)"]) ?? 0), 0);
    const rec = getDataset("recruitment");
    const joined = rec.rows.reduce((a, r) => a + (toNumber(r.Joined) ?? 0), 0);
    const cost = rec.rows.reduce((a, r) => a + (toNumber(r["Hiring Cost (INR)"]) ?? 0), 0);
    const ld = getDataset("ld");
    const enrol = ld.rows.length;
    const completed = ld.rows.filter((r) => r.Completion === "Completed").length;
    const avgScore = ld.rows.filter((r) => toNumber(r["Assessment Score"]) !== null && Number(r["Assessment Score"]) <= 100).reduce((a, r, _, arr) => a + Number(r["Assessment Score"]) / arr.length, 0);
    return { expense, joined, cost, enrol, completed, avgScore };
  }, []);

  const completionRate = base.completed / base.enrol;
  const newRate = Math.min(1, completionRate * (1 + train / 100));
  const cards = [
    {
      t: `Expenditure +${exp}%`,
      color: "from-rose-500 to-orange-500",
      lines: [
        ["Base annual expense", cr(base.expense)],
        ["Scenario", cr(base.expense * (1 + exp / 100))],
        ["Extra spend", cr((base.expense * exp) / 100)],
        ["Per month", cr((base.expense * exp) / 100 / 12)],
      ],
      slider: { v: exp, set: setExp, min: -20, max: 30 },
    },
    {
      t: `Hiring +${hire}%`,
      color: "from-violet-500 to-fuchsia-500",
      lines: [
        ["Base joiners / year", fmt(base.joined)],
        ["Scenario joiners", fmt(Math.round(base.joined * (1 + hire / 100)))],
        ["Extra hiring cost", cr((base.cost * hire) / 100)],
        ["Extra onboarding training hrs (×16)", fmt(Math.round(base.joined * (hire / 100) * 16))],
      ],
      slider: { v: hire, set: setHire, min: -30, max: 50 },
    },
    {
      t: `Training completion +${train}%`,
      color: "from-emerald-500 to-teal-500",
      lines: [
        ["Base completion rate", `${(completionRate * 100).toFixed(1)}%`],
        ["Scenario rate", `${(newRate * 100).toFixed(1)}%`],
        ["Extra completions", fmt(Math.round(base.enrol * (newRate - completionRate)))],
        ["Avg assessment score (unchanged?)", base.avgScore.toFixed(1)],
      ],
      slider: { v: train, set: setTrain, min: 0, max: 40 },
    },
  ];
  return (
    <div className="card card-pad">
      <h3 className="h-section">6.2 What-if analysis</h3>
      <p className="mt-1 text-sm text-slate-600">Move the sliders. Numbers come from the sample Finance, Recruitment and L&amp;D datasets. Note the assumptions: linear scaling, nothing else changes.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.t} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className={`bg-gradient-to-r ${c.color} p-3 text-white`}>
              <div className="font-display text-lg font-bold">{c.t}</div>
              <input type="range" min={c.slider.min} max={c.slider.max} value={c.slider.v} onChange={(e) => c.slider.set(Number(e.target.value))} className="mt-2 w-full accent-white" />
            </div>
            <dl className="divide-y divide-slate-100 text-sm">
              {c.lines.map(([k, v]) => (
                <div key={k} className="flex justify-between px-3 py-2">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">💬 Ask AI: &ldquo;What second-order effects am I missing if hiring increases by 20%?&rdquo; (manager span, onboarding capacity, seat cost, attrition of new joiners…)</p>
    </div>
  );
}

/* ------------------------------------------------------------ 6.3 Scenario */
export function Scenario() {
  const [growth, setGrowth] = useState({ base: 6, opt: 12, cons: -2 });
  const [cost, setCost] = useState({ base: 4, opt: 2, cons: 8 });
  const baseRev = useMemo(() => {
    const ir = getDataset("ir");
    const last4 = ["FY26 Q3", "FY26 Q4", "FY27 Q1", "FY27 Q2"];
    const rev = ir.rows.filter((r) => last4.includes(String(r.Quarter))).reduce((a, r) => a + Number(r["Revenue (INR Cr)"]), 0);
    const ebitda = ir.rows.filter((r) => last4.includes(String(r.Quarter))).reduce((a, r) => a + Number(r["EBITDA (INR Cr)"]), 0);
    return { rev, cost: rev - ebitda };
  }, []);
  const mk = (g: number, c: number) => {
    const rev = baseRev.rev * (1 + g / 100);
    const costs = baseRev.cost * (1 + c / 100);
    return { Revenue: Math.round(rev), Costs: Math.round(costs), EBITDA: Math.round(rev - costs) };
  };
  const data = [
    { Case: "Last 4 quarters", Revenue: Math.round(baseRev.rev), Costs: Math.round(baseRev.cost), EBITDA: Math.round(baseRev.rev - baseRev.cost) },
    { Case: "Conservative", ...mk(growth.cons, cost.cons) },
    { Case: "Base", ...mk(growth.base, cost.base) },
    { Case: "Optimistic", ...mk(growth.opt, cost.opt) },
  ];
  const Slider = ({ label, v, on }: { label: string; v: number; on: (n: number) => void }) => (
    <label className="block text-xs">
      <span className="flex justify-between font-semibold text-slate-600">
        {label} <span>{v > 0 ? "+" : ""}{v}%</span>
      </span>
      <input type="range" min={-15} max={25} value={v} onChange={(e) => on(Number(e.target.value))} className="w-full accent-violet-600" />
    </label>
  );
  return (
    <div className="card card-pad">
      <h3 className="h-section">6.3 Scenario analysis — Base → Optimistic → Conservative</h3>
      <p className="mt-1 text-sm text-slate-600">Next-year revenue and EBITDA (₹ Cr) from the IR sample. Write the assumptions down — that is what leadership debates.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
          {(["cons", "base", "opt"] as const).map((k) => (
            <div key={k} className="space-y-2">
              <div className="text-sm font-bold">{k === "cons" ? "🐢 Conservative" : k === "base" ? "⚖️ Base" : "🚀 Optimistic"}</div>
              <Slider label="Revenue growth" v={growth[k]} on={(n) => setGrowth({ ...growth, [k]: n })} />
              <Slider label="Cost growth" v={cost[k]} on={(n) => setCost({ ...cost, [k]: n })} />
            </div>
          ))}
        </div>
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="Case" fontSize={12} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v) => `₹${fmt(v)} Cr`} />
              <Legend />
              <Bar dataKey="Revenue" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Costs" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="EBITDA" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            {data.slice(1).map((d) => (
              <div key={d.Case} className="rounded-xl bg-slate-50 p-2">
                <div className="font-bold">{d.Case}</div>
                <div>EBITDA margin {((d.EBITDA / d.Revenue) * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ 6.4 Forecast */
export function Forecast() {
  const options = [
    { k: "Revenue (Finance)", ds: "finance" as const, params: { date: "Month", metric: "Actual (INR)", filters: [{ column: "Line Item", op: "=", value: "Revenue" }], periods: 6 } },
    { k: "Expenses (Finance)", ds: "finance" as const, params: { date: "Month", metric: "Actual (INR)", filters: [{ column: "Line Item", op: "!=", value: "Revenue" }], periods: 6 } },
    { k: "Hiring — joiners", ds: "recruitment" as const, params: { date: "Month", metric: "Joined", periods: 3 } },
    { k: "Training demand — hours", ds: "capstone" as const, params: { date: "Month", metric: "Training Hours", periods: 3 } },
    { k: "Procurement demand — spend", ds: "procurement" as const, params: { date: "Date", metric: "Total Amount (INR)", periods: 3 } },
  ];
  const [i, setI] = useState(0);
  const res = useMemo(() => {
    const o = options[i];
    const d = getDataset(o.ds);
    return runOp(d.rows, d.columns, { id: "f", op: "forecast", title: o.k, params: o.params });
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="card card-pad">
      <h3 className="h-section">6.4 Forecasting with AI</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o, k) => (
          <button key={o.k} onClick={() => setI(k)} className={clsx("rounded-full px-3 py-1 text-xs font-semibold", k === i ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600")}>
            {o.k}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <ResultChart chart={res.chart} rows={res.rows} columns={res.columns} height={300} />
      </div>
      <p className="mt-2 font-mono text-[11px] text-slate-500">{res.formula}</p>
      <p className="mt-1 text-xs text-slate-600">⚠️ {res.note} Seasonality (e.g. March revenue spikes), one-offs and business changes are not modelled — ask AI to list what could break this forecast.</p>
    </div>
  );
}
