"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, FlaskConical, MessageCircle, Presentation, Target } from "lucide-react";
import { MODULES, type Section } from "@/lib/content";
import { AUDIENCES } from "@/lib/audience";
import { Icon } from "@/components/Icon";
import { useSettings } from "@/components/Providers";
import { WIDGETS } from "@/components/widgets";
import { Quiz } from "@/components/widgets/ResponsibleWidgets";
import { askDatum } from "@/components/AssistantWidget";

/* Where each widget sits relative to the TOC sections ("end" = after all sections). */
const WIDGET_AFTER: Record<string, string> = {
  beforeAfter: "1.1",
  workflow: "1.2",
  datasetAnatomy: "2.1",
  cleaningDemo: "2.2",
  promptBuilder: "2.3",
  statsPlayground: "3.2",
  exercise1: "end",
  chartChooser: "start",
  chartGallery: "start",
  segmentation: "6.1",
  whatIf: "6.1",
  scenario: "6.1",
  forecast: "6.1",
  piiScanner: "7.1",
  hallucinationSpotter: "7.2",
  validationChecklist: "7.2",
};

export function ModuleView({ slug }: { slug: string }) {
  const idx = MODULES.findIndex((m) => m.slug === slug);
  const m = MODULES[idx];
  const prev = MODULES[idx - 1];
  const next = MODULES[idx + 1];
  const { audience, completed, toggleComplete } = useSettings();
  const [showAllLevels, setShowAllLevels] = useState(false);
  const [trainer, setTrainer] = useState(false);

  const widgetsAt = (pos: string) => m.widgets.filter((w) => (WIDGET_AFTER[w] ?? "end") === pos);
  const renderWidgets = (pos: string) =>
    widgetsAt(pos).map((w) => {
      const C = WIDGETS[w];
      return C ? <C key={w} /> : null;
    });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${m.gradient} p-6 text-white sm:p-10`}>
        <Icon name={m.icon} className="absolute -right-6 -top-6 h-56 w-56 animate-float opacity-15" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/85">
            Module {m.id} of 8 <span className="chip bg-white/20 normal-case tracking-normal text-white"><Clock className="h-3 w-3" /> {m.minutes} minutes</span>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-5xl">{m.title}</h1>
          <p className="mt-3 max-w-2xl text-white/90">{m.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => toggleComplete(m.id)} className={clsx("btn", completed.includes(m.id) ? "bg-white text-emerald-700" : "bg-white/20 text-white hover:bg-white/30")}>
              <CheckCircle2 className="h-4 w-4" /> {completed.includes(m.id) ? "Completed" : "Mark complete"}
            </button>
            <button onClick={() => askDatum(`Summarise module ${m.id} "${m.title}" for me in 5 bullets with one practical example from my work.`)} className="btn bg-white/20 text-white hover:bg-white/30">
              <MessageCircle className="h-4 w-4" /> Ask Datum about this module
            </button>
            <Link href="/sandbox" className="btn bg-white/20 text-white hover:bg-white/30">
              <FlaskConical className="h-4 w-4" /> Open Sandbox
            </Link>
          </div>
        </div>
      </div>

      {/* Outcomes + level notes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card card-pad">
          <div className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
            <Target className="h-5 w-5 text-violet-600" /> You will be able to…
          </div>
          <ul className="space-y-1.5">
            {m.outcomes.map((o) => (
              <li key={o} className="flex gap-2 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {o}
              </li>
            ))}
          </ul>
        </div>
        <div className="card card-pad">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-display text-lg font-bold">For your level</div>
            <button className="text-xs font-semibold text-violet-600 hover:underline" onClick={() => setShowAllLevels(!showAllLevels)}>
              {showAllLevels ? "Show mine only" : "Show all levels"}
            </button>
          </div>
          <div className="space-y-2">
            {AUDIENCES.filter((a) => showAllLevels || a.id === audience).map((a) => (
              <div key={a.id} className={clsx("rounded-xl p-3", a.id === "beginner" ? "bg-emerald-50" : a.id === "intermediate" ? "bg-sky-50" : "bg-violet-50")}>
                <div className="text-xs font-bold text-slate-700">{a.emoji} {a.label}</div>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {m.levelNotes[a.id].map((n) => <li key={n}>{n}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {renderWidgets("start")}

      {m.sections.map((s) => (
        <div key={s.id} className="space-y-6">
          <SectionBlock s={s} />
          {renderWidgets(s.id)}
        </div>
      ))}

      {renderWidgets("end")}

      <Quiz moduleId={m.id} questions={m.quiz} />

      {/* Trainer notes */}
      <div className="card card-pad">
        <button className="flex w-full items-center justify-between font-display text-lg font-bold" onClick={() => setTrainer(!trainer)}>
          <span className="flex items-center gap-2"><Presentation className="h-5 w-5 text-amber-500" /> Trainer notes</span>
          <span className="text-xs font-semibold text-violet-600">{trainer ? "Hide" : "Show"}</span>
        </button>
        {trainer && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {m.trainerNotes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        {prev ? (
          <Link href={`/modules/${prev.slug}`} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" /> {prev.id}. {prev.short}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/modules/${next.slug}`} className="btn-primary">
            {next.id}. {next.short} <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link href="/resources" className="btn-primary">
            Learning resources <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

const TINTS = ["from-fuchsia-500 to-pink-500", "from-violet-500 to-indigo-500", "from-sky-500 to-cyan-500", "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500", "from-rose-500 to-red-500"];

function SectionBlock({ s }: { s: Section }) {
  return (
    <div className="card card-pad">
      <h3 className="h-section">{s.title}</h3>
      {s.intro && <p className="mt-1 text-sm text-slate-600">{s.intro}</p>}
      {s.layout === "flow" ? (
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {s.items.map((it, i) => (
            <div key={it.t} className="relative rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-rose-500 text-xs font-bold text-white">{i + 1}</span>
                <Icon name={it.icon} className="h-4 w-4 text-rose-500" />
              </div>
              <div className="font-semibold text-slate-800">{it.t}</div>
              <p className="mt-1 text-xs text-slate-600">{it.d}</p>
            </div>
          ))}
        </div>
      ) : s.layout === "compare" ? (
        <div className={clsx("mt-4 grid gap-3", s.items.length === 2 ? "md:grid-cols-2" : "md:grid-cols-5")}>
          {s.items.map((it, i) => {
            const ai = /AI|Natural/i.test(it.t) && !/Humans/i.test(it.t);
            return (
              <div key={it.t} className={clsx("rounded-2xl p-4", ai ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white" : "border border-slate-100 bg-slate-50")}>
                <Icon name={it.icon} className={clsx("h-6 w-6", ai ? "text-white" : "text-slate-500")} />
                <div className="mt-2 font-semibold">{it.t}</div>
                <p className={clsx("mt-1 text-sm", ai ? "text-white/90" : "text-slate-600")}>{it.d}</p>
                {s.items.length > 2 && <div className={clsx("mt-2 text-[10px] font-bold uppercase tracking-wide", ai ? "text-white/70" : "text-slate-400")}>{i < 3 ? "Traditional" : "AI-assisted"}</div>}
              </div>
            );
          })}
        </div>
      ) : s.layout === "list" ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {s.items.map((it, i) => (
            <div key={it.t} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${TINTS[i % TINTS.length]} text-white`}>
                <Icon name={it.icon} className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-slate-800">{it.t}</div>
                <p className="text-xs text-slate-600">{it.d}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {s.items.map((it, i) => (
            <div key={it.t} className="group rounded-2xl border border-slate-100 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${TINTS[i % TINTS.length]} text-white`}>
                <Icon name={it.icon} className="h-4 w-4" />
              </span>
              <div className="mt-2 text-sm font-semibold text-slate-800">{it.t}</div>
              <p className="mt-0.5 text-xs text-slate-600">{it.d}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
