"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, Trash2, X, XCircle } from "lucide-react";
import { useSettings } from "./Providers";
import { SUGGESTED_MODELS } from "@/lib/groq";
import { AUDIENCES } from "@/lib/audience";

export function SettingsModal() {
  const s = useSettings();
  const [key, setKey] = useState("");
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (s.settingsOpen) {
      setKey(s.apiKey);
      setRemember(s.remember);
      setStatus(null);
    }
  }, [s.settingsOpen, s.apiKey, s.remember]);

  if (!s.settingsOpen) return null;

  const test = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const r = await fetch("/api/validate-key", { method: "POST", headers: { "x-groq-key": key.trim() } });
      const j = await r.json();
      if (j.ok) {
        s.setApiKey(key, remember);
        s.setModels(j.models);
        if (j.models.length && !j.models.includes(s.model)) s.setModel(j.models.includes("llama-3.3-70b-versatile") ? "llama-3.3-70b-versatile" : j.models[0]);
        setStatus({ ok: true, msg: `Key works — ${j.models.length} models available.` });
      } else setStatus({ ok: false, msg: j.error ?? "Key rejected" });
    } catch (e) {
      setStatus({ ok: false, msg: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const models = s.models.length ? s.models : SUGGESTED_MODELS.map((m) => m.id);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => s.openSettings(false)}>
      <div className="card w-full max-w-lg animate-pop bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">Bring Your Own Key (Groq)</h3>
              <p className="text-xs text-slate-500">Powers the AI Assistant, the LangGraph analysis agent and AI cleaning.</p>
            </div>
          </div>
          <button onClick={() => s.openSettings(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="label">Groq API key</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input className="input pr-9 font-mono" type={show ? "text" : "password"} placeholder="gsk_..." value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" spellCheck={false} />
            <button className="absolute right-2 top-2 text-slate-400" onClick={() => setShow(!show)} type="button" aria-label="Toggle visibility">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button className="btn-primary" onClick={test} disabled={!key.trim() || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & test"}
          </button>
        </div>
        <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline">
          Get a free key at console.groq.com <ExternalLink className="h-3 w-3" />
        </a>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-violet-600" />
          Remember on this device (otherwise cleared when the tab closes)
        </label>
        {status && (
          <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${status.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {status.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {status.msg}
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Model</label>
            <select className="input" value={s.model} onChange={(e) => s.setModel(e.target.value)}>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">{SUGGESTED_MODELS.find((m) => m.id === s.model)?.note ?? "Pick a large model for the analysis agent."}</p>
          </div>
          <div>
            <label className="label">Audience level</label>
            <select className="input" value={s.audience} onChange={(e) => s.setAudience(e.target.value as typeof s.audience)}>
              {AUDIENCES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.emoji} {a.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">{AUDIENCES.find((a) => a.id === s.audience)?.who}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          <div className="mb-1 flex items-center gap-1 font-semibold text-slate-800">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> How your key is handled
          </div>
          Stored only in your browser ({remember ? "localStorage" : "sessionStorage"}). Sent per request to this app&apos;s own API route, which forwards it to Groq and never stores or logs it. The analysis agent sends Groq only the dataset <b>profile and computed aggregates</b> — raw rows stay on the server.
        </div>

        {s.apiKey && (
          <button className="btn mt-4 text-rose-600 hover:bg-rose-50" onClick={() => { s.clearKey(); setKey(""); setStatus(null); }}>
            <Trash2 className="h-4 w-4" /> Forget key
          </button>
        )}
      </div>
    </div>
  );
}
