"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartSpec, Row } from "@/lib/types";
import { fmt } from "./ui";

export const PALETTE = ["#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#84cc16", "#f97316", "#14b8a6"];

const compact = (v: unknown) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "");
  const a = Math.abs(n);
  if (a >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`;
  if (a >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(Math.round(n * 100) / 100);
};

const shortLabel = (v: unknown) => {
  const s = String(v ?? "");
  return s.length > 14 ? s.slice(0, 13) + "…" : s;
};

const tooltipProps = {
  formatter: (v: unknown) => fmt(v),
  contentStyle: { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 },
};

export function ResultChart({ chart, rows, columns, height = 280 }: { chart: ChartSpec; rows: Row[]; columns: string[]; height?: number }) {
  if (!rows.length || chart.type === "table") return null;
  const x = chart.x && columns.includes(chart.x) ? chart.x : columns[0];
  const ys = (chart.y ?? []).filter((y) => columns.includes(y));
  const yCols = ys.length ? ys : columns.filter((c) => c !== x && rows.some((r) => typeof r[c] === "number")).slice(0, 3);
  if (!yCols.length) return null;
  const data = rows.slice(0, 40);

  if (chart.type === "pie") {
    const y = yCols[0];
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey={y} nameKey={x} innerRadius="45%" outerRadius="80%" paddingAngle={2} label={(p: { name?: string; percent?: number }) => `${shortLabel(p.name)} ${Math.round((p.percent ?? 0) * 100)}%`} labelLine={false} fontSize={11}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipProps} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "scatter") {
    const y = yCols[0];
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis type="number" dataKey={x} name={x} tickFormatter={compact} fontSize={11} label={{ value: x, position: "insideBottom", offset: -10, fontSize: 11 }} />
          <YAxis type="number" dataKey={y} name={y} tickFormatter={compact} fontSize={11} />
          <Tooltip {...tooltipProps} cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={rows.slice(0, 400)} fill="#8b5cf6" fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "funnel") {
    const y = yCols[0];
    const max = Math.max(...data.map((r) => Number(r[y]) || 0));
    return (
      <div className="space-y-1.5 py-2">
        {data.map((r, i) => {
          const v = Number(r[y]) || 0;
          const w = max ? Math.max(8, (v / max) * 100) : 0;
          const conv = r["Conversion from previous %"];
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-right text-xs font-semibold text-slate-600">{String(r[x])}</div>
              <div className="flex-1">
                <div className="mx-auto flex h-9 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm" style={{ width: `${w}%`, background: PALETTE[i % PALETTE.length] }}>
                  {fmt(v)}
                </div>
              </div>
              <div className="w-20 shrink-0 text-xs text-slate-500">{i > 0 && conv !== undefined ? `${fmt(conv)}%` : ""}</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (chart.type === "heatmap") {
    const vals = data.flatMap((r) => yCols.map((c) => Number(r[c]) || 0));
    const max = Math.max(...vals, 1);
    return (
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th />
              {yCols.map((c) => (
                <th key={c} className="px-1 py-1 text-left font-semibold text-slate-500">
                  {shortLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i}>
                <td className="whitespace-nowrap pr-2 font-semibold text-slate-600">{shortLabel(r[x])}</td>
                {yCols.map((c) => {
                  const v = Number(r[c]) || 0;
                  const t = v / max;
                  return (
                    <td key={c} className="rounded-md px-2 py-2 text-center font-semibold" style={{ background: `rgba(139, 92, 246, ${0.08 + t * 0.85})`, color: t > 0.5 ? "white" : "#1e1b4b" }} title={`${r[x]} × ${c}: ${fmt(v)}`}>
                      {compact(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (chart.type === "line") {
    const isForecast = yCols.includes("Forecast") && yCols.includes("Low");
    if (isForecast) {
      const d = data.map((r) => ({ ...r, Band: r.Low !== null && r.High !== null ? [r.Low, r.High] : null }));
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={d} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey={x} fontSize={11} tickFormatter={shortLabel} />
            <YAxis fontSize={11} tickFormatter={compact} />
            <Tooltip {...tooltipProps} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area dataKey="Band" fill="#c4b5fd" stroke="none" fillOpacity={0.4} name="95% band" />
            <Line dataKey="Actual" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 2 }} connectNulls />
            <Line dataKey="Forecast" stroke="#ec4899" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 3 }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey={x} fontSize={11} tickFormatter={shortLabel} />
          <YAxis fontSize={11} tickFormatter={compact} />
          <Tooltip {...tooltipProps} />
          {yCols.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {yCols.slice(0, 8).map((y, i) => (
            <Line key={y} dataKey={y} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2.5} dot={{ r: 2 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  const stacked = chart.type === "stacked";
  if (stacked) {
    // two-dimension aggregate (e.g. Department × Status): pivot the second dimension into series
    const series = columns.find((c) => c !== x && rows.every((r) => typeof r[c] === "string"));
    if (series) {
      const metric = yCols[0];
      const keys = Array.from(new Set(rows.map((r) => String(r[series])))).slice(0, 10);
      const map = new Map<string, Row>();
      for (const r of rows) {
        const k = String(r[x]);
        if (!map.has(k)) map.set(k, { [x]: k });
        map.get(k)![String(r[series])] = r[metric];
      }
      return <ResultChart chart={{ type: "stacked", x, y: keys }} rows={Array.from(map.values())} columns={[x, ...keys]} height={height} />;
    }
  }
  const horizontal = data.length > 8 && !stacked;
  return (
    <ResponsiveContainer width="100%" height={horizontal ? Math.max(height, data.length * 26) : height}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 10, right: 20, bottom: 0, left: horizontal ? 20 : 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        {horizontal ? (
          <>
            <XAxis type="number" fontSize={11} tickFormatter={compact} />
            <YAxis type="category" dataKey={x} fontSize={11} width={120} tickFormatter={shortLabel} />
          </>
        ) : (
          <>
            <XAxis dataKey={x} fontSize={11} tickFormatter={shortLabel} interval={0} angle={data.length > 5 ? -20 : 0} textAnchor={data.length > 5 ? "end" : "middle"} height={data.length > 5 ? 55 : 30} />
            <YAxis fontSize={11} tickFormatter={compact} />
          </>
        )}
        <Tooltip {...tooltipProps} />
        {yCols.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {yCols.map((y, i) => (
          <Bar key={y} dataKey={y} stackId={stacked ? "s" : undefined} fill={PALETTE[i % PALETTE.length]} radius={stacked ? 0 : horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}>
            {yCols.length === 1 && data.map((r, j) => <Cell key={j} fill={Number(r[y]) < 0 ? "#ef4444" : PALETTE[i % PALETTE.length]} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
