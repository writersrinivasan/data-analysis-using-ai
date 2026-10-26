"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function CopyButton({ text, className, label }: { text: string; className?: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={clsx("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800", className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard blocked */
        }
      }}
      title="Copy"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {label ?? (done ? "Copied" : "Copy")}
    </button>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: React.ReactNode }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={clsx("scrollbar-thin flex gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={clsx(
            "whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition",
            value === t.id ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-800",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function SectionHeader({ kicker, title, sub, right }: { kicker?: string; title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && <div className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-600">{kicker}</div>}
        <h2 className="h-section">{title}</h2>
        {sub && <p className="mt-1 max-w-3xl text-sm text-slate-600">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-report text-sm text-slate-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

export function Stat({ label, value, sub, tone = "violet" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "violet" | "emerald" | "amber" | "rose" | "sky" }) {
  const tones = {
    violet: "from-violet-500/10 to-fuchsia-500/10 text-violet-700",
    emerald: "from-emerald-500/10 to-teal-500/10 text-emerald-700",
    amber: "from-amber-500/10 to-orange-500/10 text-amber-700",
    rose: "from-rose-500/10 to-pink-500/10 text-rose-700",
    sky: "from-sky-500/10 to-cyan-500/10 text-sky-700",
  };
  return (
    <div className={clsx("rounded-2xl bg-gradient-to-br p-4", tones[tone])}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-600">{sub}</div>}
    </div>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={clsx("chip bg-slate-100 text-slate-700", className)}>{children}</span>;
}

export function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "—";
    if (Number.isInteger(v)) return v.toLocaleString("en-IN");
    return v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  return String(v);
}
