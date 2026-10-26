import type { Audience } from "./types";

export const AUDIENCES: { id: Audience; label: string; short: string; who: string; emoji: string }[] = [
  { id: "beginner", label: "Business User", short: "Beginner", who: "Managers & executives who use Excel occasionally and want answers, not code.", emoji: "🌱" },
  { id: "intermediate", label: "Analyst / Power User", short: "Intermediate", who: "People who live in Excel, pivots and dashboards and want to go faster.", emoji: "🚀" },
  { id: "advanced", label: "Technical / Builder", short: "Advanced", who: "Analysts & engineers who want to build AI-powered analysis pipelines.", emoji: "🛠️" },
];

export const AUDIENCE_STYLE: Record<Audience, string> = {
  beginner: "Business user with no statistics background. Use plain language, avoid jargon, explain any metric in one short phrase, focus on decisions and actions.",
  intermediate: "Analyst comfortable with Excel/pivots. Use standard business-analysis terms (variance, conversion rate, YoY), mention how to reproduce in Excel where useful.",
  advanced: "Technical analyst / builder. Be precise, mention methods (IQR, Pearson r, linear trend), statistical caveats, and how to automate or productionise the analysis.",
};
