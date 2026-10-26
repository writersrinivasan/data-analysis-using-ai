"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowRight, Clock, Zap } from "lucide-react";
import { WORKFLOW, FUNCTIONS } from "@/lib/content";
import { Icon } from "../Icon";

const WORKFLOW_DETAIL: Record<string, { human: string; ai: string; prompt: string }> = {
  Data: { human: "Pick the right extract & period; know what one row means.", ai: "Can list which columns are needed for your question.", prompt: "Which columns and period do I need to analyse vendor price increases?" },
  Clean: { human: "Approve merges and fixes; decide what to do with blanks.", ai: "Finds variants, duplicates, mixed dates, impossible values.", prompt: "List data-quality issues in this file and propose fixes. Don't change anything yet." },
  Understand: { human: "Confirm AI's reading of columns and grain.", ai: "Describes the dataset, dimensions, measures and ranges.", prompt: "Describe this dataset: grain, period, dimensions, measures." },
  Ask: { human: "Frame the business question precisely.", ai: "Suggests sharper follow-up questions.", prompt: "Suggest 5 questions management should ask of this data." },
  Analyze: { human: "Choose the right comparison and normalisation.", ai: "Aggregates, compares, trends, segments — in seconds.", prompt: "Top 10 vendors by spend with share and cumulative share." },
  Visualize: { human: "Check the chart answers the question.", ai: "Recommends and builds the chart.", prompt: "What is the best chart for this, and what should its title say?" },
  Interpret: { human: "Add business context the data can't know.", ai: "Drafts observations, trends and anomalies.", prompt: "What are the 5 key observations and 3 anomalies?" },
  Validate: { human: "Recalculate key numbers; check assumptions.", ai: "Shows formulas; can argue against itself.", prompt: "Show the formula and filters for every number you used." },
  Report: { human: "Own the message and the decision.", ai: "Drafts the executive summary and action items.", prompt: "Write a 1-page management summary with actions and owners." },
};

export function WorkflowStepper() {
  const [i, setI] = useState(0);
  const step = WORKFLOW[i];
  const d = WORKFLOW_DETAIL[step.step];
  return (
    <div className="card card-pad">
      <h3 className="h-section">1.3 The AI Data Analysis Workflow</h3>
      <p className="mt-1 text-sm text-slate-600">Click each step. Notice the split: AI does the heavy lifting; the human owns the judgment.</p>
      <div className="scrollbar-thin mt-4 flex items-center gap-1 overflow-x-auto pb-2">
        {WORKFLOW.map((w, k) => (
          <div key={w.step} className="flex items-center">
            <button
              onClick={() => setI(k)}
              className={clsx(
                "flex min-w-[92px] flex-col items-center gap-1 rounded-2xl px-3 py-3 text-xs font-bold transition",
                k === i ? "bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-violet-500/30" : k < i ? "bg-violet-50 text-violet-700" : "bg-slate-50 text-slate-500 hover:bg-slate-100",
              )}
            >
              <Icon name={w.icon} className="h-5 w-5" />
              {w.step}
            </button>
            {k < WORKFLOW.length - 1 && <ArrowRight className="mx-0.5 h-4 w-4 shrink-0 text-slate-300" />}
          </div>
        ))}
      </div>
      <div className="mt-4 grid animate-pop gap-3 md:grid-cols-3" key={i}>
        <div className="rounded-2xl bg-violet-50 p-4">
          <div className="text-xs font-bold uppercase text-violet-600">Step {i + 1}: {step.step}</div>
          <p className="mt-1 text-sm text-slate-700">{step.d}</p>
        </div>
        <div className="rounded-2xl bg-sky-50 p-4">
          <div className="text-xs font-bold uppercase text-sky-600">🤖 AI does</div>
          <p className="mt-1 text-sm text-slate-700">{d.ai}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4">
          <div className="text-xs font-bold uppercase text-amber-600">🧑 Human does</div>
          <p className="mt-1 text-sm text-slate-700">{d.human}</p>
        </div>
        <div className="rounded-2xl border border-dashed border-violet-200 p-3 text-sm md:col-span-3">
          <span className="font-semibold text-violet-700">Try this prompt: </span>
          <span className="italic text-slate-700">&ldquo;{d.prompt}&rdquo;</span>
        </div>
      </div>
    </div>
  );
}

const toHours = (s: string) => {
  const n = parseFloat(s.replace(/[^\d.]/g, "")) || 1;
  if (/week/.test(s)) return n * 40;
  if (/day/.test(s)) return n * 8;
  if (/minute/.test(s)) return n / 60;
  return n;
};

export function BeforeAfter() {
  const [fi, setFi] = useState(3);
  const f = FUNCTIONS[fi];
  const before = toHours(f.before.time);
  const after = toHours(f.after.time);
  const saved = Math.max(0, before - after);
  return (
    <div className="card card-pad">
      <h3 className="h-section">How AI became the day-to-day saviour</h3>
      <p className="mt-1 text-sm text-slate-600">Pick a function and compare a typical recurring task — before and after AI-assisted analysis (illustrative timings).</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FUNCTIONS.map((x, k) => (
          <button key={x.id} onClick={() => setFi(k)} className={clsx("rounded-full px-3 py-1 text-sm font-semibold", k === fi ? `bg-gradient-to-r ${x.color} text-white` : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
            {x.emoji} {x.name}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_1fr]" key={fi}>
        <div className="animate-pop rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-rose-700">😩 {f.before.title}</div>
            <span className="chip bg-rose-100 text-rose-700"><Clock className="h-3 w-3" /> {f.before.time}</span>
          </div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">{f.before.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
        <div className="grid place-items-center">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 px-4 py-3 text-center text-white shadow-lg">
            <Zap className="mx-auto h-5 w-5" />
            <div className="font-display text-2xl font-bold">~{Math.round((saved / before) * 100)}%</div>
            <div className="text-[11px]">time saved</div>
          </div>
        </div>
        <div className="animate-pop rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-emerald-700">🦸 {f.after.title}</div>
            <span className="chip bg-emerald-100 text-emerald-700"><Clock className="h-3 w-3" /> {f.after.time}</span>
          </div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">{f.after.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Persona: {f.persona}. The time saved goes into what matters: validating, adding context and acting on the findings.</p>
    </div>
  );
}
