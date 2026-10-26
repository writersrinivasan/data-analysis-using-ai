"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { MODULES } from "@/lib/content";
import { Icon } from "@/components/Icon";

const fmtT = (s: number) => `${Math.floor(Math.abs(s) / 60)}:${String(Math.floor(Math.abs(s) % 60)).padStart(2, "0")}`;

export default function TrainerPage() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const starts = MODULES.reduce<number[]>((acc, m, i) => [...acc, i === 0 ? 0 : acc[i - 1] + MODULES[i - 1].minutes * 60], []);
  const total = MODULES.reduce((a, m) => a + m.minutes, 0) * 60;
  let cur = starts.findIndex((s, i) => elapsed >= s && elapsed < s + MODULES[i].minutes * 60);
  if (cur < 0) cur = elapsed >= total ? MODULES.length - 1 : 0;
  const m = MODULES[cur];
  const remainingInModule = starts[cur] + m.minutes * 60 - elapsed;
  const over = elapsed >= total;

  return (
    <div className="space-y-6">
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${m.gradient} p-6 text-white sm:p-10`}>
        <Icon name={m.icon} className="absolute -right-8 -top-8 h-64 w-64 opacity-15" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Trainer mode · now presenting</div>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">{m.id}. {m.title}</h1>
            <p className="mt-2 text-white/85">{m.tagline}</p>
            <Link href={`/modules/${m.slug}`} className="btn mt-4 bg-white/20 text-white hover:bg-white/30">
              Open module content <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-3xl bg-black/20 p-6 text-center backdrop-blur">
            <div className="text-xs font-semibold uppercase text-white/70">{over ? "Session time over by" : "Left in this module"}</div>
            <div className={clsx("font-display text-6xl font-bold tabular-nums", remainingInModule < 60 && !over && "text-amber-200")}>{over ? fmtT(elapsed - total) : fmtT(remainingInModule)}</div>
            <div className="mt-1 text-sm text-white/80">Session {fmtT(elapsed)} / {fmtT(total)}</div>
            <div className="mt-4 flex justify-center gap-2">
              <button className="btn bg-white text-slate-900" onClick={() => setRunning(!running)}>
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {running ? "Pause" : "Start"}
              </button>
              <button className="btn bg-white/20 text-white" onClick={() => setElapsed(Math.min(total - 1, starts[Math.min(cur + 1, MODULES.length - 1)]))} title="Jump to next module">
                <SkipForward className="h-4 w-4" />
              </button>
              <button className="btn bg-white/20 text-white" onClick={() => { setElapsed(0); setRunning(false); }} title="Reset">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-emerald-500 transition-all" style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="card card-pad">
          <h2 className="font-display text-lg font-bold">Run sheet</h2>
          <div className="mt-3 space-y-1.5">
            {MODULES.map((x, i) => (
              <button key={x.id} onClick={() => setElapsed(starts[i])} className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition", i === cur ? "bg-violet-100" : i < cur ? "opacity-60 hover:bg-slate-50" : "hover:bg-slate-50")}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${x.gradient} text-white`}>
                  <Icon name={x.icon} className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-semibold">{x.id}. {x.short}</span>
                <span className="font-mono text-xs text-slate-500">{fmtT(starts[i])} · {x.minutes}m</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card card-pad">
            <h2 className="font-display text-lg font-bold">🎤 Talking points & demos</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">{m.trainerNotes.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
          <div className="card card-pad">
            <h2 className="font-display text-lg font-bold">🎯 Outcomes to land</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{m.outcomes.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
          <div className="card card-pad">
            <h2 className="font-display text-lg font-bold">Audience-specific emphasis</h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(["beginner", "intermediate", "advanced"] as const).map((lv) => (
                <div key={lv} className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="mb-1 font-bold capitalize">{lv}</div>
                  {m.levelNotes[lv][0]}
                </div>
              ))}
            </div>
          </div>
          {MODULES[cur + 1] && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              <b>Up next:</b> {MODULES[cur + 1].id}. {MODULES[cur + 1].title} ({MODULES[cur + 1].minutes} min)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
