export type Cell = string | number | null;
export type Row = Record<string, Cell>;

export type FunctionId =
  | "ld"
  | "hr"
  | "recruitment"
  | "procurement"
  | "finance"
  | "admin"
  | "ir"
  | "legal"
  | "capstone";

export interface Dataset {
  id: FunctionId;
  name: string;
  file: string;
  func: string;
  description: string;
  columns: string[];
  rows: Row[];
  /** What was deliberately planted in the data, so trainers can check AI output. */
  plantedIssues: string[];
  plantedInsights: string[];
  prompts: string[];
}

export type ColumnKind = "numeric" | "categorical" | "date" | "text" | "id";

export interface ColumnProfile {
  name: string;
  kind: ColumnKind;
  missing: number;
  unique: number;
  sample: string[];
  top?: { value: string; count: number }[];
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  std?: number;
  sum?: number;
  outliers?: number;
  dateMin?: string;
  dateMax?: string;
  mixedDateFormats?: boolean;
  variantGroups?: string[][];
  piiRisk?: string;
}

export interface Profile {
  rowCount: number;
  columnCount: number;
  duplicateRows: number;
  columns: ColumnProfile[];
}

export type Agg = "sum" | "avg" | "count" | "min" | "max" | "median" | "distinct";

export interface FilterSpec {
  column: string;
  op: "=" | "!=" | ">" | "<" | ">=" | "<=" | "contains" | "in";
  value: string | number | (string | number)[];
}

export type ChartType = "bar" | "line" | "pie" | "scatter" | "funnel" | "table" | "heatmap" | "stacked" | "waterfall";

export interface ChartSpec {
  type: ChartType;
  x?: string;
  y?: string[];
}

export interface OpSpec {
  id: string;
  op: string;
  title: string;
  params: Record<string, unknown>;
  chart?: ChartSpec;
  why?: string;
}

export interface OpResult {
  id: string;
  op: string;
  title: string;
  columns: string[];
  rows: Row[];
  chart: ChartSpec;
  note?: string;
  formula?: string;
  error?: string;
}

export interface Insight {
  text: string;
  evidence?: string;
  grounded?: boolean;
  unmatched?: string[];
}

export interface Insights {
  headline: string;
  observations: Insight[];
  trends: string[];
  anomalies: string[];
  management_questions: string[];
  human_validation: string[];
  caveats: string[];
}

export interface Validation {
  groundedCount: number;
  total: number;
  score: number;
  checks: { label: string; status: "pass" | "warn" | "fail"; detail: string }[];
}

export type Audience = "beginner" | "intermediate" | "advanced";
