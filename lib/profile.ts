import type { Cell, ColumnKind, ColumnProfile, Profile, Row } from "./types";
import { piiRiskForColumn } from "./privacy";

const MON: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

export function isMissing(v: Cell | undefined) {
  return v === null || v === undefined || (typeof v === "string" && (v.trim() === "" || /^(na|n\/a|null|nan|-)$/i.test(v.trim())));
}

export function toNumber(v: Cell | undefined): number | null {
  if (isMissing(v)) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[₹$,%\s]|INR|Rs\.?/gi, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/** Parses ISO, dd/mm/yyyy (Indian convention), "Mar 4 2026", "4-Mar-2026", "2026-03" and fiscal quarter labels are left alone. */
export function parseDate(v: Cell | undefined): string | null {
  if (isMissing(v) || typeof v === "number") return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{4})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-01`;
  m = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = s.match(/^([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})$/);
  if (m && MON[m[1].toLowerCase()]) return `${m[3]}-${String(MON[m[1].toLowerCase()]).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (m && MON[m[2].toLowerCase()]) return `${m[3]}-${String(MON[m[2].toLowerCase()]).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function dateFormatOf(v: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return "iso";
  if (/^\d{4}-\d{2}$/.test(v)) return "ym";
  if (/^\d{1,2}[/.]\d{1,2}[/.]\d{4}$/.test(v)) return "dmy";
  if (/^[A-Za-z]{3}/.test(v)) return "mon";
  if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(v)) return "d-mon";
  return "other";
}

export function quantile(sorted: number[], q: number) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function normKey(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** "engg" -> "engineering", "mktg" -> "marketing": same first letter and an in-order subsequence. */
function isAbbreviation(short: string, long: string) {
  if (short[0] !== long[0] || short.length > long.length * 0.75) return false;
  let i = 0;
  for (const ch of long) if (ch === short[i]) i++;
  return i === short.length;
}

/** Groups values that are probably the same thing written differently (case, spaces, punctuation, prefixes). */
export function findVariantGroups(values: string[]): string[][] {
  const uniq = Array.from(new Set(values));
  const groups = new Map<string, Set<string>>();
  for (const v of uniq) {
    const k = normKey(v);
    if (!groups.has(k)) groups.set(k, new Set());
    groups.get(k)!.add(v);
  }
  const keys = Array.from(groups.keys());
  // merge prefix-style abbreviations ("engg" -> "engineering", "nimbuscloud" -> "nimbuscloudservices")
  for (const a of keys) {
    for (const b of keys) {
      if (a === b || !groups.has(a) || !groups.has(b)) continue;
      const short = a.length < b.length ? a : b;
      const long = a.length < b.length ? b : a;
      if (short.length >= 3 && (long.startsWith(short) || (short.length >= 5 && long.endsWith(short)) || isAbbreviation(short, long))) {
        groups.get(long)!.forEach((x) => groups.get(short)!.add(x));
        groups.delete(long);
      }
    }
  }
  return Array.from(groups.values())
    .map((s) => Array.from(s))
    .filter((g) => g.length > 1);
}

export function inferKind(name: string, values: Cell[]): ColumnKind {
  const present = values.filter((v) => !isMissing(v));
  if (!present.length) return "text";
  const n = present.length;
  const numeric = present.filter((v) => toNumber(v) !== null).length;
  const dates = present.filter((v) => parseDate(v) !== null).length;
  const uniq = new Set(present.map(String)).size;
  if (/(^|\s)(id|no|number|code)$/i.test(name.trim()) && uniq > n * 0.9) return "id";
  if (dates / n > 0.8 && /date|month|period|day/i.test(name)) return "date";
  if (numeric / n > 0.9) return "numeric";
  if (dates / n > 0.9) return "date";
  if (uniq <= Math.max(25, n * 0.2)) return "categorical";
  return "text";
}

export function profileRows(rows: Row[], columns?: string[]): Profile {
  const cols = columns ?? (rows[0] ? Object.keys(rows[0]) : []);
  const seen = new Set<string>();
  let dup = 0;
  for (const r of rows) {
    const k = JSON.stringify(cols.map((c) => r[c]));
    if (seen.has(k)) dup++;
    else seen.add(k);
  }
  const profiles: ColumnProfile[] = cols.map((name) => {
    const values = rows.map((r) => r[name]);
    const kind = inferKind(name, values);
    const present = values.filter((v) => !isMissing(v));
    const strVals = present.map((v) => String(v));
    const counts = new Map<string, number>();
    strVals.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
    const p: ColumnProfile = {
      name,
      kind,
      missing: values.length - present.length,
      unique: counts.size,
      sample: Array.from(counts.keys()).slice(0, 5),
      piiRisk: piiRiskForColumn(name, strVals.slice(0, 50)),
    };
    if (kind === "numeric") {
      const nums = present.map((v) => toNumber(v)!).filter((x) => x !== null).sort((a, b) => a - b);
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / nums.length;
      const std = Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, nums.length - 1));
      const q1 = quantile(nums, 0.25);
      const q3 = quantile(nums, 0.75);
      const iqr = q3 - q1;
      const extreme = iqr > 0 ? nums.filter((x) => x < q1 - 3 * iqr || x > q3 + 3 * iqr).length : 0;
      Object.assign(p, {
        min: nums[0],
        max: nums[nums.length - 1],
        mean,
        median: quantile(nums, 0.5),
        std,
        sum,
        outliers: extreme <= nums.length * 0.05 ? extreme : 0, // more than 5% = mixed populations, not outliers
      });
    } else if (kind === "categorical" || kind === "text") {
      p.top = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, kind === "categorical" ? 30 : 5)
        .map(([value, count]) => ({ value, count }));
      if (kind === "categorical") {
        const vg = findVariantGroups(Array.from(counts.keys()));
        if (vg.length) p.variantGroups = vg;
      }
    } else if (kind === "date") {
      const parsed = present.map(parseDate).filter(Boolean) as string[];
      parsed.sort();
      p.dateMin = parsed[0];
      p.dateMax = parsed[parsed.length - 1];
      p.mixedDateFormats = new Set(strVals.map(dateFormatOf)).size > 1;
    }
    return p;
  });
  return { rowCount: rows.length, columnCount: cols.length, duplicateRows: dup, columns: profiles };
}

/** Compact, LLM-friendly description of a profile. Never includes raw row-level values for PII columns. */
export function profileForLLM(profile: Profile) {
  return {
    rows: profile.rowCount,
    duplicate_rows: profile.duplicateRows,
    columns: profile.columns.map((c) => ({
      name: c.name,
      type: c.kind,
      missing: c.missing,
      unique: c.unique,
      ...(c.kind === "numeric" ? { min: c.min, max: c.max, mean: c.mean && Math.round(c.mean * 100) / 100, median: c.median } : {}),
      ...(c.kind === "categorical" && !c.piiRisk ? { values: c.top?.slice(0, 15).map((t) => t.value) } : {}),
      ...(c.kind === "date" ? { from: c.dateMin, to: c.dateMax } : {}),
      ...(c.piiRisk ? { pii: c.piiRisk } : {}),
    })),
  };
}
