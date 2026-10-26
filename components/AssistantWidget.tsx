"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Bot, KeyRound, Loader2, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { useSettings } from "./Providers";
import { Markdown } from "./ui";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS: Record<string, string[]> = {
  "/modules/introduction": ["How is AI analysis different from a pivot table?", "Give me 3 examples of AI saving time for a finance team"],
  "/modules/working-with-data": ["Explain dimensions vs measures with an HR example", "Write a prompt to clean vendor names"],
  "/modules/exploratory-analysis": ["When should I use median instead of average?", "How do I detect outliers in Excel?"],
  "/modules/function-use-cases": ["Give me 5 AI use cases for procurement", "What metrics should L&D track for ROI?"],
  "/modules/visualization-reporting": ["Which chart for budget vs actual?", "Draft a template for a management summary"],
  "/modules/advanced-techniques": ["Explain scenario analysis with a hiring example", "How do I do root-cause analysis on rising costs?"],
  "/modules/responsible-ai": ["What data should I never paste into ChatGPT?", "How do I validate an AI-generated number?"],
  "/sandbox": ["What questions should I ask of this dataset?", "How does the LangGraph agent work?"],
};

export function AssistantWidget() {
  const { apiKey, audience, model, openSettings } = useSettings();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"tutor" | "coach">("tutor");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent<string>).detail;
      setOpen(true);
      if (q) void send(q);
    };
    window.addEventListener("ask-datum", handler);
    return () => window.removeEventListener("ask-datum", handler);
  });

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    if (!apiKey) {
      openSettings();
      return;
    }
    const next = [...msgs, { role: "user" as const, content: text.trim() }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-groq-key": apiKey },
        body: JSON.stringify({ messages: next, audience, model, mode, context: `User is on page ${path}` }),
      });
      if (!r.ok || !r.body) {
        const j = await r.json().catch(() => ({ error: r.statusText }));
        setMsgs([...next, { role: "assistant", content: `⚠️ ${j.error}` }]);
        return;
      }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        const shown = acc.replace(/<think>[\s\S]*?(<\/think>|$)/g, "");
        setMsgs([...next, { role: "assistant", content: shown }]);
      }
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  };

  const chips = SUGGESTIONS[path] ?? ["What will I learn in this 2-hour session?", "How has AI helped HR teams day-to-day?", "Explain the AI data analysis workflow"];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-xl shadow-violet-600/30 transition hover:scale-105"
        aria-label="Open AI assistant"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask Datum"}</span>
      </button>
      {open && (
        <div className="fixed bottom-20 right-3 z-40 flex h-[min(620px,calc(100vh-7rem))] w-[min(420px,calc(100vw-1.5rem))] animate-pop flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 p-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20">
                <Bot className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <div className="font-display font-bold">Datum · AI Teaching Assistant</div>
                <div className="text-xs text-white/80">Groq · {model}</div>
              </div>
              <button onClick={() => setMsgs([])} className="rounded-lg p-1.5 hover:bg-white/15" title="New chat">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex gap-1 rounded-xl bg-white/15 p-1 text-xs font-semibold">
              {(["tutor", "coach"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={clsx("flex-1 rounded-lg px-2 py-1", mode === m ? "bg-white text-violet-700" : "text-white/90")}>
                  {m === "tutor" ? "🎓 Tutor (explains)" : "🧭 Exercise coach (hints)"}
                </button>
              ))}
            </div>
          </div>
          <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
            {!msgs.length && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Hi! I adapt to your level and the page you&apos;re on. Try:</p>
                {chips.map((c) => (
                  <button key={c} onClick={() => send(c)} className="block w-full rounded-xl border border-violet-100 bg-white px-3 py-2 text-left text-sm text-violet-700 hover:bg-violet-50">
                    {c}
                  </button>
                ))}
                {!apiKey && (
                  <button onClick={() => openSettings()} className="btn w-full bg-amber-50 text-amber-700">
                    <KeyRound className="h-4 w-4" /> Add your Groq key to start
                  </button>
                )}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={clsx("max-w-[88%] rounded-2xl px-3 py-2 text-sm", m.role === "user" ? "bg-violet-600 text-white" : "border border-slate-200 bg-white")}>
                  {m.role === "assistant" ? m.content ? <Markdown>{m.content}</Markdown> : <Loader2 className="h-4 w-4 animate-spin text-violet-500" /> : m.content}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form
            className="flex gap-2 border-t border-slate-100 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input className="input" placeholder="Ask anything about AI data analysis…" value={input} onChange={(e) => setInput(e.target.value)} />
            <button className="btn-primary px-3" disabled={busy || !input.trim()} aria-label="Send">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

/** Opens the assistant from anywhere with a prefilled question. */
export function askDatum(q: string) {
  window.dispatchEvent(new CustomEvent("ask-datum", { detail: q }));
}
