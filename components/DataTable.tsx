"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Row } from "@/lib/types";
import { fmt } from "./ui";

export function DataTable({ columns, rows, pageSize = 12, highlight, compact }: { columns: string[]; rows: Row[]; pageSize?: number; highlight?: (col: string, value: unknown, row: Row) => string | undefined; compact?: boolean }) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ col: string; dir: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    return rows.slice().sort((a, b) => {
      const x = a[sort.col];
      const y = b[sort.col];
      if (typeof x === "number" && typeof y === "number") return (x - y) * sort.dir;
      return String(x ?? "").localeCompare(String(y ?? "")) * sort.dir;
    });
  }, [rows, sort]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const p = Math.min(page, pages - 1);
  const slice = sorted.slice(p * pageSize, p * pageSize + pageSize);

  return (
    <div>
      <div className="scrollbar-thin overflow-x-auto rounded-xl border border-slate-200">
        <table className={clsx("w-full text-left", compact ? "text-[11px]" : "text-xs")}>
          <thead className="bg-gradient-to-r from-violet-50 to-sky-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  onClick={() => setSort((s) => (s?.col === c ? { col: c, dir: s.dir === 1 ? -1 : 1 } : { col: c, dir: -1 }))}
                  className="cursor-pointer whitespace-nowrap px-3 py-2 font-semibold text-slate-700 hover:text-violet-700"
                >
                  {c}
                  {sort?.col === c ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr key={i} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/50">
                {columns.map((c) => {
                  const v = r[c];
                  const hl = highlight?.(c, v, r);
                  return (
                    <td key={c} className={clsx("max-w-[260px] truncate whitespace-nowrap px-3 py-1.5", typeof v === "number" ? "text-right tabular-nums" : "", v === null || v === undefined || v === "" ? "bg-amber-50 text-amber-500" : "", hl)} title={v === null || v === undefined ? "missing" : String(v)}>
                      {fmt(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {!slice.length && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400">
                  No rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-2 flex items-center justify-end gap-2 text-xs text-slate-500">
          <span>
            {p * pageSize + 1}–{Math.min(sorted.length, p * pageSize + pageSize)} of {sorted.length.toLocaleString()}
          </span>
          <button className="rounded-lg p-1 hover:bg-slate-100 disabled:opacity-30" disabled={p === 0} onClick={() => setPage(p - 1)} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-1 hover:bg-slate-100 disabled:opacity-30" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
