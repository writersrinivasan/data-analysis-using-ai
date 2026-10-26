"use client";

import { useMemo, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { maskText, scanText } from "@/lib/privacy";
import { SAMPLE_PII_TEXT } from "@/lib/content";
import { CopyButton } from "../ui";

export function PiiScanner() {
  const [text, setText] = useState(SAMPLE_PII_TEXT);
  const findings = useMemo(() => scanText(text), [text]);
  const masked = useMemo(() => maskText(text), [text]);
  const high = findings.filter((f) => f.severity === "high").length;
  return (
    <div className="card card-pad">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <ShieldAlert className="h-5 w-5 text-rose-500" /> Pre-upload PII scanner
        </h3>
        <span className={`chip ${findings.length ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
          {findings.length ? `${findings.length} finding(s) · ${high} high risk` : "Clean"}
        </span>
      </div>
      <p className="mb-3 text-xs text-slate-600">Paste anything you were about to send to an AI tool. Runs 100% in your browser — nothing is sent anywhere.</p>
      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <div className="label">Original</div>
          <textarea className="input h-48 font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div>
          <div className="label flex items-center justify-between">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Masked — safer to share</span>
            <CopyButton text={masked} />
          </div>
          <pre className="input h-48 overflow-auto whitespace-pre-wrap bg-emerald-50/50 font-mono text-xs">{masked}</pre>
        </div>
      </div>
      {findings.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {findings.map((f, i) => (
            <span key={i} className={`chip ${f.severity === "high" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
              {f.label}: <span className="font-mono">{f.match.length > 24 ? f.match.slice(0, 24) + "…" : f.match}</span>
            </span>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-slate-500">Regex scanners catch patterns, not context: a name alone (&ldquo;Rohan Mehta&rdquo;) is not caught here. Always review manually.</p>
    </div>
  );
}
