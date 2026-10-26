# Data Analysis Using AI — 2-Hour Practical Lab

Interactive Next.js training app for the "Data Analysis Using AI" session (cross-functional business audience), with a LangGraph multi-agent analysis sandbox powered by **your own Groq API key (BYOK)**.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
# or: npm run build && npm start
```

Click **Add Groq key** in the top bar and paste a key from https://console.groq.com/keys. The key is stored only in your browser (session or local storage) and is sent per request to this app's own API routes, which forward it to Groq and never store it.

## What's inside

| Area | Path | Highlights |
|---|---|---|
| Home | `/` | Audience level picker, 120-min agenda, before/after "AI as saviour" stories, architecture |
| Modules 1–8 | `/modules/[slug]` | TOC content, level-specific tips, interactive widgets, quizzes, trainer notes |
| AI Sandbox | `/sandbox` | 9 messy datasets (or your CSV): profile, 7-step cleaning + AI standardize, PII masking, LangGraph agents, manual formula tools |
| Industry use cases | `/use-cases` | 8 industries + 8 function playbooks, "adapt to my company" via AI |
| Resources | `/resources` | Curated links by level, prompt library, Excel↔AI cheat sheet, LangGraph/pandas/Groq code, glossary |
| Trainer mode | `/trainer` | Session timer that tracks the module run sheet with talking points |
| Assistant | floating "Ask Datum" | Tutor / exercise-coach chat that adapts to level & page |

## Agent architecture (`lib/agent/graph.ts`)

```
START → Profiler (code) → Planner (LLM) → Calculation Engine (code) ─┐
              ↑ errors (max 3) ──────────────────────────────────────┘
        → Insight Analyst (LLM) → Validator (code) → Report Writer (LLM) → END
              ↑ ungrounded numbers (max 1 revision) ─┘
```

- The LLM never sees raw rows: only the profile (schema, ranges, category values; PII columns withheld) and computed aggregates.
- Every number comes from the deterministic engine in `lib/engine.ts` (15 operations: aggregate, trend, funnel, variance, price_change, share, outliers, forecast…).
- The Validator extracts every number in the AI's observations and checks it against the result tables.

## Datasets (`lib/datasets.ts`)

Seeded, so everyone sees identical data. Each dataset has documented **planted issues** (spelling variants, mixed dates, duplicates, impossible values, PII) and **planted insights** (e.g. Apex Supplies +19% price rise from Apr 2026, Marketing overspend in Q3, Software Engineer interview→offer bottleneck). Trainers can reveal them in the Sandbox's "Trainer answer key".
