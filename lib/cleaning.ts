import type { Row } from "./types";
import { findVariantGroups, inferKind, isMissing, parseDate, quantile, toNumber } from "./profile";

export interface CleanLog {
  step: string;
  changed: number;
  details: string[];
}

export interface CleanResult {
  rows: Row[];
  columns: string[];
  log: CleanLog;
}

const titleCase = (s: string) => s.replace(/\w\S*/g, (w) => (w.length <= 3 && w === w.toUpperCase() ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()));

export function trimSpaces(rows: Row[], columns: string[]): CleanResult {
  let changed = 0;
  const out = rows.map((r) => {
    const o: Row = { ...r };
    for (const c of columns) {
      const v = r[c];
      if (typeof v === "string") {
        const t = v.trim().replace(/\s+/g, " ");
        if (t !== v) {
          o[c] = t;
          changed++;
        }
      }
    }
    return o;
  });
  return { rows: out, columns, log: { step: "Trim extra spaces", changed, details: [`${changed} cell(s) had leading/trailing or double spaces`] } };
}

/** Auto-detect spelling variants and map each group to its most frequent spelling. */
export function autoMappings(rows: Row[], columns: string[]) {
  const mappings: Record<string, Record<string, string>> = {};
  for (const c of columns) {
    const vals = rows.map((r) => r[c]);
    if (inferKind(c, vals) !== "categorical") continue;
    const counts = new Map<string, number>();
    vals.forEach((v) => !isMissing(v) && counts.set(String(v), (counts.get(String(v)) ?? 0) + 1));
    const groups = findVariantGroups(Array.from(counts.keys()));
    for (const g of groups) {
      const canonical = g.slice().sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))[0];
      for (const v of g) if (v !== canonical) (mappings[c] ??= {})[v] = canonical.trim();
    }
  }
  return mappings;
}

export function applyMappings(rows: Row[], columns: string[], mappings: Record<string, Record<string, string>>, label = "Standardize names & categories"): CleanResult {
  let changed = 0;
  const details: string[] = [];
  const counts: Record<string, number> = {};
  const out = rows.map((r) => {
    const o: Row = { ...r };
    for (const [col, map] of Object.entries(mappings)) {
      const v = r[col];
      if (v === null || v === undefined) continue;
      const to = map[String(v)];
      if (to !== undefined && to !== v) {
        o[col] = to;
        changed++;
        const k = `${col}: "${v}" → "${to}"`;
        counts[k] = (counts[k] ?? 0) + 1;
      }
    }
    return o;
  });
  for (const [k, n] of Object.entries(counts)) details.push(`${k} (${n})`);
  if (!details.length) details.push("No variants found");
  return { rows: out, columns, log: { step: label, changed, details } };
}

export function normalizeDates(rows: Row[], columns: string[]): CleanResult {
  let changed = 0;
  const details: string[] = [];
  const dateCols = columns.filter((c) => inferKind(c, rows.map((r) => r[c])) === "date");
  const out = rows.map((r) => ({ ...r }));
  for (const c of dateCols) {
    const isMonthCol = rows.every((r) => isMissing(r[c]) || /^\d{4}-\d{2}$/.test(String(r[c])));
    if (isMonthCol) continue;
    let n = 0;
    out.forEach((r) => {
      const v = r[c];
      if (isMissing(v)) return;
      const iso = parseDate(v);
      if (iso && iso !== v) {
        r[c] = iso;
        n++;
      }
    });
    if (n) details.push(`${c}: ${n} value(s) converted to YYYY-MM-DD (dd/mm/yyyy assumed for slash dates — verify!)`);
    changed += n;
  }
  if (!details.length) details.push("All dates already consistent");
  return { rows: out, columns, log: { step: "Normalize date formats", changed, details } };
}

export function coerceNumbers(rows: Row[], columns: string[]): CleanResult {
  let changed = 0;
  const out = rows.map((r) => ({ ...r }));
  for (const c of columns) {
    if (inferKind(c, rows.map((r) => r[c])) !== "numeric") continue;
    out.forEach((r) => {
      const v = r[c];
      if (typeof v === "string") {
        r[c] = toNumber(v);
        changed++;
      }
    });
  }
  return { rows: out, columns, log: { step: "Convert text numbers to numeric", changed, details: [`${changed} text value(s) converted (₹, commas, % stripped)`] } };
}

export function removeDuplicates(rows: Row[], columns: string[]): CleanResult {
  const seen = new Set<string>();
  const out: Row[] = [];
  const removed: string[] = [];
  for (const r of rows) {
    const k = JSON.stringify(columns.map((c) => r[c]));
    if (seen.has(k)) {
      removed.push(String(r[columns[0]]));
      continue;
    }
    seen.add(k);
    out.push(r);
  }
  return {
    rows: out,
    columns,
    log: { step: "Remove exact duplicate rows", changed: removed.length, details: removed.length ? [`Removed ${removed.length}: ${removed.slice(0, 8).join(", ")}`] : ["No exact duplicates"] },
  };
}

export function fillMissing(rows: Row[], columns: string[]): CleanResult {
  const details: string[] = [];
  let changed = 0;
  const out = rows.map((r) => ({ ...r }));
  for (const c of columns) {
    const vals = rows.map((r) => r[c]);
    const kind = inferKind(c, vals);
    const missing = vals.filter(isMissing).length;
    if (!missing) continue;
    if (kind === "categorical" || kind === "text") {
      out.forEach((r) => {
        if (isMissing(r[c])) {
          r[c] = "Unknown";
          changed++;
        }
      });
      details.push(`${c}: ${missing} blank(s) → "Unknown"`);
    } else {
      details.push(`${c}: ${missing} blank(s) left empty on purpose — numbers are not guessed (decide with business owner)`);
    }
  }
  if (!details.length) details.push("No missing values");
  return { rows: out, columns, log: { step: "Handle missing values", changed, details } };
}

const FLAG = "⚠ Data Flag";

export function flagSuspicious(rows: Row[], columns: string[]): CleanResult {
  const flags: string[][] = rows.map(() => []);
  const details: string[] = [];
  const numCols = columns.filter((c) => c !== FLAG && inferKind(c, rows.map((r) => r[c])) === "numeric");
  for (const c of numCols) {
    const nums = rows.map((r) => toNumber(r[c]));
    const sorted = (nums.filter((x) => x !== null) as number[]).sort((a, b) => a - b);
    const q1 = quantile(sorted, 0.25);
    const q3 = quantile(sorted, 0.75);
    const iqr = q3 - q1;
    // When many points fall outside 3×IQR the column mixes populations (laptops vs paper); a global rule would just flag noise.
    const mixedScale = iqr > 0 && sorted.filter((x) => x > q3 + 3 * iqr || x < q1 - 3 * iqr).length > sorted.length * 0.05;
    let n = 0;
    nums.forEach((x, i) => {
      if (x === null) return;
      if (/score|%|rating/i.test(c) && !/feedback/i.test(c) && (x > 100 || x < 0)) {
        flags[i].push(`${c}=${x} outside 0–100`);
        n++;
      } else if (/\bage\b/i.test(c) && (x < 16 || x > 80)) {
        flags[i].push(`${c}=${x} implausible`);
        n++;
      } else if (/time to hire|days/i.test(c) && x > 180) {
        flags[i].push(`${c}=${x} unusually long`);
        n++;
      } else if (!mixedScale && iqr > 0 && (x > q3 + 3 * iqr || x < q1 - 3 * iqr)) {
        flags[i].push(`${c}=${x.toLocaleString("en-IN")} extreme outlier`);
        n++;
      }
    });
    if (n) details.push(`${c}: ${n} suspicious value(s)`);
    if (mixedScale) details.push(`${c}: values span very different scales (e.g. different items or line types) — check outliers within each group instead`);
  }
  const qty = columns.find((c) => /^quantity$/i.test(c));
  const price = columns.find((c) => /unit price/i.test(c));
  const total = columns.find((c) => /total amount/i.test(c));
  if (qty && price && total) {
    let n = 0;
    rows.forEach((r, i) => {
      const q = toNumber(r[qty]);
      const p = toNumber(r[price]);
      const t = toNumber(r[total]);
      if (q !== null && p !== null && t !== null && Math.abs(q * p - t) > Math.max(1, t * 0.01)) {
        flags[i].push(`Total ≠ Qty × Price (${(q * p).toLocaleString("en-IN")} expected)`);
        n++;
      }
    });
    if (n) details.push(`${n} row(s) where Total ≠ Quantity × Unit Price`);
  }
  const idCol = columns.find((c) => /(po number|invoice no|contract id)/i.test(c));
  const vendor = columns.find((c) => /^vendor$/i.test(c));
  const amount = columns.find((c) => /total amount|amount/i.test(c));
  const date = columns.find((c) => /^(date|month)$/i.test(c));
  if (idCol && vendor && amount && date) {
    const groups = new Map<string, number[]>();
    rows.forEach((r, i) => {
      const k = `${r[vendor]}|${r[amount]}|${r[date]}`;
      groups.set(k, [...(groups.get(k) ?? []), i]);
    });
    let n = 0;
    groups.forEach((idx) => {
      if (idx.length > 1 && new Set(idx.map((i) => rows[i][idCol])).size > 1) {
        idx.forEach((i) => flags[i].push(`Possible duplicate payment (same vendor, amount, date as ${idx.filter((j) => j !== i).map((j) => rows[j][idCol]).join(", ")})`));
        n += idx.length;
      }
    });
    if (n) details.push(`${n} row(s) look like duplicate payments with different reference numbers`);
  }
  const cols = columns.includes(FLAG) ? columns : [...columns, FLAG];
  const out = rows.map((r, i) => ({ ...r, [FLAG]: flags[i].length ? flags[i].join("; ") : null }));
  const changed = flags.filter((f) => f.length).length;
  if (!details.length) details.push("Nothing suspicious detected");
  return { rows: out, columns: cols, log: { step: "Detect suspicious values", changed, details } };
}

export const CLEAN_STEPS = [
  { id: "trim", label: "Trim spaces", fn: trimSpaces, desc: "Remove leading/trailing & double spaces" },
  { id: "standardize", label: "Standardize names", fn: (r: Row[], c: string[]) => applyMappings(r, c, autoMappings(r, c)), desc: "Merge spelling variants (Engg → Engineering)" },
  { id: "dates", label: "Normalize dates", fn: normalizeDates, desc: "Convert mixed formats to YYYY-MM-DD" },
  { id: "numbers", label: "Fix numbers", fn: coerceNumbers, desc: "Convert '₹1,200' text into numbers" },
  { id: "dedupe", label: "Remove duplicates", fn: removeDuplicates, desc: "Drop exact duplicate rows" },
  { id: "missing", label: "Handle missing", fn: fillMissing, desc: "Label blanks; never invent numbers" },
  { id: "flag", label: "Flag suspicious", fn: flagSuspicious, desc: "Outliers, impossible values, duplicate payments" },
] as const;

export { titleCase, FLAG };
