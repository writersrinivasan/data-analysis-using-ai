"use client";

import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Bot, Factory, FlaskConical, KeyRound, Lock, ShieldCheck, Sparkles, Wrench, Zap } from "lucide-react";
import { FUNCTIONS, MODULES } from "@/lib/content";
import { AUDIENCES } from "@/lib/audience";
import { GRAPH_NODES } from "@/lib/agent/nodes";
import { Icon } from "@/components/Icon";
import { useSettings } from "@/components/Providers";

export default function Home() {
  const { audience, setAudience, apiKey, openSettings, completed } = useSettings();
  let t = 0;
  return (
    <div className="space-y-14">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-12 text-white sm:px-12 sm:py-16">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-fuchsia-600/40 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-sky-500/30 blur-3xl" />
        <div className="absolute right-1/3 top-10 h-60 w-60 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="chip bg-white/10 text-white/90 ring-1 ring-white/20">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" /> 2-Hour Practical Session · Cross-Functional Business Audience
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
              Data Analysis
              <br />
              <span className="bg-gradient-to-r from-fuchsia-400 via-amber-300 to-sky-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">Using AI</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">From spreadsheet grind to AI-assisted insight — for HR, L&amp;D, Recruitment, Procurement, Finance, Administration, Investor Relations and Legal. Learn it, then try it live on realistic data with a LangGraph agent team.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/modules/introduction" className="btn bg-white px-5 py-3 text-base text-slate-900 hover:bg-slate-100">
                Start the session <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sandbox" className="btn bg-gradient-to-r from-fuchsia-500 to-orange-400 px-5 py-3 text-base text-white">
                <FlaskConical className="h-4 w-4" /> Open AI Sandbox
              </Link>
              {!apiKey && (
                <button onClick={() => openSettings()} className="btn px-5 py-3 text-base text-white ring-1 ring-white/30 hover:bg-white/10">
                  <KeyRound className="h-4 w-4" /> Add Groq key (BYOK)
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { n: "8", l: "Modules", s: "120 minutes", c: "from-fuchsia-500 to-pink-500" },
              { n: "9", l: "Realistic datasets", s: "with planted issues", c: "from-sky-500 to-cyan-500" },
              { n: "6", l: "Agent nodes", s: "LangGraph on Groq", c: "from-violet-500 to-indigo-500" },
              { n: "15", l: "Analysis tools", s: "numbers by code, not guesses", c: "from-amber-400 to-orange-500" },
            ].map((s) => (
              <div key={s.l} className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
                <div className={`bg-gradient-to-r ${s.c} bg-clip-text font-display text-5xl font-bold text-transparent`}>{s.n}</div>
                <div className="mt-1 font-semibold">{s.l}</div>
                <div className="text-xs text-white/60">{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section>
        <div className="mb-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Who are you today?</div>
          <h2 className="h-section">Pick your level — the content and the AI adapt</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {AUDIENCES.map((a, i) => (
            <button key={a.id} onClick={() => setAudience(a.id)} className={clsx("card card-pad text-left transition hover:-translate-y-1", audience === a.id && "ring-4 ring-violet-400/50")}>
              <div className={clsx("mb-3 inline-grid h-12 w-12 place-items-center rounded-2xl text-2xl", ["bg-emerald-100", "bg-sky-100", "bg-violet-100"][i])}>{a.emoji}</div>
              <div className="font-display text-lg font-bold">{a.label}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{a.short}</div>
              <p className="mt-2 text-sm text-slate-600">{a.who}</p>
              {audience === a.id && <span className="chip mt-3 bg-violet-600 text-white">Selected</span>}
            </button>
          ))}
        </div>
      </section>

      {/* AGENDA */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Final 2-hour structure</div>
            <h2 className="h-section">Agenda</h2>
          </div>
          <Link href="/trainer" className="btn-ghost">Trainer mode with timer <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mb-4 flex h-4 overflow-hidden rounded-full">
          {MODULES.map((m) => (
            <div key={m.id} className={`bg-gradient-to-r ${m.gradient}`} style={{ width: `${(m.minutes / 120) * 100}%` }} title={`${m.short} — ${m.minutes} min`} />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => {
            const start = t;
            t += m.minutes;
            return (
              <Link key={m.id} href={`/modules/${m.slug}`} className="group card flex gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${m.gradient} text-white`}>
                  <Icon name={m.icon} className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">
                    {String(Math.floor(start / 60)).padStart(1, "0")}:{String(start % 60).padStart(2, "0")} → {Math.floor(t / 60)}:{String(t % 60).padStart(2, "0")} · {m.minutes} min {completed.includes(m.id) && "✅"}
                  </div>
                  <div className="font-semibold leading-snug text-slate-800 group-hover:text-violet-700">
                    {m.id}. {m.short}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SAVIOUR STORIES */}
      <section>
        <div className="mb-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">AI as the day-to-day saviour</div>
          <h2 className="h-section">One recurring task per function — before and after AI</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {FUNCTIONS.map((f) => (
            <div key={f.id} className="card overflow-hidden">
              <div className={`bg-gradient-to-r ${f.color} px-4 py-3 text-white`}>
                <div className="text-2xl">{f.emoji}</div>
                <div className="font-display font-bold">{f.name}</div>
                <div className="text-xs text-white/80">{f.persona}</div>
              </div>
              <div className="space-y-2 p-4 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2">
                  <span className="text-rose-700">Before</span>
                  <b className="text-rose-700">{f.before.time}</b>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                  <span className="text-emerald-700">With AI</span>
                  <b className="text-emerald-700">{f.after.time}</b>
                </div>
                <p className="text-xs italic text-slate-600">&ldquo;{f.prompt}&rdquo;</p>
                <Link href={`/sandbox?dataset=${f.id}&tab=agent&q=${encodeURIComponent(f.prompt)}`} className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline">
                  Try it live <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Timings are illustrative, based on typical manual workflows.</p>
      </section>

      {/* ARCHITECTURE */}
      <section className="card overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_1.4fr]">
          <div className="bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-8 text-white">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Under the hood</div>
            <h2 className="mt-1 font-display text-2xl font-bold">An agentic AI team, not a chatbot guessing numbers</h2>
            <p className="mt-3 text-sm text-white/85">The Sandbox runs a LangGraph state machine on Groq. LLM agents plan, interpret and write; deterministic tools compute and verify. That separation is the single most important idea for trustworthy AI analysis.</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex gap-2"><Lock className="h-4 w-4 shrink-0 text-amber-300" /> Raw rows never go to the LLM — only schema &amp; aggregates</li>
              <li className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" /> Validator cross-checks every number the AI writes</li>
              <li className="flex gap-2"><KeyRound className="h-4 w-4 shrink-0 text-sky-300" /> BYOK: your Groq key, stored only in your browser</li>
              <li className="flex gap-2"><Zap className="h-4 w-4 shrink-0 text-pink-300" /> Groq LPUs: full multi-agent run in seconds</li>
            </ul>
          </div>
          <div className="p-6 sm:p-8">
            <div className="space-y-2">
              {GRAPH_NODES.map((n, i) => (
                <div key={n.id} className="flex items-center gap-3">
                  <span className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white", n.kind === "llm" ? "bg-gradient-to-br from-fuchsia-500 to-violet-600" : "bg-gradient-to-br from-sky-500 to-cyan-600")}>
                    {n.kind === "llm" ? <Bot className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                  </span>
                  <div className="flex-1 rounded-xl border border-slate-100 bg-white px-3 py-2">
                    <div className="text-sm font-bold">{i + 1}. {n.label} <span className="ml-1 text-[10px] font-semibold uppercase text-slate-400">{n.kind === "llm" ? "LLM" : "code"}</span></div>
                    <div className="text-xs text-slate-600">{n.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">↺ Feedback loops: Engine errors → Planner re-plans · Ungrounded numbers → Analyst rewrites</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/sandbox", title: "AI Sandbox", d: "Clean, profile, mask, and ask questions of 9 datasets — or your own CSV.", icon: FlaskConical, c: "from-violet-600 to-fuchsia-600" },
          { href: "/use-cases", title: "Industry use cases", d: "Manufacturing, BFSI, retail, healthcare, IT, logistics, pharma, energy.", icon: Factory, c: "from-orange-500 to-rose-500" },
          { href: "/resources", title: "Technical resources", d: "LangGraph, Groq, pandas, Power BI, statistics, prompt & privacy guides.", icon: Sparkles, c: "from-emerald-500 to-sky-500" },
        ].map((c) => (
          <Link key={c.href} href={c.href} className={`group rounded-3xl bg-gradient-to-br ${c.c} p-6 text-white shadow-lg transition hover:-translate-y-1`}>
            <c.icon className="h-8 w-8" />
            <div className="mt-3 font-display text-xl font-bold">{c.title}</div>
            <p className="mt-1 text-sm text-white/85">{c.d}</p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">Go <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div>
          </Link>
        ))}
      </section>
    </div>
  );
}
