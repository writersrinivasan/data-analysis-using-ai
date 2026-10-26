"use client";

import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { MODULES } from "@/lib/content";
import { Icon } from "@/components/Icon";
import { useSettings } from "@/components/Providers";
import { SectionHeader } from "@/components/ui";

export default function ModulesPage() {
  const { completed } = useSettings();
  const total = MODULES.reduce((a, m) => a + m.minutes, 0);
  return (
    <div>
      <SectionHeader kicker="Curriculum" title={<>8 modules · <span className="gradient-text">{total} minutes</span></>} sub="Each module mixes concepts, live widgets on realistic data, AI prompts and a quick check. Content adapts to the audience level selected in the top bar." right={<span className="chip bg-emerald-100 text-emerald-700">{completed.length}/8 completed</span>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MODULES.map((m) => (
          <Link key={m.id} href={`/modules/${m.slug}`} className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
            <div className={`relative h-28 bg-gradient-to-br ${m.gradient} p-4 text-white`}>
              <Icon name={m.icon} className="absolute -bottom-3 -right-3 h-24 w-24 opacity-20 transition group-hover:scale-110" />
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl font-bold">{String(m.id).padStart(2, "0")}</span>
                <span className="chip bg-white/25 text-white"><Clock className="h-3 w-3" /> {m.minutes} min</span>
              </div>
              {completed.includes(m.id) && <CheckCircle2 className="absolute bottom-3 left-4 h-6 w-6" />}
            </div>
            <div className="p-4">
              <div className="font-display font-bold leading-snug text-slate-900">{m.title}</div>
              <p className="mt-1 text-xs text-slate-500">{m.tagline}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
