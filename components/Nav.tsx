"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { BookOpen, Factory, FlaskConical, GraduationCap, KeyRound, Library, Menu, Presentation, Sparkles, X } from "lucide-react";
import { useSettings } from "./Providers";
import { AUDIENCES } from "@/lib/audience";

const LINKS = [
  { href: "/modules", label: "Modules", icon: GraduationCap },
  { href: "/sandbox", label: "AI Sandbox", icon: FlaskConical },
  { href: "/use-cases", label: "Industry Use Cases", icon: Factory },
  { href: "/resources", label: "Resources", icon: Library },
  { href: "/trainer", label: "Trainer Mode", icon: Presentation },
];

export function Nav() {
  const path = usePathname();
  const { apiKey, audience, setAudience, openSettings, model } = useSettings();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-600 to-sky-500 text-white shadow-lg shadow-violet-500/30">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-sm font-extrabold tracking-tight">Data Analysis Using AI</span>
            <span className="block text-[11px] font-medium text-slate-500">2-hour practical lab</span>
          </span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={clsx("flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition", path.startsWith(l.href) ? "bg-violet-100 text-violet-700" : "text-slate-600 hover:bg-slate-100")}>
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <select
            aria-label="Audience level"
            value={audience}
            onChange={(e) => setAudience(e.target.value as typeof audience)}
            className="hidden rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 md:block"
            title="Content and AI answers adapt to this level"
          >
            {AUDIENCES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.emoji} {a.label}
              </option>
            ))}
          </select>
          <button onClick={() => openSettings()} className={clsx("btn px-3", apiKey ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100")} title={apiKey ? `Groq key set · ${model}` : "Add your Groq API key"}>
            <KeyRound className="h-4 w-4" />
            <span className="hidden sm:inline">{apiKey ? "Groq connected" : "Add Groq key"}</span>
          </button>
          <button className="btn-ghost px-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <l.icon className="h-4 w-4" /> {l.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-2 px-3">
            <BookOpen className="h-4 w-4 text-slate-500" />
            <select value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)} className="input py-1.5">
              {AUDIENCES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.emoji} {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
}
