"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, CheckCircle2, FlaskConical, XCircle } from "lucide-react";
import { CAPSTONE_STEPS, FUNCTIONS, HALLUCINATION_CLAIMS, type QuizQ } from "@/lib/content";
import { useSettings } from "../Providers";

/* ------------------------------------------------------------ 7.2 Hallucination spotter */
export function HallucinationSpotter() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const labels: Record<string, string> = { grounded: "✅ Grounded", unsupported: "🧠 Unsupported conclusion", misread: "🔀 Misinterpreted / wrong correlation", calc: "🧮 Incorrect calculation" };
  const score = Object.entries(answers).filter(([i, a]) => HALLUCINATION_CLAIMS[Number(i)].verdict === a).length;
  return (
    <div className="card card-pad">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="h-section">7.2 Spot the hallucination</h3>
        <span className="chip bg-violet-100 text-violet-700">Score {score}/{HALLUCINATION_CLAIMS.length}</span>
      </div>
      <p className="mt-1 text-sm text-slate-600">These are typical AI statements about our sample data. Classify each one.</p>
      <div className="mt-4 space-y-3">
        {HALLUCINATION_CLAIMS.map((c, i) => {
          const a = answers[i];
          return (
            <div key={i} className={clsx("rounded-2xl border p-4", a ? (a === c.verdict ? "border-emerald-200 bg-emerald-50/50" : "border-rose-200 bg-rose-50/50") : "border-slate-100 bg-white")}>
              <p className="text-sm font-medium text-slate-800">&ldquo;{c.claim}&rdquo;</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(labels).map(([k, l]) => (
                  <button key={k} disabled={!!a} onClick={() => setAnswers({ ...answers, [i]: k })} className={clsx("rounded-full border px-2.5 py-1 text-xs font-semibold", a === k ? (k === c.verdict ? "border-emerald-400 bg-emerald-100" : "border-rose-400 bg-rose-100") : a && k === c.verdict ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50")}>
                    {l}
                  </button>
                ))}
              </div>
              {a && <p className="mt-2 text-xs text-slate-600">{a === c.verdict ? "✔ Correct. " : "✘ Not quite. "}{c.why}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ 7.3 Validation checklist */
const CHECKLIST = [
  { stage: "AI Output", color: "bg-violet-500", items: ["Read the answer fully — note every number and claim", "Ask: 'which rows, filters and formula produced each number?'"] },
  { stage: "Recalculate", color: "bg-sky-500", items: ["Rebuild the top 2–3 numbers with a pivot / SUMIFS (or Sandbox Manual Tools)", "Check totals reconcile to the source system"] },
  { stage: "Cross-check", color: "bg-emerald-500", items: ["Compare with last month's report or a second source", "Check row counts: duplicates removed? filters right?"] },
  { stage: "Validate", color: "bg-amber-500", items: ["Confirm column meanings and date formats", "Challenge causal language — is it correlation only?", "Look at outliers before trusting averages"] },
  { stage: "Business Review", color: "bg-rose-500", items: ["Domain owner confirms context and causes", "Remove PII / confidential details before sharing", "Decide and assign owners — a human signs off"] },
];

export function ValidationChecklist() {
  const all = CHECKLIST.flatMap((c) => c.items);
  const [done, setDone] = useState<string[]>([]);
  const pct = Math.round((done.length / all.length) * 100);
  return (
    <div className="card card-pad">
      <h3 className="h-section">7.3 Validation checklist</h3>
      <p className="mt-1 text-sm font-semibold text-slate-600">AI Output → Recalculate → Cross-check → Validate → Business Review</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-gradient-to-r from-violet-500 via-emerald-500 to-rose-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {CHECKLIST.map((c, k) => (
          <div key={c.stage} className="relative rounded-2xl border border-slate-100 bg-white p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className={clsx("grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-white", c.color)}>{k + 1}</span>
              <span className="text-sm font-bold">{c.stage}</span>
            </div>
            {c.items.map((it) => (
              <label key={it} className="mb-1.5 flex cursor-pointer gap-2 text-xs text-slate-600">
                <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-violet-600" checked={done.includes(it)} onChange={() => setDone(done.includes(it) ? done.filter((x) => x !== it) : [...done, it])} />
                <span className={done.includes(it) ? "line-through opacity-60" : ""}>{it}</span>
              </label>
            ))}
            {k < CHECKLIST.length - 1 && <ArrowRight className="absolute -right-3 top-4 z-10 hidden h-5 w-5 rounded-full bg-white text-slate-300 md:block" />}
          </div>
        ))}
      </div>
      {pct === 100 && <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">🎉 Ready to share — with your name on it.</div>}
    </div>
  );
}

/* ------------------------------------------------------------ 8 Capstone */
export function Capstone() {
  const [fi, setFi] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const f = FUNCTIONS[fi];
  return (
    <div className="space-y-4">
      <div className="card card-pad">
        <h3 className="h-section">Choose your function</h3>
        <p className="mt-1 text-sm text-slate-600">Everyone uses the same <b>Org 360 Scorecard</b> (employees, training, recruitment, procurement, finance, vendors, department info). Your function decides the questions.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FUNCTIONS.map((x, k) => (
            <button key={x.id} onClick={() => setFi(k)} className={clsx("rounded-full px-3 py-1.5 text-sm font-semibold", k === fi ? `bg-gradient-to-r ${x.color} text-white` : "bg-slate-100 text-slate-600")}>
              {x.emoji} {x.name}
            </button>
          ))}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-gradient-to-r from-lime-400 to-emerald-600 transition-all" style={{ width: `${(done.length / 8) * 100}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-500">{done.length}/8 steps complete</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {CAPSTONE_STEPS.map((s) => {
          const prompt = s.prompt.replace("{fn}", f.name);
          const isDone = done.includes(s.n);
          const href = s.action === "clean" ? "/sandbox?dataset=capstone&tab=clean" : s.action === "validate" ? "/sandbox?dataset=capstone&tab=agent" : `/sandbox?dataset=capstone&tab=agent&q=${encodeURIComponent(prompt)}&run=1`;
          return (
            <div key={s.n} className={clsx("rounded-2xl border p-4 transition", isDone ? "border-emerald-200 bg-emerald-50/60" : "border-slate-100 bg-white")}>
              <div className="flex items-start gap-3">
                <button onClick={() => setDone(isDone ? done.filter((x) => x !== s.n) : [...done, s.n])} className={clsx("grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold", isDone ? "bg-emerald-500 text-white" : "bg-lime-100 text-lime-700")} aria-label="Toggle done">
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : s.n}
                </button>
                <div className="flex-1">
                  <div className="font-semibold">Step {s.n}: {s.t}</div>
                  {prompt && <p className="mt-1 text-xs italic text-slate-600">&ldquo;{prompt}&rdquo;</p>}
                  {s.action === "clean" && <p className="mt-1 text-xs text-slate-600">Run the 7 cleaning steps + AI standardize. Note the &lsquo;Ops&rsquo; vs &lsquo;Operations&rsquo; fix.</p>}
                  {s.action === "validate" && <p className="mt-1 text-xs text-slate-600">Review the Validator&apos;s checklist, the &lsquo;Needs human validation&rsquo; list and the Planner&apos;s assumptions. Recalculate one number with Manual Tools.</p>}
                  <Link href={href} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline">
                    <FlaskConical className="h-3.5 w-3.5" /> Open in Sandbox
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Quiz */
export function Quiz({ moduleId, questions }: { moduleId: number; questions: QuizQ[] }) {
  const { recordQuiz } = useSettings();
  const [picked, setPicked] = useState<Record<number, number>>({});
  if (!questions.length) return null;
  return (
    <div className="card card-pad">
      <h3 className="h-section">⚡ Quick check</h3>
      <div className="mt-3 space-y-4">
        {questions.map((q, i) => {
          const p = picked[i];
          return (
            <div key={i}>
              <p className="text-sm font-semibold text-slate-800">{i + 1}. {q.q}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, k) => (
                  <button
                    key={o}
                    disabled={p !== undefined}
                    onClick={() => {
                      setPicked({ ...picked, [i]: k });
                      recordQuiz(`${moduleId}-${i}`, k === q.answer);
                    }}
                    className={clsx("flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm", p === undefined ? "border-slate-200 hover:bg-violet-50" : k === q.answer ? "border-emerald-300 bg-emerald-50" : p === k ? "border-rose-300 bg-rose-50" : "border-slate-100 opacity-60")}
                  >
                    {p !== undefined && k === q.answer && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                    {p === k && k !== q.answer && <XCircle className="h-4 w-4 shrink-0 text-rose-600" />}
                    {o}
                  </button>
                ))}
              </div>
              {p !== undefined && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">💡 {q.why}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
