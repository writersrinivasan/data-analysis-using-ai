import type { Audience, FunctionId } from "./types";

export interface Item {
  t: string;
  d: string;
  icon?: string;
}
export interface Section {
  id: string;
  title: string;
  intro?: string;
  items: Item[];
  layout?: "grid" | "list" | "compare" | "flow";
}
export interface QuizQ {
  q: string;
  options: string[];
  answer: number;
  why: string;
}
export interface Module {
  id: number;
  slug: string;
  title: string;
  short: string;
  minutes: number;
  gradient: string;
  accent: string;
  icon: string;
  tagline: string;
  outcomes: string[];
  sections: Section[];
  widgets: string[];
  levelNotes: Record<Audience, string[]>;
  trainerNotes: string[];
  quiz: QuizQ[];
}

export const MODULES: Module[] = [
  {
    id: 1,
    slug: "introduction",
    title: "From Spreadsheet Analysis to AI-Assisted Analysis",
    short: "Introduction",
    minutes: 10,
    gradient: "from-fuchsia-500 via-pink-500 to-orange-400",
    accent: "fuchsia",
    icon: "Sparkles",
    tagline: "Same data, new superpower: ask questions in plain English.",
    outcomes: ["Explain how AI-assisted analysis differs from formula-driven Excel work", "Name 10 things AI can do with business data", "Walk through the 9-step AI analysis workflow", "Describe what stays a human responsibility"],
    sections: [
      {
        id: "1.1",
        title: "1.1 Traditional vs AI-Assisted Data Analysis",
        layout: "compare",
        items: [
          { t: "Manual Excel analysis", d: "Copy, paste, filter and eyeball. Slow, error-prone, hard to repeat. A monthly vendor review can take 2 days.", icon: "Table" },
          { t: "Formula-driven analysis", d: "SUMIFS, VLOOKUP/XLOOKUP, IF chains. Powerful but you must know which formula to write — and formulas break silently.", icon: "Sigma" },
          { t: "Pivot tables & dashboards", d: "Great for known questions. Every new question means rebuilding the pivot or waiting for the BI team.", icon: "LayoutDashboard" },
          { t: "AI-assisted analysis", d: "Describe the outcome; AI writes the formula, pivot, SQL or Python and explains the result. You review instead of build.", icon: "Bot" },
          { t: "Natural-language exploration", d: "\"Which vendors raised prices since April?\" — a conversation with your data. Follow-up questions take seconds, not days.", icon: "MessageSquare" },
        ],
      },
      {
        id: "1.2",
        title: "1.2 What AI Can Do With Business Data",
        layout: "grid",
        items: [
          { t: "Summarization", d: "Turn 10,000 rows into a 5-line brief.", icon: "FileText" },
          { t: "Data cleaning", d: "Spot 'Engg' vs 'Engineering', mixed dates, duplicates.", icon: "Eraser" },
          { t: "Classification", d: "Tag tickets, expenses or contracts into categories.", icon: "Tags" },
          { t: "Categorization", d: "Group free-text into themes (e.g. exit-interview reasons).", icon: "FolderTree" },
          { t: "Trend identification", d: "Month-on-month, quarter-on-quarter, YoY patterns.", icon: "TrendingUp" },
          { t: "Outlier detection", d: "A ₹98,000 training fee that should be ₹9,800.", icon: "AlertTriangle" },
          { t: "Correlation exploration", d: "Do training hours relate to assessment scores?", icon: "GitCompare" },
          { t: "Forecasting assistance", d: "Baseline projections with ranges for planning.", icon: "LineChart" },
          { t: "Report generation", d: "Executive summaries, findings, action items.", icon: "ClipboardList" },
          { t: "Visualization", d: "Recommends and builds the right chart.", icon: "BarChart3" },
        ],
      },
      {
        id: "1.4",
        title: "1.4 The Role of the Human",
        layout: "list",
        intro: "AI accelerates the work. Accountability does not transfer.",
        items: [
          { t: "Ask the right business question", d: "\"Why did attrition rise in Sales?\" beats \"analyse this file\".", icon: "HelpCircle" },
          { t: "Validate AI-generated calculations", d: "Recalculate key numbers with a pivot or a second method.", icon: "CheckCircle2" },
          { t: "Check assumptions", d: "Did AI read dd/mm as mm/dd? Did it sum a repeated column?", icon: "Search" },
          { t: "Review anomalies", d: "Is the outlier a fraud, a typo, or a real one-off event?", icon: "Eye" },
          { t: "Protect confidential information", d: "Mask PII and salary before anything leaves your laptop.", icon: "ShieldCheck" },
          { t: "Make the final business decision", d: "AI drafts; the accountable manager decides.", icon: "Gavel" },
        ],
      },
    ],
    widgets: ["workflow", "beforeAfter"],
    levelNotes: {
      beginner: ["You don't need to learn formulas to start — you need to learn to ask precise questions and check answers.", "Think of AI as a very fast junior analyst: brilliant, tireless, occasionally confidently wrong."],
      intermediate: ["Use AI to write the SUMIFS / XLOOKUP / pivot for you, then audit it — you'll move 3–5x faster.", "Your Excel instincts become your validation superpower."],
      advanced: ["The pattern that works in production: LLM plans → deterministic code computes → LLM explains → validator checks. This app's Sandbox implements exactly that with LangGraph.", "Never let the LLM do arithmetic in its head on raw data — make it call tools."],
    },
    trainerNotes: ["Open with a poll: 'How many hours did you spend in Excel last week?'", "Live demo: ask the Sandbox 'Identify vendors with significant price increases' on procurement data — 20 seconds vs a 2-hour manual exercise.", "Stress the 9-step workflow — it is the spine of the whole session."],
    quiz: [
      { q: "Which task should remain with a human even when AI does the analysis?", options: ["Summarizing 10,000 rows", "Making the final business decision", "Suggesting a chart type", "Detecting duplicate rows"], answer: 1, why: "AI assists with analysis, discovery and reporting; humans own validation, context, judgment and decisions." },
      { q: "What is the step right after 'Interpret' in the AI analysis workflow?", options: ["Report", "Visualize", "Validate", "Ask"], answer: 2, why: "Data → Clean → Understand → Ask → Analyze → Visualize → Interpret → Validate → Report. Validate before you report!" },
    ],
  },
  {
    id: 2,
    slug: "working-with-data",
    title: "Working With Business Data Using AI",
    short: "Business Data",
    minutes: 20,
    gradient: "from-sky-500 via-cyan-500 to-emerald-400",
    accent: "sky",
    icon: "Database",
    tagline: "Garbage in, confident garbage out — clean first, ask second.",
    outcomes: ["Distinguish dimensions vs measures, numeric vs categorical", "Use AI to find and fix 7 types of data-quality issues", "Ask natural-language questions that get precise answers", "Write prompts using the 6-part structure"],
    sections: [
      {
        id: "2.1",
        title: "2.1 Understanding a Business Dataset",
        layout: "grid",
        items: [
          { t: "Rows and columns", d: "Each row = one record (an employee, a PO, a month). Each column = one attribute.", icon: "Rows3" },
          { t: "Dimensions", d: "What you slice by: Department, Vendor, Month, Source. Usually text/categories.", icon: "Layers" },
          { t: "Measures", d: "What you add/average: Amount, Hours, Score, Headcount.", icon: "Ruler" },
          { t: "Numeric vs categorical", d: "Numbers can be summed; categories are counted. 'Employee ID' looks numeric but is not a measure!", icon: "Binary" },
          { t: "Dates & time series", d: "Enable trends, seasonality, YoY. Watch out for dd/mm vs mm/dd.", icon: "CalendarDays" },
          { t: "Missing values", d: "Blank ≠ zero. A missing score for a course not yet completed is expected.", icon: "CircleDashed" },
          { t: "Duplicate records", d: "Double-counted spend, double-paid invoices.", icon: "Copy" },
          { t: "Outliers", d: "Real events or entry errors? Always investigate before deleting.", icon: "Zap" },
        ],
      },
      {
        id: "2.2",
        title: "2.2 AI-Assisted Data Cleaning",
        layout: "list",
        intro: "Open the Sandbox → 'Clean' tab and run each step on the Procurement or HR dataset. Every planted issue is listed so you can check what AI found.",
        items: [
          { t: "Identify missing values", d: "Prompt: \"List columns with missing values, the count, and whether blanks look expected or like errors.\"", icon: "CircleDashed" },
          { t: "Detect duplicate records", d: "Prompt: \"Find exact duplicates and near-duplicates (same vendor, amount and date but different PO numbers).\"", icon: "Copy" },
          { t: "Standardize names", d: "\"APEX SUPPLIES\", \"Apex Supplies Pvt Ltd\" → \"Apex Supplies\".", icon: "Type" },
          { t: "Standardize categories", d: "\"Engg\", \"engineering\", \" Engineering \" → \"Engineering\".", icon: "Tags" },
          { t: "Normalize date formats", d: "04/03/2026, Mar 4 2026, 4-Mar-2026 → 2026-03-04. Confirm the dd/mm assumption!", icon: "CalendarCheck" },
          { t: "Identify inconsistent entries", d: "Total ≠ Quantity × Unit Price; Age = 7; Score = 870.", icon: "AlertOctagon" },
          { t: "Detect suspicious values", d: "Extreme outliers via IQR, duplicate payments, impossible ranges.", icon: "ScanSearch" },
        ],
      },
      {
        id: "2.3",
        title: "2.3 Natural-Language Questions",
        layout: "list",
        items: [
          { t: "\"Give me the top 10 categories by expenditure.\"", d: "Ranking → aggregate + sort + limit. Try it on Procurement.", icon: "ListOrdered" },
          { t: "\"Which departments have the highest variance?\"", d: "Clarify! Budget variance (Finance) or statistical variance? Good AI asks; good humans specify.", icon: "Sigma" },
          { t: "\"Identify unusual transactions.\"", d: "Outlier + duplicate detection. Ask AI to explain its rule (IQR, z-score).", icon: "Siren" },
          { t: "\"Compare this month's performance with last month.\"", d: "Define 'performance' and 'this month' — the data may end mid-month.", icon: "CalendarRange" },
        ],
      },
    ],
    widgets: ["datasetAnatomy", "cleaningDemo", "promptBuilder"],
    levelNotes: {
      beginner: ["Before asking anything, ask AI: 'Describe this dataset and list data-quality issues.'", "If a column name confuses you, it will confuse AI too — rename it."],
      intermediate: ["Ask AI for the Excel/Power Query steps for each cleaning action so the fix is repeatable next month.", "Keep a 'cleaning log' — what changed, how many rows, why."],
      advanced: ["Separate deterministic cleaning (trim, dedupe, type coercion) from judgment calls (entity resolution) — use the LLM only for the latter, and only on distinct values, not rows.", "This app's AI Standardize sends only distinct category values to Groq — never rows."],
    },
    trainerNotes: ["Show the HR dataset profile: 4 spellings of Engineering. Ask the room how a pivot would count them.", "Run 'AI Standardize' live, then show the cleaning log.", "Build one prompt together using the Prompt Builder."],
    quiz: [
      { q: "'Department' in an HR dataset is a…", options: ["Measure", "Dimension", "Outlier", "Time series"], answer: 1, why: "Dimensions are what you slice/group by; measures are what you aggregate." },
      { q: "A Training Cost of ₹98,000 where every other value is ₹600–₹11,000. Best action?", options: ["Delete it", "Replace with average", "Flag and confirm with the source owner", "Ignore it"], answer: 2, why: "Outliers can be typos or real events. Flag, investigate, then decide — never silently delete." },
    ],
  },
  {
    id: 3,
    slug: "exploratory-analysis",
    title: "AI-Powered Exploratory Data Analysis",
    short: "Exploratory Analysis",
    minutes: 20,
    gradient: "from-violet-500 via-purple-500 to-indigo-500",
    accent: "violet",
    icon: "Telescope",
    tagline: "Let AI walk the dataset first — then you ask sharper questions.",
    outcomes: ["Use AI to understand a new dataset in minutes", "Run descriptive, comparative and trend analysis", "Spot anomalies and turn them into management questions"],
    sections: [
      {
        id: "3.1",
        title: "3.1 Asking AI to Understand the Dataset",
        layout: "list",
        items: [
          { t: "What does this dataset contain?", d: "Grain (one row = ?), period covered, key columns.", icon: "Info" },
          { t: "What are the important variables?", d: "Which measures matter for the business question?", icon: "Star" },
          { t: "What patterns are visible?", d: "Concentrations, seasonality, gaps.", icon: "Shapes" },
          { t: "What questions should management ask?", d: "AI is surprisingly good at proposing the next 5 questions.", icon: "MessagesSquare" },
        ],
      },
      {
        id: "3.2",
        title: "3.2 Descriptive Analysis",
        layout: "grid",
        items: [
          { t: "Count", d: "=COUNTA(range) — how many records", icon: "Hash" },
          { t: "Sum", d: "=SUM / SUMIFS — totals", icon: "Plus" },
          { t: "Average", d: "=AVERAGE — sensitive to outliers", icon: "Divide" },
          { t: "Median", d: "=MEDIAN — the 'typical' value, robust to outliers", icon: "AlignCenter" },
          { t: "Min / Max", d: "=MIN / =MAX — the range; first place to find typos", icon: "ArrowUpDown" },
          { t: "Percentage", d: "part ÷ total × 100", icon: "Percent" },
          { t: "Growth rate", d: "(this − previous) ÷ previous × 100", icon: "TrendingUp" },
          { t: "Variance", d: "=VAR.S — spread (or Actual − Budget in finance!)", icon: "Activity" },
        ],
      },
      {
        id: "3.3",
        title: "3.3 Comparative Analysis",
        layout: "grid",
        items: [
          { t: "Month vs month", d: "MoM change % — watch for partial months.", icon: "CalendarDays" },
          { t: "Quarter vs quarter", d: "QoQ — beware seasonality (Q4 always high?).", icon: "CalendarRange" },
          { t: "Department vs department", d: "Normalise by headcount before comparing!", icon: "Building2" },
          { t: "Vendor vs vendor", d: "Unit price, delivery, concentration.", icon: "Truck" },
          { t: "Employee group vs group", d: "Tenure bands, performance ratings, locations.", icon: "Users" },
          { t: "Actual vs budget", d: "Variance and variance % — rank by absolute size.", icon: "Scale" },
        ],
      },
      {
        id: "3.4",
        title: "3.4 Trend Analysis & 3.5 Anomaly Detection",
        layout: "grid",
        items: [
          { t: "Monthly / quarterly trends", d: "Line charts; add a 3-month moving average to smooth noise.", icon: "LineChart" },
          { t: "Year-over-year", d: "Same month last year removes seasonality.", icon: "Repeat" },
          { t: "Growth / decline patterns", d: "Sustained vs one-off movements.", icon: "TrendingDown" },
          { t: "Unusually high transactions", d: "IQR rule: above Q3 + 1.5×IQR.", icon: "Siren" },
          { t: "Unexpected expenditure", d: "Spend in a month/category that's normally zero.", icon: "Wallet" },
          { t: "Sudden attrition", d: "Exits spike in a month or a team.", icon: "UserMinus" },
          { t: "Vendor price changes", d: "Same item, higher unit price after a date.", icon: "Tag" },
          { t: "Unusual recruitment patterns", d: "Application surges, time-to-hire spikes.", icon: "UserPlus" },
        ],
      },
    ],
    widgets: ["statsPlayground", "exercise1"],
    levelNotes: {
      beginner: ["Always ask for the median alongside the average — one big number can distort the average.", "When AI says 'increased', ask 'by how much, compared with when?'"],
      intermediate: ["Ask AI to give you the pivot layout (rows, columns, values, filters) for every finding, so you can reproduce it.", "Normalise before comparing: per head, per order, per month."],
      advanced: ["Prefer robust statistics (median, IQR) for operational data with heavy tails.", "Use the Sandbox's 'Manual tools' tab to see the exact operation JSON that the Planner agent generates."],
    },
    trainerNotes: ["Exercise 1 (8 min): pairs choose a dataset, use the Sandbox to produce 5 observations, 3 trends, 3 anomalies, 5 management questions.", "Debrief: compare AI's anomalies with the 'planted issues' list — what did it miss?"],
    quiz: [
      { q: "Salaries: 9 people earn ₹10L and 1 earns ₹9.8 Cr. Which statistic best represents a 'typical' salary?", options: ["Average", "Median", "Max", "Sum"], answer: 1, why: "The median ignores the extreme value; the average would be ~₹1 Cr — misleading." },
      { q: "Best way to compare attrition across departments of different sizes?", options: ["Number of exits", "Attrition rate (exits ÷ headcount)", "Total salary of leavers", "Average tenure"], answer: 1, why: "Rates normalise for size; raw counts favour small teams looking good." },
    ],
  },
  {
    id: 4,
    slug: "function-use-cases",
    title: "Function-Wise AI Data Analysis Use Cases",
    short: "Function Use Cases",
    minutes: 30,
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    accent: "orange",
    icon: "Briefcase",
    tagline: "Your function, your data, your daily wins.",
    outcomes: ["See realistic datasets for 8 business functions", "Run each function's example prompt in the Sandbox", "Identify 2 use cases to apply on Monday morning"],
    sections: [],
    widgets: ["functionTabs"],
    levelNotes: {
      beginner: ["Pick YOUR function tab and run its example prompt in the Sandbox — then change one word and run again.", "Note one report you build manually every month. That's your first AI use case."],
      intermediate: ["Compare AI's answer with how you'd build it in Excel today — time both.", "Turn your favourite prompt into a reusable template for your team."],
      advanced: ["Each function maps to a small set of engine ops (funnel, variance, price_change, upcoming…). Notice how few primitives cover most business questions.", "Think about which of these could run as a scheduled agent that emails the summary every Monday."],
    },
    trainerNotes: ["Split the room by function. Each group runs its prompt and shares one surprising finding (3 min each).", "Legal group: reinforce that AI supports review — it does not give legal advice."],
    quiz: [
      { q: "Which chart best shows where candidates drop out of hiring?", options: ["Pie chart", "Funnel chart", "Scatter plot", "Heat map"], answer: 1, why: "Funnels show sequential stage conversion and drop-off." },
      { q: "In the IR dataset, 'Company EPS' repeats on every row. What happens if AI sums it?", options: ["Correct EPS", "EPS × 16 — a big error", "Nothing", "It averages automatically"], answer: 1, why: "Repeated company-level values must not be summed across rows. A classic AI (and human) mistake." },
    ],
  },
  {
    id: 5,
    slug: "visualization-reporting",
    title: "AI-Powered Visualization & Reporting",
    short: "Visualization & Reports",
    minutes: 15,
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    accent: "emerald",
    icon: "BarChart3",
    tagline: "The right chart turns 30 minutes of explaining into 3 seconds of seeing.",
    outcomes: ["Choose the right chart for each business question", "Ask AI to build charts and management summaries", "Produce a 1-page management report from a spreadsheet"],
    sections: [
      {
        id: "5.3",
        title: "5.3 AI-Generated Management Summary",
        layout: "grid",
        items: [
          { t: "Executive summary", d: "3 lines: what happened, why it matters, what to do.", icon: "FileText" },
          { t: "Key findings", d: "Numbers with comparison points.", icon: "Search" },
          { t: "Business implications", d: "Cost, risk, customer, people impact.", icon: "Building" },
          { t: "Risks", d: "What could go wrong if we ignore it — or act on wrong data.", icon: "ShieldAlert" },
          { t: "Recommended questions", d: "What leadership should ask next.", icon: "HelpCircle" },
          { t: "Action items", d: "Owner + date. Not 'look into it'.", icon: "ListChecks" },
        ],
      },
    ],
    widgets: ["chartChooser", "chartGallery", "exercise2"],
    levelNotes: {
      beginner: ["Ask: 'What is the single best chart to show this to my CEO, and why?'", "One message per chart. Put it in the title: 'Agency hires cost 4x referrals'."],
      intermediate: ["Ask AI for the chart AND the exact Excel steps to build it, so it's brand-compliant.", "Use consistent colours for the same category across all charts."],
      advanced: ["Generate chart specs (Vega-Lite / Recharts JSON) from the LLM, but bind them to engine-computed data — never let the LLM type the data points.", "This app renders charts from computed tables; the LLM only chooses the chart type."],
    },
    trainerNotes: ["Exercise 2 (8 min): each participant goes Dataset → Analysis → Charts → Insights → Executive Summary using the Sandbox Agent, then downloads the report.", "Show a bad pie chart with 12 slices vs a sorted bar chart."],
    quiz: [
      { q: "Best chart for 'trend over time'?", options: ["Pie", "Line", "Scatter", "Funnel"], answer: 1, why: "Line charts show continuity and direction across time." },
      { q: "Best chart for 'risk concentration by category × owner'?", options: ["Heat map", "Pie", "Line", "Waterfall"], answer: 0, why: "Heat maps show intensity across two dimensions." },
    ],
  },
  {
    id: 6,
    slug: "advanced-techniques",
    title: "Advanced AI Analysis Techniques",
    short: "Advanced Techniques",
    minutes: 15,
    gradient: "from-rose-500 via-red-500 to-amber-500",
    accent: "rose",
    icon: "Brain",
    tagline: "From 'what happened' to 'what if' and 'why'.",
    outcomes: ["Segment people, customers, vendors and candidates", "Run what-if and 3-case scenario analysis", "Use AI-assisted forecasting responsibly", "Explore root causes with the 5 'what changed' questions"],
    sections: [
      {
        id: "6.1",
        title: "6.1 Segmentation",
        layout: "grid",
        items: [
          { t: "Employees by performance", d: "High performers at flight risk vs stable core.", icon: "Users" },
          { t: "Customers by value", d: "RFM: recency, frequency, monetary value.", icon: "Crown" },
          { t: "Vendors by spend", d: "Strategic / leverage / bottleneck / routine (Kraljic).", icon: "Truck" },
          { t: "Candidates by source", d: "Quality-of-hire and cost-per-hire by channel.", icon: "UserPlus" },
        ],
      },
      {
        id: "6.5",
        title: "6.5 Root-Cause Exploration",
        layout: "flow",
        intro: "Instead of asking \"What happened?\" ask:",
        items: [
          { t: "What changed?", d: "Which metric moved, by how much, vs which baseline?", icon: "GitCompare" },
          { t: "Where did it change?", d: "Which department / vendor / location / segment?", icon: "MapPin" },
          { t: "When did it change?", d: "Gradual drift or a step change on a date?", icon: "Clock" },
          { t: "What variables may explain it?", d: "Price, volume, mix, policy, season, people.", icon: "Lightbulb" },
          { t: "What extra data validates it?", d: "Contracts, exit interviews, tickets, market data.", icon: "DatabaseZap" },
        ],
      },
    ],
    widgets: ["segmentation", "whatIf", "scenario", "forecast"],
    levelNotes: {
      beginner: ["What-if = 'if X changes by Y%, what happens to Z?'. Use the sliders below to feel it.", "A forecast is a range, not a promise."],
      intermediate: ["Always present 3 cases (base / optimistic / conservative) with the assumptions written down.", "Ask AI to list the drivers and which ones you control."],
      advanced: ["The forecast here is a simple linear trend with a ±1.96σ band — fine for discussion; use proper time-series models (ETS, Prophet, ARIMA) for planning.", "Root cause: decompose variance into price × volume × mix effects before asking an LLM for hypotheses."],
    },
    trainerNotes: ["Use the What-If slider live: 'If hiring increases 20%, what happens to recruitment cost and onboarding training hours?'", "Root-cause demo: Finance dataset — Marketing overspend Q3. Walk the 5 questions in the Sandbox."],
    quiz: [
      { q: "A forecast shows ₹12 Cr ± ₹1.5 Cr. How should you present it?", options: ["'We will make ₹12 Cr'", "'Likely ₹10.5–13.5 Cr under current trends'", "'AI says ₹13.5 Cr'", "Don't present it"], answer: 1, why: "Forecasts are ranges with assumptions. State both." },
    ],
  },
  {
    id: 7,
    slug: "responsible-ai",
    title: "Data Privacy, Accuracy & Responsible AI",
    short: "Responsible AI",
    minutes: 10,
    gradient: "from-slate-600 via-indigo-600 to-blue-500",
    accent: "indigo",
    icon: "ShieldCheck",
    tagline: "Fast is good. Fast and wrong — or fast and leaked — is a disaster.",
    outcomes: ["Recognise data that must not be casually uploaded", "Spot the 4 kinds of AI hallucination in analysis", "Apply the validation checklist before sharing any AI output"],
    sections: [
      {
        id: "7.1",
        title: "7.1 What Data Should Not Be Casually Uploaded",
        layout: "grid",
        items: [
          { t: "Personally identifiable information", d: "Names + email/phone/ID numbers.", icon: "IdCard" },
          { t: "Employee confidential information", d: "Performance, disciplinary, health.", icon: "UserX" },
          { t: "Salary information", d: "Use bands, not exact figures.", icon: "IndianRupee" },
          { t: "Bank / payment information", d: "Account numbers, card numbers, IFSC.", icon: "CreditCard" },
          { t: "Confidential contracts", d: "Pricing, terms, counterparties.", icon: "FileLock" },
          { t: "Legal documents", d: "Litigation, privileged advice.", icon: "Scale" },
          { t: "Material non-public information", d: "Unpublished results — insider-trading risk.", icon: "Lock" },
          { t: "Sensitive company information", d: "Strategy, M&A, pricing models.", icon: "Building2" },
        ],
      },
      {
        id: "7.2",
        title: "7.2 AI Hallucination in Data Analysis",
        layout: "grid",
        items: [
          { t: "Incorrect calculations", d: "LLMs predict text; they don't natively do arithmetic. 'Total = ₹4.2 Cr' may be invented.", icon: "Calculator" },
          { t: "Misinterpreted columns", d: "Reads 'Variance' as statistical variance, dd/mm as mm/dd, sums repeated EPS.", icon: "Columns3" },
          { t: "Unsupported conclusions", d: "'Attrition rose because of the new manager' — not in the data.", icon: "MessageSquareWarning" },
          { t: "Incorrect correlations", d: "Correlation ≠ causation; spurious patterns in small samples.", icon: "Shuffle" },
        ],
      },
      {
        id: "7.4",
        title: "7.4 Human-in-the-Loop",
        layout: "compare",
        items: [
          { t: "AI assists with", d: "Analysis + Discovery + Reporting", icon: "Bot" },
          { t: "Humans remain responsible for", d: "Validation + Context + Judgment + Decisions", icon: "UserCheck" },
        ],
      },
    ],
    widgets: ["piiScanner", "hallucinationSpotter", "validationChecklist"],
    levelNotes: {
      beginner: ["If you would not email it to an outside vendor, don't paste it into a public AI tool.", "Use your company-approved AI tools and accounts only."],
      intermediate: ["Mask before you upload: pseudonymise names, band salaries, drop IDs you don't need.", "Ask AI to 'show the formula used' for every number in its answer."],
      advanced: ["Architect for privacy: send schema + aggregates to the LLM, keep row-level data in your environment (as this app's Profiler/Executor does).", "Log prompts/outputs for audit; add automated numeric-grounding checks like the Validator node here."],
    },
    trainerNotes: ["Paste the sample HR text into the PII scanner — let the room guess how many items it finds.", "Hallucination spotter: read each claim aloud and let people vote 'grounded or not'."],
    quiz: [
      { q: "Which is SAFEST to share with a public AI tool?", options: ["Employee list with salaries", "Monthly spend totals by category (no names)", "Vendor bank details", "Unreleased quarterly results"], answer: 1, why: "Aggregated, non-identifying operational data is lowest risk. The rest is PII, payment data or MNPI." },
      { q: "Correct validation order?", options: ["Business review → AI output → recalculate", "AI output → Recalculate → Cross-check → Validate → Business review", "AI output → Report", "Recalculate → AI output"], answer: 1, why: "That's the 7.3 checklist." },
    ],
  },
  {
    id: 8,
    slug: "capstone",
    title: "Capstone: One Dataset, Multiple Departments",
    short: "Capstone",
    minutes: 10,
    gradient: "from-lime-400 via-green-500 to-emerald-600",
    accent: "lime",
    icon: "Trophy",
    tagline: "Put it all together on the Org 360 dataset — for your function.",
    outcomes: ["Run the full 8-step workflow end-to-end", "Produce a validated executive summary", "Identify what still needs human validation"],
    sections: [],
    widgets: ["capstone"],
    levelNotes: {
      beginner: ["Follow the 8 steps in order — click 'Open in Sandbox' for each prompt.", "It's fine if AI gets something wrong. Spotting it IS the skill."],
      intermediate: ["Time-box: 1 minute per step. Aim for a report you could send to your manager today.", "Add one chart you'd build differently from AI's choice and explain why."],
      advanced: ["Look at the agent trace: how many Planner retries? Which claims did the Validator flag? Could you add a node to improve it?"],
    },
    trainerNotes: ["Everyone uses the same Org 360 dataset — but each function asks different questions. Highlight the variety in the debrief.", "Close with: 'What will you do differently on Monday?'"],
    quiz: [],
  },
];

/* --------------------------------------------------------------------------------------------- */

export interface FunctionUseCase {
  id: FunctionId;
  name: string;
  emoji: string;
  color: string;
  persona: string;
  dataset: string[];
  analyses: string[];
  prompt: string;
  before: { title: string; steps: string[]; time: string };
  after: { title: string; steps: string[]; time: string };
  chart: string;
  caution?: string;
}

export const FUNCTIONS: FunctionUseCase[] = [
  {
    id: "ld",
    name: "L&D",
    emoji: "🎓",
    color: "from-fuchsia-500 to-pink-500",
    persona: "Kavya, L&D Manager",
    dataset: ["Employee", "Department", "Course", "Training hours", "Completion", "Assessment score", "Training cost", "Feedback score"],
    analyses: ["Training completion analysis", "Training effectiveness", "Skill-gap identification", "Department-wise participation", "Cost per learner", "High/low-performing programs", "Learning ROI analysis"],
    prompt: "Analyze training effectiveness by department and identify programs that have high participation but low assessment scores.",
    before: { title: "Quarterly L&D review — the old way", steps: ["Export LMS report to Excel", "VLOOKUP departments from HRMS", "Build 4 pivots by hand", "Spot-check scores", "Write PPT commentary"], time: "~1.5 days" },
    after: { title: "With AI", steps: ["Upload masked LMS export", "Ask the question above", "AI flags 'Data Analytics 101': most enrolments, lowest scores", "Validate with pivot", "Draft summary generated"], time: "~45 minutes" },
    chart: "Scatter: participation vs average score per course; bar: completion % by department",
  },
  {
    id: "hr",
    name: "HR",
    emoji: "🧑‍🤝‍🧑",
    color: "from-sky-500 to-indigo-500",
    persona: "Rahul, HR Business Partner",
    dataset: ["Employee demographics", "Department", "Tenure", "Salary", "Performance", "Leave", "Attrition"],
    analyses: ["Attrition trends", "Department-wise workforce analysis", "Tenure analysis", "Compensation analysis", "Absenteeism patterns", "Employee segmentation"],
    prompt: "Analyze employee attrition by department and tenure. Identify patterns that HR should investigate further.",
    before: { title: "Attrition deep-dive for leadership", steps: ["Pull exits from HRMS", "Manually bucket tenure", "COUNTIFS for each department × band", "Try to remember last quarter's numbers", "Board slide at midnight"], time: "~2 days" },
    after: { title: "With AI", steps: ["Mask names/emails/salary (one click)", "Ask the attrition prompt", "AI surfaces: Sales < 2 yrs tenure and Engineering high performers leaving", "Validate & add context from exit interviews", "Board-ready summary"], time: "~1 hour" },
    chart: "Stacked bar: exits by department × tenure band; line: monthly exits",
    caution: "HR data is highly sensitive. Mask PII and band salaries before using any AI tool; use only approved enterprise AI.",
  },
  {
    id: "recruitment",
    name: "Recruitment",
    emoji: "🧲",
    color: "from-violet-500 to-purple-600",
    persona: "Sneha, Talent Acquisition Lead",
    dataset: ["Job role", "Candidate source", "Applications", "Screening", "Interviews", "Offers", "Joining", "Time-to-hire"],
    analyses: ["Recruitment funnel", "Source effectiveness", "Conversion rates", "Time-to-hire", "Drop-off analysis", "Hiring cost analysis"],
    prompt: "Analyze the recruitment funnel and identify where candidates are dropping out most frequently.",
    before: { title: "Monthly hiring MIS", steps: ["Collect trackers from 6 recruiters", "Reconcile source names", "Calculate stage conversions", "Build funnel chart", "Explain delays"], time: "~1 day / month" },
    after: { title: "With AI", steps: ["Combine trackers", "AI standardises 'linkedin'/'LinkedIn'", "Ask the funnel prompt", "AI flags Software Engineer interview → offer leak and agency cost", "Share summary"], time: "~30 minutes" },
    chart: "Funnel: Applications → Joined; bar: cost per hire by source",
  },
  {
    id: "procurement",
    name: "Procurement",
    emoji: "📦",
    color: "from-amber-500 to-orange-600",
    persona: "Arjun, Category Manager",
    dataset: ["Vendor", "Category", "Purchase order", "Quantity", "Unit price", "Total amount", "Date", "Payment status"],
    analyses: ["Vendor spend analysis", "Category-wise expenditure", "Price variation", "Purchase trends", "Vendor concentration", "Duplicate/suspicious transactions"],
    prompt: "Identify vendors with significant price increases compared with previous purchases.",
    before: { title: "Vendor price review", steps: ["Export 12 months of POs", "Fix vendor name variants by hand", "Sort by item, compare prices line by line", "Miss the duplicate payment", "Negotiate without data"], time: "~3 days" },
    after: { title: "With AI", steps: ["Clean names & dates with AI", "Ask the price-increase prompt", "AI: Apex Supplies +19% since April; duplicate POs flagged", "Verify contracts", "Walk into negotiation with evidence"], time: "~1 hour" },
    chart: "Bar: price change % by vendor-item; Pareto: vendor share of spend",
  },
  {
    id: "finance",
    name: "Finance",
    emoji: "💹",
    color: "from-emerald-500 to-teal-600",
    persona: "Meera, FP&A Manager",
    dataset: ["Revenue", "Expenses", "Budget", "Actuals", "Department", "Cost center", "Month"],
    analyses: ["Budget vs actual", "Variance analysis", "Expense trends", "Cost-center analysis", "Revenue trends", "Forecasting scenarios"],
    prompt: "Compare budget versus actual expenditure by department and highlight the five largest variances.",
    before: { title: "Month-end variance commentary", steps: ["Download GL & budget", "SUMIFS by cost centre", "Rank variances", "Chase department heads for reasons", "Write commentary"], time: "~2 days each month-end" },
    after: { title: "With AI", steps: ["Load budget vs actuals", "Ask the variance prompt", "AI ranks: Marketing events +40% in Q3, IT software creep", "Department heads confirm causes", "Commentary drafted"], time: "~2 hours" },
    chart: "Clustered bar: budget vs actual by department; waterfall: variance bridge",
  },
  {
    id: "admin",
    name: "Administration",
    emoji: "🏢",
    color: "from-cyan-500 to-blue-600",
    persona: "Sunil, Admin & Facilities Head",
    dataset: ["Facilities", "Maintenance", "Utilities", "Travel", "Assets", "Vendors", "Administrative expenses"],
    analyses: ["Monthly expenditure", "Vendor analysis", "Cost trends", "Asset utilization", "Facility expenses", "Recurring expenditure"],
    prompt: "Show monthly administrative expenditure by expense type and highlight unusual months.",
    before: { title: "Admin cost review", steps: ["Collect invoices from 4 sites", "Key into Excel", "Monthly pivot", "Guess why utilities spiked", "Miss the duplicate invoice"], time: "~1.5 days" },
    after: { title: "With AI", steps: ["Upload invoice register", "Ask the monthly-trend prompt", "AI: Chennai HQ utilities +55% Apr–Jun (cooling), travel +35% from July, duplicate invoice flagged", "Plan HVAC audit", "Report"], time: "~40 minutes" },
    chart: "Stacked column: monthly spend by type; heat map: location × type",
  },
  {
    id: "ir",
    name: "Investor Relations",
    emoji: "📈",
    color: "from-rose-500 to-red-600",
    persona: "Vikram, IR Lead",
    dataset: ["Revenue", "EBITDA", "EPS", "Business segments", "Geographic performance", "Quarterly results", "Investor metrics"],
    analyses: ["Quarter-on-quarter analysis", "Year-over-year analysis", "Segment performance", "KPI trends", "Management reporting", "Investor-facing data summaries"],
    prompt: "Analyze the quarterly performance and identify the major changes in revenue, profitability, and segment contribution.",
    before: { title: "Earnings-call prep", steps: ["Assemble segment/geo data", "Compute QoQ & YoY by hand", "Build margin tables", "Anticipate analyst questions", "Draft talking points"], time: "~1 week" },
    after: { title: "With AI (on published or approved data)", steps: ["Load segment results", "Ask the quarterly prompt", "AI: Products & Platforms fastest-growing, Europe softness, Consulting margin compression", "Finance validates every number", "Draft Q&A prep"], time: "~1 day" },
    chart: "Line: revenue by segment; stacked bar: geography mix; bar: EBITDA margin",
    caution: "Unpublished results are material non-public information (MNPI). Never use them in non-approved AI tools.",
  },
  {
    id: "legal",
    name: "Legal",
    emoji: "⚖️",
    color: "from-slate-500 to-indigo-600",
    persona: "Anitha, Legal Counsel",
    dataset: ["Contracts", "Contract value", "Vendor", "Renewal date", "Contract type", "Risk category", "Status"],
    analyses: ["Contract portfolio analysis", "Renewal tracking", "Contract value analysis", "Risk categorization", "Expiry analysis", "Clause/category classification"],
    prompt: "Group contracts by risk category and identify contracts approaching renewal.",
    before: { title: "Renewal tracking", steps: ["Maintain register in Excel", "Filter dates by hand each month", "Miss an auto-renewal", "Scramble with the business"], time: "~4 hours / month + risk of misses" },
    after: { title: "With AI", steps: ["Load register (metadata only)", "Ask the renewal prompt", "AI lists 5 high-risk contracts renewing in < 60 days (some auto-renew)", "Counsel reviews each", "Owners notified"], time: "~20 minutes" },
    chart: "Heat map: risk × contract type; timeline table: upcoming renewals",
    caution: "Legal analysis should support human review rather than replace legal judgment.",
  },
];

/* --------------------------------------------------------------------------------------------- */

export interface IndustryStory {
  industry: string;
  emoji: string;
  color: string;
  role: string;
  problem: string;
  ai: string;
  techniques: string[];
  impact: string[];
  prompt: string;
}

export const INDUSTRY_STORIES: IndustryStory[] = [
  {
    industry: "Manufacturing",
    emoji: "🏭",
    color: "from-orange-500 to-amber-500",
    role: "Plant Finance Controller",
    problem: "Scrap cost overshot budget for 3 months; 40 production lines, 6 shifts — nobody could say where.",
    ai: "Loaded MES scrap logs + cost sheet. Asked AI to decompose variance by line × shift × material and flag step-changes. Found one line's scrap doubled after a die change on night shift.",
    techniques: ["Variance analysis", "Crosstab heat map", "Change-point/trend", "Root-cause questions"],
    impact: ["Root cause found in 1 afternoon instead of a 2-week audit", "Maintenance SOP updated for die changes"],
    prompt: "Break down scrap cost variance by production line and shift. When did it change, and where?",
  },
  {
    industry: "Banking & Financial Services",
    emoji: "🏦",
    color: "from-blue-600 to-indigo-600",
    role: "Branch Operations Analyst",
    problem: "Thousands of daily vendor payments; auditors found duplicate payments only after quarter close.",
    ai: "AI-assisted duplicate detection on vendor + amount + date (± 3 days) + fuzzy invoice number, run weekly. Flags go to a human checker before payment release.",
    techniques: ["Duplicate detection", "Fuzzy matching", "Outlier detection", "Human-in-the-loop approval"],
    impact: ["Duplicates caught before payment, not after", "Audit observations closed"],
    prompt: "Find potential duplicate payments: same vendor, same amount, dates within 3 days, similar invoice numbers.",
  },
  {
    industry: "Retail & FMCG",
    emoji: "🛒",
    color: "from-pink-500 to-rose-500",
    role: "Category Manager",
    problem: "Promotions everywhere, but which ones actually lifted sales vs just pulled demand forward?",
    ai: "AI compared promo weeks vs baseline and post-promo dip by SKU and region, then segmented promos into 'true lift', 'pull-forward' and 'loss-making'.",
    techniques: ["Segmentation", "Comparative analysis", "What-if (discount %)", "Management summary"],
    impact: ["Promo calendar rebuilt around the top-performing mechanics", "Clear stop-list for loss-making promos"],
    prompt: "For each promotion, compare sales during, before and after. Segment promos into true lift, pull-forward and loss-making.",
  },
  {
    industry: "Healthcare & Hospitals",
    emoji: "🏥",
    color: "from-teal-500 to-emerald-500",
    role: "Hospital Admin Manager",
    problem: "Nursing overtime cost rising; staff burnout complaints; rosters built by hand.",
    ai: "On de-identified roster & census data, AI showed overtime clustered on Monday night shifts in 2 wards where admissions peak — a staffing-mix problem, not headcount.",
    techniques: ["Trend analysis", "Crosstab (ward × shift)", "Correlation (census vs overtime)", "Privacy masking"],
    impact: ["Roster rebalanced without new hires", "Overtime reduction target set with ward heads"],
    prompt: "Analyze overtime hours by ward, weekday and shift and relate them to patient census. Where is overtime structural?",
  },
  {
    industry: "IT Services",
    emoji: "💻",
    color: "from-violet-500 to-purple-600",
    role: "Delivery Excellence Lead",
    problem: "Bench costs high while projects complain of unfilled roles — skills data spread across 5 sheets.",
    ai: "AI merged skills, bench and demand sheets, standardised 300 skill spellings, and matched bench talent to open demand; L&D got a skill-gap list for upskilling.",
    techniques: ["Data cleaning / entity resolution", "Classification", "Skill-gap analysis", "Report generation"],
    impact: ["Faster bench-to-billable matching", "Targeted upskilling instead of generic courses"],
    prompt: "Standardise the skill names, then match bench employees to open demand and list skills gaps by count.",
  },
  {
    industry: "Logistics & Supply Chain",
    emoji: "🚚",
    color: "from-cyan-500 to-sky-600",
    role: "Procurement Analyst",
    problem: "Freight rates crept up across 20 transporters; contracts said rates were fixed.",
    ai: "AI compared invoiced rates with contracted rates by lane and month — flagged three transporters billing 8–12% above contract since a fuel-surcharge clause change.",
    techniques: ["Price change analysis", "Contract vs actual comparison", "Outlier detection"],
    impact: ["Recovery claims raised with evidence", "Monthly automated rate check"],
    prompt: "Compare invoiced freight rate vs contracted rate by transporter and lane. Who is billing above contract and since when?",
  },
  {
    industry: "Pharma & Life Sciences",
    emoji: "💊",
    color: "from-lime-500 to-green-600",
    role: "Compliance Training Manager",
    problem: "GMP training must be 100% complete before audits; tracking across 4 plants was manual.",
    ai: "AI built a completion dashboard by plant/role/course, predicted who would miss the deadline from progress pace, and drafted reminder emails for managers.",
    techniques: ["Completion analysis", "Forecasting (run-rate)", "Report generation"],
    impact: ["Audit-ready completion visibility weekly", "Manager nudges targeted to at-risk teams"],
    prompt: "Show GMP training completion by plant and role, and predict who will not complete by the audit date at current pace.",
  },
  {
    industry: "Energy & Utilities",
    emoji: "⚡",
    color: "from-yellow-400 to-orange-500",
    role: "Facilities & Energy Manager",
    problem: "Electricity bills across 30 sites with no idea which sites were inefficient.",
    ai: "AI normalised consumption per sq. ft and per degree-day, ranked sites, and spotted 4 sites with weekend consumption close to weekday levels (HVAC left on).",
    techniques: ["Normalisation", "Comparative analysis", "Anomaly detection", "What-if savings"],
    impact: ["Weekend HVAC schedules fixed", "Savings case quantified for retrofit budget"],
    prompt: "Normalise electricity use per sq ft by site, compare weekday vs weekend, and flag sites with abnormal weekend usage.",
  },
];

/* --------------------------------------------------------------------------------------------- */

export interface Resource {
  title: string;
  url: string;
  type: "Docs" | "Course" | "Tool" | "Guide" | "Book" | "Dataset" | "Video";
  level: Audience | "all";
  desc: string;
}

export const RESOURCE_GROUPS: { group: string; emoji: string; items: Resource[] }[] = [
  {
    group: "Agentic AI & LLM Engineering",
    emoji: "🤖",
    items: [
      { title: "LangGraph (JS) documentation", url: "https://langchain-ai.github.io/langgraphjs/", type: "Docs", level: "advanced", desc: "Build stateful multi-agent graphs — the framework behind this app's analysis agent." },
      { title: "LangGraph (Python) documentation", url: "https://langchain-ai.github.io/langgraph/", type: "Docs", level: "advanced", desc: "Same concepts in Python: nodes, edges, conditional routing, human-in-the-loop." },
      { title: "LangChain Academy — Intro to LangGraph", url: "https://academy.langchain.com/", type: "Course", level: "advanced", desc: "Free course on agent graphs, memory and human-in-the-loop." },
      { title: "Anthropic — Building effective agents", url: "https://www.anthropic.com/research/building-effective-agents", type: "Guide", level: "advanced", desc: "Patterns: prompt chaining, routing, evaluator-optimizer — all used in this app." },
      { title: "Groq Console & API keys", url: "https://console.groq.com/keys", type: "Tool", level: "all", desc: "Create your own key for the BYOK assistant." },
      { title: "Groq API documentation", url: "https://console.groq.com/docs/overview", type: "Docs", level: "advanced", desc: "Models, JSON mode, tool use, rate limits." },
      { title: "Next.js documentation", url: "https://nextjs.org/docs", type: "Docs", level: "advanced", desc: "App Router, route handlers & streaming — how this app is built." },
    ],
  },
  {
    group: "Data Analysis Foundations",
    emoji: "📊",
    items: [
      { title: "Google Data Analytics Certificate", url: "https://www.coursera.org/professional-certificates/google-data-analytics", type: "Course", level: "beginner", desc: "Ask → Prepare → Process → Analyze → Share → Act, with spreadsheets & SQL." },
      { title: "Khan Academy — Statistics & Probability", url: "https://www.khanacademy.org/math/statistics-probability", type: "Course", level: "beginner", desc: "Mean, median, variance, correlation explained simply." },
      { title: "Microsoft Excel — PivotTables", url: "https://support.microsoft.com/en-us/excel", type: "Docs", level: "intermediate", desc: "Your validation tool: rebuild AI numbers with a pivot." },
      { title: "Power Query documentation", url: "https://learn.microsoft.com/en-us/power-query/", type: "Docs", level: "intermediate", desc: "Repeatable cleaning steps for monthly files." },
      { title: "pandas — Getting started", url: "https://pandas.pydata.org/docs/getting_started/index.html", type: "Docs", level: "advanced", desc: "Python data analysis library used by most AI code interpreters." },
      { title: "Kaggle Learn — Pandas & Data Cleaning", url: "https://www.kaggle.com/learn", type: "Course", level: "intermediate", desc: "Short, hands-on micro-courses with notebooks." },
      { title: "Kaggle Datasets", url: "https://www.kaggle.com/datasets", type: "Dataset", level: "all", desc: "Practice data for HR attrition, sales, procurement and more." },
    ],
  },
  {
    group: "Visualization & Storytelling",
    emoji: "🎨",
    items: [
      { title: "Storytelling with Data (Cole Nussbaumer Knaflic)", url: "https://www.storytellingwithdata.com/", type: "Book", level: "all", desc: "The classic on choosing and decluttering business charts." },
      { title: "Financial Times Visual Vocabulary", url: "https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary", type: "Guide", level: "intermediate", desc: "Which chart for which question — a poster-sized chart chooser." },
      { title: "Data Viz Project", url: "https://datavizproject.com/", type: "Guide", level: "all", desc: "Catalogue of chart types with use cases." },
      { title: "Microsoft Power BI Learn", url: "https://learn.microsoft.com/en-us/training/powerplatform/power-bi", type: "Course", level: "intermediate", desc: "Free learning paths for dashboards and Copilot in Power BI." },
      { title: "Recharts", url: "https://recharts.org/", type: "Tool", level: "advanced", desc: "React charting library used in this app." },
    ],
  },
  {
    group: "Prompting & Responsible AI",
    emoji: "🛡️",
    items: [
      { title: "Anthropic prompt engineering guide", url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview", type: "Guide", level: "intermediate", desc: "Clear instructions, examples, structured output." },
      { title: "OpenAI prompt engineering guide", url: "https://platform.openai.com/docs/guides/prompt-engineering", type: "Guide", level: "intermediate", desc: "Strategies for reliable outputs." },
      { title: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", type: "Guide", level: "all", desc: "Govern, map, measure, manage AI risk." },
      { title: "India DPDP Act 2023 (MeitY)", url: "https://www.meity.gov.in/data-protection-framework", type: "Guide", level: "all", desc: "Personal data obligations for Indian organisations." },
      { title: "OWASP Top 10 for LLM Applications", url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/", type: "Guide", level: "advanced", desc: "Prompt injection, data leakage and other LLM risks." },
    ],
  },
];

export const GLOSSARY: { term: string; def: string }[] = [
  { term: "Agent", def: "An AI system that plans steps, calls tools and decides what to do next to reach a goal." },
  { term: "Agentic workflow", def: "Multiple specialised AI steps (plan, compute, critique, report) connected in a graph with feedback loops." },
  { term: "BYOK", def: "Bring Your Own Key — you supply your own API key; usage is billed to your account and the app stores nothing server-side." },
  { term: "Dimension", def: "A column you group or filter by (Department, Vendor, Month)." },
  { term: "Measure", def: "A numeric column you aggregate (Amount, Hours, Score)." },
  { term: "Grain", def: "What one row represents (one PO, one employee-month)." },
  { term: "Hallucination", def: "Confident AI output that is not supported by the data." },
  { term: "Grounding", def: "Tying every AI claim to a source — here, to computed result tables." },
  { term: "IQR", def: "Interquartile range (Q3 − Q1). Values beyond Q3 + 1.5×IQR are typical outlier candidates." },
  { term: "Median", def: "Middle value when sorted — robust to outliers." },
  { term: "Variance (finance)", def: "Actual − Budget. Not the same as statistical variance!" },
  { term: "Variance (statistics)", def: "Average squared distance from the mean — a measure of spread." },
  { term: "Pearson r", def: "Correlation coefficient from −1 to +1. Does not prove causation." },
  { term: "YoY / QoQ / MoM", def: "Year-over-year / quarter-on-quarter / month-on-month comparison." },
  { term: "Pareto (80/20)", def: "A few items (vendors, categories) usually account for most of the total." },
  { term: "Funnel conversion", def: "Share of items moving from one stage to the next." },
  { term: "PII", def: "Personally identifiable information: names, emails, phone, IDs." },
  { term: "MNPI", def: "Material non-public information — e.g. unreleased results. Strictly controlled." },
  { term: "Pseudonymisation", def: "Replacing identifiers with consistent codes (Person-0012) so analysis still works." },
  { term: "LangGraph", def: "A framework for building stateful, multi-step LLM agents as graphs of nodes and edges." },
  { term: "Groq", def: "An inference provider running open models (Llama, Qwen, GPT-OSS) at very high speed on LPUs." },
  { term: "JSON mode", def: "Asking the model to reply only with valid JSON so code can use the answer reliably." },
];

export const PROMPT_LIBRARY: { cat: string; prompts: string[] }[] = [
  {
    cat: "Understand",
    prompts: [
      "Describe this dataset: what one row represents, the period covered, the dimensions and measures, and any data-quality issues.",
      "What are the 5 most important questions management should ask of this dataset?",
      "Which columns would you need to answer: <business question>? What's missing?",
    ],
  },
  {
    cat: "Clean",
    prompts: [
      "List all spelling variants in the Department and Vendor columns and propose a standard name for each.",
      "Find exact duplicates and probable duplicates (same vendor, amount and date). Show the rows; do not delete anything.",
      "Which values look impossible or suspicious? Explain the rule you used for each.",
    ],
  },
  {
    cat: "Analyze",
    prompts: [
      "Give me the top 10 categories by expenditure with share of total and cumulative share.",
      "Compare this month's performance with last month and the same month last year. Explain the biggest movers.",
      "Show the trend by month and highlight any month that is more than 2 standard deviations from average.",
    ],
  },
  {
    cat: "Validate",
    prompts: [
      "For every number in your answer, show the formula and the rows/filters used so I can recalculate it in Excel.",
      "What assumptions did you make about the columns and dates? Which ones could change the conclusion?",
      "Argue against your own conclusion: what alternative explanations fit the same data?",
    ],
  },
  {
    cat: "Report",
    prompts: [
      "Write a management summary: 3-line executive summary, key findings with numbers, business implications, risks, recommended questions, action items with owners.",
      "Recommend the best 2 charts for this analysis and the exact title each chart should have.",
      "Rewrite this summary for a CFO who has 30 seconds.",
    ],
  },
];

export const WORKFLOW = [
  { step: "Data", d: "Gather the right extract; know the source and grain.", icon: "Database" },
  { step: "Clean", d: "Fix names, dates, duplicates; flag suspicious values.", icon: "Eraser" },
  { step: "Understand", d: "Ask AI to describe columns, period, quality.", icon: "BookOpen" },
  { step: "Ask", d: "Frame a precise business question.", icon: "MessageCircleQuestion" },
  { step: "Analyze", d: "Aggregate, compare, trend, segment.", icon: "Calculator" },
  { step: "Visualize", d: "Pick the chart that matches the question.", icon: "BarChart3" },
  { step: "Interpret", d: "What does it mean for the business?", icon: "Lightbulb" },
  { step: "Validate", d: "Recalculate, cross-check, sanity-check.", icon: "ShieldCheck" },
  { step: "Report", d: "Executive summary + actions + owners.", icon: "FileText" },
];

export const CAPSTONE_STEPS = [
  { n: 1, t: "Understand the dataset", prompt: "What does this dataset contain? Describe the grain, period, dimensions, measures and data-quality issues." },
  { n: 2, t: "Clean and prepare the data", prompt: "", action: "clean" },
  { n: 3, t: "Ask five business questions", prompt: "What are five business questions the {fn} function should ask of this dataset?" },
  { n: 4, t: "Generate key metrics", prompt: "Calculate the key {fn} metrics by department: totals, averages and rates that matter most." },
  { n: 5, t: "Identify trends and anomalies", prompt: "Show the monthly trends relevant to {fn} and flag any anomalies or unusual months by department." },
  { n: 6, t: "Create 2–3 visualizations", prompt: "Create the 2-3 most useful charts for {fn} leadership from this dataset." },
  { n: 7, t: "Generate an executive summary", prompt: "Write an executive summary for the {fn} head based on this dataset, with key findings, risks and action items." },
  { n: 8, t: "Identify what needs human validation", prompt: "", action: "validate" },
];

export const SAMPLE_PII_TEXT = `Exit interview notes — Q2
Priya Iyer (priya.iyer@acmecorp.example, +91 9845012345) resigned citing workload. CTC 18.5 LPA.
Bank a/c 001234567890 IFSC HDFC0001234 for full & final settlement.
PAN ABCDE1234F, Aadhaar 2345 6789 0123.
Card on file 4111 1111 1111 1111. Manager: Rohan Mehta.`;

export const HALLUCINATION_CLAIMS = [
  { claim: "Total procurement spend was ₹4.27 Cr, up 31% year-on-year.", verdict: "unsupported", why: "The dataset covers only 12 months — a YoY comparison is impossible. Typical invented number." },
  { claim: "Attrition rose because the new Sales manager joined in April.", verdict: "unsupported", why: "There is no manager data. Plausible story, zero evidence — an unsupported conclusion." },
  { claim: "'Variance' column shows Engineering has the most volatile spend.", verdict: "misread", why: "Finance 'Variance' = Actual − Budget, not statistical volatility. Misinterpreted column." },
  { claim: "Training hours strongly cause higher assessment scores (r = 0.21).", verdict: "misread", why: "r = 0.21 is weak, and correlation does not prove causation. Incorrect correlation claim." },
  { claim: "Apex Supplies' average unit price after Apr 2026 is higher than before — see price_change table.", verdict: "grounded", why: "Directly supported by a computed table with a stated formula." },
  { claim: "Company EPS for FY27 Q2 is ₹640 (sum of the EPS column).", verdict: "calc", why: "EPS repeats on all 16 rows of the quarter; summing it multiplies EPS by 16. Incorrect calculation." },
];
