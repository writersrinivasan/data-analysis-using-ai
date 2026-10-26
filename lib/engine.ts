import type { Agg, ChartSpec, Cell, FilterSpec, OpResult, OpSpec, Row } from "./types";
import { isMissing, parseDate, quantile, toNumber } from "./profile";

/* ------------------------------------------------------------------ helpers */

const r2 = (n: number) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : null);

function resolveCol(columns: string[], name: unknown): string {
  if (typeof name !== "string" || !name) throw new Error(`Missing column name`);
  if (columns.includes(name)) return name;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hit = columns.find((c) => norm(c) === norm(name)) ?? columns.find((c) => norm(c).startsWith(norm(name)) || norm(name).startsWith(norm(c)));
  if (!hit) throw new Error(`Unknown column "${name}". Available: ${columns.join(", ")}`);
  return hit;
}

const asArray = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? [v] : []);

export function applyFilters(rows: Row[], columns: string[], filters: unknown): Row[] {
  if (!Array.isArray(filters) || !filters.length) return rows;
  const fs = (filters as FilterSpec[]).map((f) => ({ ...f, column: resolveCol(columns, f.column) }));
  return rows.filter((r) =>
    fs.every((f) => {
      const v = r[f.column];
      const vn = toNumber(v);
      const fv = f.value;
      const eq = (a: Cell, b: unknown) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
      switch (f.op) {
        case "=":
          return eq(v, fv);
        case "!=":
          return !eq(v, fv);
        case "in":
          return Array.isArray(fv) && fv.some((x) => eq(v, x));
        case "contains":
          return String(v ?? "").toLowerCase().includes(String(fv).toLowerCase());
        default: {
          const a = vn ?? (parseDate(v) ? Date.parse(parseDate(v)!) : null);
          const b = toNumber(fv as Cell) ?? (parseDate(fv as Cell) ? Date.parse(parseDate(fv as Cell)!) : null);
          if (a === null || b === null) return false;
          return f.op === ">" ? a > b : f.op === "<" ? a < b : f.op === ">=" ? a >= b : a <= b;
        }
      }
    }),
  );
}

interface MetricSpec {
  column?: string;
  agg: Agg | "pct_where" | "count_where";
  equals?: string;
  as?: string;
}

function metricLabel(m: MetricSpec) {
  if (m.as) return m.as;
  if (m.agg === "count" && (!m.column || m.column === "*")) return "Count";
  if (m.agg === "pct_where") return `% ${m.column} = ${m.equals}`;
  if (m.agg === "count_where") return `# ${m.column} = ${m.equals}`;
  return `${m.agg[0].toUpperCase()}${m.agg.slice(1)} of ${m.column}`;
}

function computeAgg(rows: Row[], m: MetricSpec): number | null {
  if (m.agg === "count" && (!m.column || m.column === "*")) return rows.length;
  if (m.agg === "pct_where" || m.agg === "count_where") {
    const hits = rows.filter((r) => String(r[m.column!] ?? "").toLowerCase() === String(m.equals ?? "").toLowerCase()).length;
    return m.agg === "count_where" ? hits : rows.length ? r2((hits / rows.length) * 100) : null;
  }
  if (m.agg === "count") return rows.filter((r) => !isMissing(r[m.column!])).length;
  if (m.agg === "distinct") return new Set(rows.map((r) => r[m.column!]).filter((v) => !isMissing(v))).size;
  const nums = rows.map((r) => toNumber(r[m.column!])).filter((x): x is number => x !== null);
  if (!nums.length) return null;
  switch (m.agg) {
    case "sum":
      return r2(nums.reduce((a, b) => a + b, 0));
    case "avg":
      return r2(nums.reduce((a, b) => a + b, 0) / nums.length);
    case "min":
      return Math.min(...nums);
    case "max":
      return Math.max(...nums);
    case "median":
      return r2(quantile(nums.sort((a, b) => a - b), 0.5));
    default:
      return null;
  }
}

function parseMetrics(columns: string[], raw: unknown): MetricSpec[] {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [{ agg: "count" }];
  return list.map((m: Record<string, unknown>) => {
    const agg = String(m.agg ?? "sum").toLowerCase().replace("average", "avg").replace("mean", "avg") as MetricSpec["agg"];
    const column = m.column && m.column !== "*" ? resolveCol(columns, m.column) : agg === "count" ? "*" : resolveCol(columns, m.column);
    return { column, agg, equals: m.equals !== undefined ? String(m.equals) : undefined, as: m.as ? String(m.as) : undefined };
  });
}

function groupRows(rows: Row[], by: string[]) {
  const map = new Map<string, Row[]>();
  for (const r of rows) {
    const k = by.map((b) => String(r[b] ?? "(blank)")).join(" | ");
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }
  return map;
}

function periodKey(v: Cell, period: string): string | null {
  const iso = parseDate(v);
  if (!iso) return isMissing(v) ? null : String(v);
  const [y, m] = iso.split("-").map(Number);
  if (period === "year") return String(y);
  if (period === "quarter") return `${y}-Q${Math.ceil(m / 3)}`;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function sortRows(rows: Row[], key: string | undefined, order: unknown) {
  if (!key) return rows;
  const dir = order === "asc" ? 1 : -1;
  return rows.slice().sort((a, b) => {
    const x = toNumber(a[key]);
    const y = toNumber(b[key]);
    if (x === null && y === null) return String(a[key]).localeCompare(String(b[key])) * dir;
    return ((x ?? -Infinity) - (y ?? -Infinity)) * dir;
  });
}

/* ------------------------------------------------------------------ operations */

type OpFn = (rows: Row[], columns: string[], p: Record<string, any>) => Omit<OpResult, "id" | "op" | "title">;

const OPS: Record<string, OpFn> = {
  describe(rows, columns, p) {
    const cols = asArray(p.columns).length ? asArray(p.columns).map((c) => resolveCol(columns, c)) : columns.filter((c) => rows.filter((r) => toNumber(r[c]) !== null).length > rows.length * 0.6);
    const out = cols.map((c) => {
      const nums = rows.map((r) => toNumber(r[c])).filter((x): x is number => x !== null).sort((a, b) => a - b);
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / nums.length;
      const sd = Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, nums.length - 1));
      return { Column: c, Count: nums.length, Missing: rows.length - nums.length, Sum: r2(sum), Average: r2(mean), Median: r2(quantile(nums, 0.5)), Min: nums[0], Max: nums[nums.length - 1], "Std Dev": r2(sd), "Variance": r2(sd * sd) };
    });
    return { columns: ["Column", "Count", "Missing", "Sum", "Average", "Median", "Min", "Max", "Std Dev", "Variance"], rows: out, chart: { type: "table" }, formula: "Average = Sum ÷ Count; Median = middle value when sorted; Variance = Std Dev²" };
  },

  aggregate(rows, columns, p) {
    const data = applyFilters(rows, columns, p.filters);
    const by = asArray(p.groupBy).map((c) => resolveCol(columns, c));
    const metrics = parseMetrics(columns, p.metrics);
    const groups = by.length ? groupRows(data, by) : new Map([["All", data]]);
    let out: Row[] = Array.from(groups.entries()).map(([k, g]) => {
      const row: Row = {};
      const parts = k.split(" | ");
      (by.length ? by : ["Group"]).forEach((b, i) => (row[b] = parts[i]));
      metrics.forEach((m) => (row[metricLabel(m)] = computeAgg(g, m)));
      return row;
    });
    const derived = Array.isArray(p.ratios) ? p.ratios : [];
    for (const d of derived as { name: string; numerator: string; denominator: string; percent?: boolean }[]) {
      out.forEach((row) => {
        const n = toNumber(row[d.numerator]);
        const den = toNumber(row[d.denominator]);
        row[d.name] = n !== null && den ? r2((n / den) * (d.percent ? 100 : 1)) : null;
      });
    }
    const labels = [...metrics.map(metricLabel), ...derived.map((d: { name: string }) => d.name)];
    const sortKey = p.sortBy ? labels.find((l) => l.toLowerCase() === String(p.sortBy).toLowerCase()) ?? labels[0] : labels[0];
    out = sortRows(out, sortKey, p.order ?? "desc").slice(0, Number(p.limit) || 50);
    const keyCols = by.length ? by : ["Group"];
    return {
      columns: [...keyCols, ...labels],
      rows: out,
      chart: { type: by.length === 2 ? "stacked" : "bar", x: keyCols[0], y: labels.slice(0, 3) },
      formula: metrics.map((m) => `${metricLabel(m)} = ${m.agg.toUpperCase()}(${m.column ?? "*"}) per ${keyCols.join(" × ")}`).join("; "),
      note: data.length !== rows.length ? `Filtered to ${data.length} of ${rows.length} rows` : undefined,
    };
  },

  trend(rows, columns, p) {
    const data = applyFilters(rows, columns, p.filters);
    const date = resolveCol(columns, p.date);
    const period = String(p.period ?? "month");
    const metric = parseMetrics(columns, p.metrics ?? p.metric)[0];
    const by = p.groupBy ? resolveCol(columns, p.groupBy) : null;
    const order: string[] = [];
    const buckets = new Map<string, Row[]>();
    for (const r of data) {
      const k = periodKey(r[date], period);
      if (k === null) continue;
      if (!buckets.has(k)) {
        buckets.set(k, []);
        order.push(k);
      }
      buckets.get(k)!.push(r);
    }
    const allParse = order.every((k) => /^\d{4}/.test(k));
    if (allParse) order.sort();
    const label = metricLabel(metric);
    if (!by) {
      const out: Row[] = order.map((k, i) => {
        const v = computeAgg(buckets.get(k)!, metric);
        const prev = i > 0 ? computeAgg(buckets.get(order[i - 1])!, metric) : null;
        return { Period: k, [label]: v, "Change %": prev && v !== null ? r2(((v - prev) / prev) * 100) : null };
      });
      return { columns: ["Period", label, "Change %"], rows: out, chart: { type: "line", x: "Period", y: [label] }, formula: `${label} per ${period}; Change % = (this − previous) ÷ previous × 100` };
    }
    const series = Array.from(new Set(data.map((r) => String(r[by] ?? "(blank)"))));
    const top = series
      .map((s) => ({ s, v: computeAgg(data.filter((r) => String(r[by] ?? "(blank)") === s), metric) ?? 0 }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 8)
      .map((x) => x.s);
    const out: Row[] = order.map((k) => {
      const row: Row = { Period: k };
      for (const s of top) row[s] = computeAgg(buckets.get(k)!.filter((r) => String(r[by] ?? "(blank)") === s), metric);
      return row;
    });
    return { columns: ["Period", ...top], rows: out, chart: { type: "line", x: "Period", y: top }, formula: `${label} per ${period}, split by ${by}`, note: series.length > 8 ? `Showing top 8 of ${series.length} ${by} values` : undefined };
  },

  outliers(rows, columns, p) {
    const data = applyFilters(rows, columns, p.filters);
    const col = resolveCol(columns, p.column);
    const method = p.method === "zscore" ? "zscore" : "iqr";
    const show = asArray(p.show).length ? asArray(p.show).map((c) => resolveCol(columns, c)) : columns.slice(0, 4).filter((c) => c !== col);
    const nums = data.map((r) => toNumber(r[col])).filter((x): x is number => x !== null).sort((a, b) => a - b);
    const q1 = quantile(nums, 0.25);
    const q3 = quantile(nums, 0.75);
    const iqr = q3 - q1;
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const sd = Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, nums.length - 1));
    const k = Number(p.threshold) || (method === "iqr" ? 1.5 : 3);
    const lo = method === "iqr" ? q1 - k * iqr : mean - k * sd;
    const hi = method === "iqr" ? q3 + k * iqr : mean + k * sd;
    const out = data
      .filter((r) => {
        const v = toNumber(r[col]);
        return v !== null && (v > hi || v < lo);
      })
      .map((r) => {
        const v = toNumber(r[col])!;
        const row: Row = {};
        show.forEach((c) => (row[c] = r[c]));
        row[col] = v;
        row["× Median"] = r2(v / quantile(nums, 0.5));
        row.Direction = v > hi ? "High" : "Low";
        return row;
      });
    const sorted = sortRows(out, col, "desc").slice(0, Number(p.limit) || 25);
    return {
      columns: [...show, col, "× Median", "Direction"],
      rows: sorted,
      chart: { type: "table" },
      formula: method === "iqr" ? `Outside [Q1 − ${k}×IQR, Q3 + ${k}×IQR] = [${r2(lo)}, ${r2(hi)}]` : `|z| > ${k} → outside [${r2(lo)}, ${r2(hi)}]`,
      note: `${out.length} outlier(s) out of ${nums.length} values`,
    };
  },

  correlation(rows, columns, p) {
    const x = resolveCol(columns, p.x);
    const y = resolveCol(columns, p.y);
    const pts = applyFilters(rows, columns, p.filters)
      .map((r) => ({ [x]: toNumber(r[x]), [y]: toNumber(r[y]) }))
      .filter((o) => o[x] !== null && o[y] !== null) as Record<string, number>[];
    const n = pts.length;
    const mx = pts.reduce((a, o) => a + o[x], 0) / n;
    const my = pts.reduce((a, o) => a + o[y], 0) / n;
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    pts.forEach((o) => {
      sxy += (o[x] - mx) * (o[y] - my);
      sxx += (o[x] - mx) ** 2;
      syy += (o[y] - my) ** 2;
    });
    const rr = sxy / Math.sqrt(sxx * syy);
    const strength = Math.abs(rr) > 0.7 ? "strong" : Math.abs(rr) > 0.4 ? "moderate" : Math.abs(rr) > 0.2 ? "weak" : "negligible";
    return {
      columns: [x, y],
      rows: pts.slice(0, 400),
      chart: { type: "scatter", x, y: [y] },
      formula: "Pearson r = Σ(x−x̄)(y−ȳ) ÷ √(Σ(x−x̄)² · Σ(y−ȳ)²)",
      note: `r = ${r2(rr)} (${strength} ${rr >= 0 ? "positive" : "negative"}), n = ${n}. Correlation is not causation.`,
    };
  },

  funnel(rows, columns, p) {
    const data = applyFilters(rows, columns, p.filters);
    const stages = asArray(p.stages).map((c) => resolveCol(columns, c));
    if (stages.length < 2) throw new Error("funnel needs at least 2 stage columns");
    const sum = (rs: Row[], c: string) => rs.reduce((a, r) => a + (toNumber(r[c]) ?? 0), 0);
    if (p.groupBy) {
      const by = resolveCol(columns, p.groupBy);
      const out = Array.from(groupRows(data, [by]).entries()).map(([k, g]) => {
        const row: Row = { [by]: k };
        const totals = stages.map((s) => sum(g, s));
        stages.forEach((s, i) => (row[s] = totals[i]));
        for (let i = 1; i < stages.length; i++) row[`${stages[i - 1]}→${stages[i]} %`] = totals[i - 1] ? r2((totals[i] / totals[i - 1]) * 100) : null;
        row["Overall %"] = totals[0] ? r2((totals[totals.length - 1] / totals[0]) * 100) : null;
        return row;
      });
      const convCols = stages.slice(1).map((s, i) => `${stages[i]}→${s} %`);
      return { columns: [by, ...stages, ...convCols, "Overall %"], rows: sortRows(out, "Overall %", "desc"), chart: { type: "bar", x: by, y: ["Overall %"] }, formula: "Stage conversion = stage ÷ previous stage × 100; Overall = last ÷ first × 100" };
    }
    const totals = stages.map((s) => sum(data, s));
    const out = stages.map((s, i) => ({
      Stage: s,
      Count: totals[i],
      "Conversion from previous %": i ? r2((totals[i] / totals[i - 1]) * 100) : 100,
      "Conversion from start %": r2((totals[i] / totals[0]) * 100),
      "Drop-off": i ? totals[i - 1] - totals[i] : 0,
    }));
    const worst = out.slice(1).sort((a, b) => (a["Conversion from previous %"] ?? 0) - (b["Conversion from previous %"] ?? 0))[0];
    return { columns: ["Stage", "Count", "Conversion from previous %", "Conversion from start %", "Drop-off"], rows: out, chart: { type: "funnel", x: "Stage", y: ["Count"] }, formula: "Conversion = stage ÷ previous stage × 100", note: worst ? `Biggest leak: ${worst.Stage} (${worst["Conversion from previous %"]}% of previous stage)` : undefined };
  },

  variance(rows, columns, p) {
    const data = applyFilters(rows, columns, p.filters);
    const actual = resolveCol(columns, p.actual);
    const budget = resolveCol(columns, p.budget);
    const by = asArray(p.groupBy).map((c) => resolveCol(columns, c));
    const out = Array.from(groupRows(data, by.length ? by : []).entries()).map(([k, g]) => {
      const parts = k.split(" | ");
      const row: Row = {};
      by.forEach((b, i) => (row[b] = parts[i]));
      const b = g.reduce((a, r) => a + (toNumber(r[budget]) ?? 0), 0);
      const a = g.reduce((s, r) => s + (toNumber(r[actual]) ?? 0), 0);
      row.Budget = r2(b);
      row.Actual = r2(a);
      row.Variance = r2(a - b);
      row["Variance %"] = b ? r2(((a - b) / b) * 100) : null;
      row.Status = a > b * 1.05 ? "Over budget" : a < b * 0.95 ? "Under budget" : "On track";
      return row;
    });
    out.sort((x, y) => Math.abs(Number(y.Variance)) - Math.abs(Number(x.Variance)));
    return { columns: [...by, "Budget", "Actual", "Variance", "Variance %", "Status"], rows: out.slice(0, Number(p.limit) || 20), chart: { type: "bar", x: by[0], y: ["Budget", "Actual"] }, formula: "Variance = Actual − Budget; Variance % = Variance ÷ Budget × 100; ranked by |Variance|" };
  },

  price_change(rows, columns, p) {
    const data = applyFilters(rows, columns, p.filters);
    const entity = resolveCol(columns, p.entity);
    const price = resolveCol(columns, p.price);
    const date = resolveCol(columns, p.date);
    const item = p.item ? resolveCol(columns, p.item) : null;
    const dated = data.map((r) => ({ r, d: parseDate(r[date]) })).filter((x) => x.d);
    const ds = dated.map((x) => x.d!).sort();
    const split = p.splitDate ? parseDate(String(p.splitDate)) ?? ds[Math.floor(ds.length / 2)] : ds[Math.floor(ds.length / 2)];
    const groups = new Map<string, { before: number[]; after: number[] }>();
    for (const { r, d } of dated) {
      const v = toNumber(r[price]);
      if (v === null) continue;
      const k = item ? `${r[entity]} | ${r[item]}` : String(r[entity]);
      if (!groups.has(k)) groups.set(k, { before: [], after: [] });
      (d! < split ? groups.get(k)!.before : groups.get(k)!.after).push(v);
    }
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    const out: Row[] = [];
    groups.forEach((g, k) => {
      if (!g.before.length || !g.after.length) return;
      const [e, it] = k.split(" | ");
      const b = avg(g.before);
      const a = avg(g.after);
      out.push({ [entity]: e, ...(item ? { [item]: it } : {}), "Avg Price Before": r2(b), "Avg Price After": r2(a), "Change %": r2(((a - b) / b) * 100), "Orders (before/after)": `${g.before.length}/${g.after.length}` });
    });
    const sorted = sortRows(out, "Change %", "desc").slice(0, Number(p.limit) || 15);
    return { columns: [entity, ...(item ? [item] : []), "Avg Price Before", "Avg Price After", "Change %", "Orders (before/after)"], rows: sorted, chart: { type: "bar", x: item ? item : entity, y: ["Change %"] }, formula: `Average ${price} before vs on/after ${split}; Change % = (after − before) ÷ before × 100` };
  },

  share(rows, columns, p) {
    const data = applyFilters(rows, columns, p.filters);
    const by = resolveCol(columns, p.groupBy);
    const m = parseMetrics(columns, p.metric ? { column: p.metric, agg: p.agg ?? "sum" } : p.metrics)[0];
    const out = Array.from(groupRows(data, [by]).entries()).map(([k, g]) => ({ [by]: k, Value: computeAgg(g, m) ?? 0 }));
    out.sort((a, b) => Number(b.Value) - Number(a.Value));
    const total = out.reduce((a, r) => a + Number(r.Value), 0);
    let cum = 0;
    const rowsOut: Row[] = out.map((r) => {
      cum += Number(r.Value);
      return { ...r, "Share %": r2((Number(r.Value) / total) * 100), "Cumulative %": r2((cum / total) * 100) };
    });
    const top2 = rowsOut.slice(0, 2).reduce((a, r) => a + Number(r["Share %"]), 0);
    return { columns: [by, "Value", "Share %", "Cumulative %"], rows: rowsOut.slice(0, Number(p.limit) || 15), chart: { type: rowsOut.length <= 7 ? "pie" : "bar", x: by, y: rowsOut.length <= 7 ? ["Value"] : ["Share %"] }, formula: `Share = ${metricLabel(m)} ÷ total (${r2(total)}) × 100`, note: `Top 2 = ${r2(top2)}% of total` };
  },

  duplicates(rows, columns, p) {
    const keys = asArray(p.keys).map((c) => resolveCol(columns, c));
    const groups = groupRows(rows, keys);
    const show = asArray(p.show).length ? asArray(p.show).map((c) => resolveCol(columns, c)) : columns.slice(0, 6);
    const out: Row[] = [];
    let g = 0;
    groups.forEach((rs) => {
      if (rs.length > 1) {
        g++;
        rs.forEach((r) => {
          const row: Row = { "Dup Group": g };
          show.forEach((c) => (row[c] = r[c]));
          out.push(row);
        });
      }
    });
    return { columns: ["Dup Group", ...show], rows: out.slice(0, 60), chart: { type: "table" }, formula: `Rows sharing the same ${keys.join(" + ")}`, note: `${g} duplicate group(s) found` };
  },

  upcoming(rows, columns, p) {
    const date = resolveCol(columns, p.date);
    const days = Number(p.days) || 90;
    const asOf = parseDate(String(p.asOf ?? "")) ?? "2026-10-26";
    const end = new Date(Date.parse(asOf) + days * 86400000).toISOString().slice(0, 10);
    const show = asArray(p.show).length ? asArray(p.show).map((c) => resolveCol(columns, c)) : columns.slice(0, 6);
    const out = applyFilters(rows, columns, p.filters)
      .map((r) => ({ r, d: parseDate(r[date]) }))
      .filter((x) => x.d && x.d >= asOf && x.d <= end)
      .sort((a, b) => a.d!.localeCompare(b.d!))
      .map(({ r, d }) => {
        const row: Row = {};
        show.forEach((c) => (row[c] = r[c]));
        row[date] = d;
        row["Days Left"] = Math.round((Date.parse(d!) - Date.parse(asOf)) / 86400000);
        return row;
      });
    return { columns: [...show.filter((c) => c !== date), date, "Days Left"], rows: out, chart: { type: "table" }, formula: `${date} between ${asOf} and ${end}`, note: `${out.length} item(s) due within ${days} days of ${asOf}` };
  },

  crosstab(rows, columns, p) {
    const data = applyFilters(rows, columns, p.filters);
    const rc = resolveCol(columns, p.rows);
    const cc = resolveCol(columns, p.cols);
    const m = parseMetrics(columns, p.metric ? { column: p.metric, agg: p.agg ?? "sum" } : p.metrics ?? { agg: "count" })[0];
    const colVals = Array.from(new Set(data.map((r) => String(r[cc] ?? "(blank)")))).slice(0, 12);
    const out = Array.from(groupRows(data, [rc]).entries()).map(([k, g]) => {
      const row: Row = { [rc]: k };
      colVals.forEach((cv) => (row[cv] = computeAgg(g.filter((r) => String(r[cc] ?? "(blank)") === cv), m) ?? 0));
      return row;
    });
    return { columns: [rc, ...colVals], rows: out, chart: { type: "heatmap", x: rc, y: colVals }, formula: `${metricLabel(m)} for each ${rc} × ${cc}` };
  },

  filter_rows(rows, columns, p) {
    const data = applyFilters(rows, columns, p.filters);
    const show = asArray(p.show).length ? asArray(p.show).map((c) => resolveCol(columns, c)) : columns;
    const sortKey = p.sortBy ? resolveCol(columns, p.sortBy) : undefined;
    const out = sortRows(data, sortKey, p.order ?? "desc")
      .slice(0, Number(p.limit) || 20)
      .map((r) => Object.fromEntries(show.map((c) => [c, r[c]])));
    return { columns: show, rows: out, chart: { type: "table" }, note: `${data.length} matching row(s)` };
  },

  whatif(rows, columns, p) {
    const data = applyFilters(rows, columns, p.filters);
    const m = parseMetrics(columns, { column: p.metric, agg: p.agg ?? "sum" })[0];
    const pct = Number(p.changePct) || 10;
    const by = p.groupBy ? resolveCol(columns, p.groupBy) : null;
    const groups = by ? groupRows(data, [by]) : new Map([["Total", data]]);
    const out = Array.from(groups.entries()).map(([k, g]) => {
      const base = computeAgg(g, m) ?? 0;
      return { [by ?? "Scope"]: k, "Base Case": r2(base), [`Scenario (${pct > 0 ? "+" : ""}${pct}%)`]: r2(base * (1 + pct / 100)), Impact: r2((base * pct) / 100) };
    });
    const sc = `Scenario (${pct > 0 ? "+" : ""}${pct}%)`;
    return { columns: [by ?? "Scope", "Base Case", sc, "Impact"], rows: sortRows(out, "Base Case", "desc"), chart: { type: "bar", x: by ?? "Scope", y: ["Base Case", sc] }, formula: `Scenario = Base × (1 ${pct >= 0 ? "+" : "−"} ${Math.abs(pct)}%)`, note: "Simple proportional what-if: assumes nothing else changes." };
  },

  forecast(rows, columns, p) {
    const t = OPS.trend(rows, columns, { date: p.date, metrics: p.metrics ?? { column: p.metric, agg: p.agg ?? "sum" }, period: p.period ?? "month", filters: p.filters });
    const label = t.columns[1];
    const ys = t.rows.map((r) => Number(r[label]));
    const n = ys.length;
    const xs = ys.map((_, i) => i);
    const mx = (n - 1) / 2;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    const icpt = my - slope * mx;
    const resid = Math.sqrt(ys.reduce((a, y, i) => a + (y - (icpt + slope * i)) ** 2, 0) / Math.max(1, n - 2));
    const h = Math.min(12, Number(p.periods) || 3);
    const out: Row[] = t.rows.map((r) => ({ Period: r.Period, Actual: r[label], Forecast: null, Low: null, High: null }));
    for (let i = 0; i < h; i++) {
      const f = icpt + slope * (n + i);
      out.push({ Period: `+${i + 1}`, Actual: null, Forecast: r2(f), Low: r2(f - 1.96 * resid), High: r2(f + 1.96 * resid) });
    }
    return { columns: ["Period", "Actual", "Forecast", "Low", "High"], rows: out, chart: { type: "line", x: "Period", y: ["Actual", "Forecast", "Low", "High"] }, formula: `Linear trend: y = ${r2(icpt)} + ${r2(slope)} × t; 95% band = ±1.96 × residual SD (${r2(resid)})`, note: "Straight-line forecast — a starting point for discussion, not a commitment." };
  },
};

export const OP_CATALOG = `
Available operations (use exact column names from the profile):
1. describe {columns?: string[]} — count/sum/avg/median/min/max/std/variance for numeric columns.
2. aggregate {groupBy: string[] (0-2 cols), metrics: [{column, agg: sum|avg|count|min|max|median|distinct|pct_where|count_where, equals?: value (for pct_where/count_where), as?: label}], ratios?: [{name, numerator: metricLabel, denominator: metricLabel, percent?: bool}], filters?, sortBy?: metric label, order?: desc|asc, limit?}
   Metric labels default to "Sum of <col>", "Avg of <col>", "Count", "% <col> = <value>" unless "as" is given. Use "as" when you reference metrics in ratios.
3. trend {date: col, metrics: [{column, agg}], period: month|quarter|year, groupBy?: col, filters?} — time series (works with ordinal period labels like "FY25 Q1" too).
4. outliers {column, method?: iqr|zscore, threshold?, show?: string[], filters?, limit?}
5. correlation {x: numeric col, y: numeric col, filters?}
6. funnel {stages: [cols in order], groupBy?: col, filters?} — sums each stage column; conversion % per step.
7. variance {actual: col, budget: col, groupBy: string[], filters?, limit?} — Actual − Budget ranked by size.
8. price_change {entity: col, price: col, date: col, item?: col, splitDate?: YYYY-MM-DD, filters?} — average price before vs after split date.
9. share {groupBy: col, metric: numeric col, agg?: sum, filters?, limit?} — share % and cumulative % (concentration/Pareto).
10. duplicates {keys: [cols], show?: [cols]} — rows sharing the same key values.
11. upcoming {date: col, days: number, asOf?: YYYY-MM-DD, filters?, show?: [cols]} — items due within N days.
12. crosstab {rows: col, cols: col, metric?: col, agg?: sum|count|avg, filters?} — heat-map style matrix.
13. filter_rows {filters, show?: [cols], sortBy?: col, order?, limit?} — list matching rows.
14. whatif {metric: col, agg?: sum, changePct: number, groupBy?: col, filters?} — base vs scenario.
15. forecast {date: col, metric: col, agg?: sum, period?: month|quarter, periods?: number, filters?} — linear forecast with band.
Filters: [{column, op: "="|"!="|">"|"<"|">="|"<="|"contains"|"in", value}]
`;

export const OP_NAMES = Object.keys(OPS);

export function runOp(rows: Row[], columns: string[], spec: OpSpec): OpResult {
  const fn = OPS[spec.op];
  const base = { id: spec.id, op: spec.op, title: spec.title };
  if (!fn) return { ...base, columns: [], rows: [], chart: { type: "table" }, error: `Unknown operation "${spec.op}". Use one of: ${OP_NAMES.join(", ")}` };
  try {
    const res = fn(rows, columns, spec.params ?? {});
    const chart: ChartSpec = spec.chart?.type && res.chart.type !== "table" && res.chart.type !== "funnel" && res.chart.type !== "scatter" && res.chart.type !== "heatmap" ? { ...res.chart, type: spec.chart.type } : res.chart;
    return { ...base, ...res, chart };
  } catch (e) {
    return { ...base, columns: [], rows: [], chart: { type: "table" }, error: (e as Error).message };
  }
}
