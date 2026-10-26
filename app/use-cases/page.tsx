"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { FUNCTIONS, INDUSTRY_STORIES } from "@/lib/content";
import { askDatum } from "@/components/AssistantWidget";
import { CopyButton, SectionHeader } from "@/components/ui";

export default function UseCasesPage() {
  const techniques = Array.from(new Set(INDUSTRY_STORIES.flatMap((s) => s.techniques))).sort();
  const [tech, setTech] = useState<string | null>(null);
  const stories = tech ? INDUSTRY_STORIES.filter((s) => s.techniques.includes(tech)) : INDUSTRY_STORIES;
  return (
    <div className="space-y-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-600 p-8 text-white sm:p-10">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="relative max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Industrial use cases</div>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">Where AI-assisted analysis earns its keep</h1>
          <p className="mt-3 text-white/90">Composite scenarios drawn from common patterns across industries. Each shows the problem, how AI helped, the techniques from this course, and the prompt to start with.</p>
        </div>
      </div>

      <section>
        <SectionHeader kicker="By industry" title="8 industry stories" sub="Filter by technique to connect each story back to a module." />
        <div className="mb-5 flex flex-wrap gap-2">
          <button onClick={() => setTech(null)} className={clsx("rounded-full px-3 py-1 text-xs font-semibold", !tech ? "bg-slate-900 text-white" : "bg-white text-slate-600 shadow-sm")}>All</button>
          {techniques.map((t) => (
            <button key={t} onClick={() => setTech(t)} className={clsx("rounded-full px-3 py-1 text-xs font-semibold", tech === t ? "bg-violet-600 text-white" : "bg-white text-slate-600 shadow-sm hover:bg-violet-50")}>
              {t}
            </button>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {stories.map((s) => (
            <article key={s.industry} className="card animate-pop overflow-hidden">
              <div className={`flex items-center gap-3 bg-gradient-to-r ${s.color} px-5 py-4 text-white`}>
                <span className="text-3xl">{s.emoji}</span>
                <div>
                  <div className="font-display text-lg font-bold">{s.industry}</div>
                  <div className="text-xs text-white/85">{s.role}</div>
                </div>
              </div>
              <div className="space-y-3 p-5 text-sm">
                <div>
                  <div className="text-xs font-bold uppercase text-rose-600">The pain</div>
                  <p className="text-slate-700">{s.problem}</p>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-violet-600">How AI helped</div>
                  <p className="text-slate-700">{s.ai}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.techniques.map((t) => (
                    <span key={t} className="chip bg-violet-50 text-violet-700">{t}</span>
                  ))}
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <div className="text-xs font-bold uppercase text-emerald-700">Outcome</div>
                  <ul className="mt-1 list-disc pl-5 text-slate-700">{s.impact.map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
                <div className="rounded-xl border border-dashed border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Starter prompt</span>
                    <CopyButton text={s.prompt} />
                  </div>
                  <p className="mt-1 italic text-slate-700">&ldquo;{s.prompt}&rdquo;</p>
                </div>
                <button className="btn-soft" onClick={() => askDatum(`I work in ${s.industry}. Adapt this use case to a mid-sized company: "${s.problem}". Give me the dataset columns I need, 5 prompts in order, the charts to build, and what must be validated by a human.`)}>
                  <MessageCircle className="h-4 w-4" /> Adapt to my company with AI
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader kicker="By function" title="Function playbooks" sub="Each runs live on its sample dataset in the Sandbox." right={<Link href="/modules/function-use-cases" className="btn-ghost">Module 4 deep-dive <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FUNCTIONS.map((f) => (
            <div key={f.id} className="card p-5">
              <div className={`inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${f.color} text-2xl`}>{f.emoji}</div>
              <div className="mt-3 font-display text-lg font-bold">{f.name}</div>
              <ul className="mt-2 space-y-0.5 text-xs text-slate-600">{f.analyses.slice(0, 5).map((a) => <li key={a}>• {a}</li>)}</ul>
              <Link href={`/sandbox?dataset=${f.id}&tab=agent&q=${encodeURIComponent(f.prompt)}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline">
                <Sparkles className="h-3.5 w-3.5" /> Run the example prompt
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
