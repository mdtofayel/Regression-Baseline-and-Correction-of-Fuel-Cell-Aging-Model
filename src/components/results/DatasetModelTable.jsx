// src/components/results/DatasetModelTable.jsx
import React, { useMemo, useState } from "react";

/**
 * Normalized RMSE table
 * - Search across dataset_name, split_id, category, model
 * - Sort by any column (click header)
 * - Pagination with "Show N"
 * - Nicely formatted rmse values
 *
 * Props:
 *   normalizedResults: Array<Row>
 *   className?: string
 */
export default function DatasetModelTable({ normalizedResults = [], className = "" }) {
  // ------- table config -------
  const columns = [
    { key: "dataset_name", label: "dataset_name" },
    { key: "split_id", label: "split_id" },
    { key: "category", label: "category" },
    { key: "model", label: "model" },
    { key: "rmse_test", label: "rmse_test", numeric: true },
    { key: "normalized_rmse", label: "normalized_rmse", numeric: true },
  ];
  const searchable = ["dataset_name", "split_id", "category", "model"];

  // ------- UI state -------
  const [searchText, setSearchText] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("normalized_rmse");
  const [sortDir, setSortDir] = useState("asc"); // 'asc' | 'desc'

  // ------- helpers -------
  const fmt = (v, numeric) => {
    if (!numeric) return v ?? "";
    const n = Number(v);
    if (Number.isFinite(n)) return n.toFixed(6);
    return v ?? "";
  };

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  // ------- computed rows (search + sort) -------
  const processedRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    const filtered = q
      ? (normalizedResults || []).filter((row) =>
          searchable.some((k) => String(row?.[k] ?? "").toLowerCase().includes(q))
        )
      : (normalizedResults || []);

    const sorted = [...filtered].sort((a, b) => {
      const av = a?.[sortBy];
      const bv = b?.[sortBy];
      // numeric first if both parse
      const an = Number(av);
      const bn = Number(bv);
      let cmp;
      if (Number.isFinite(an) && Number.isFinite(bn)) {
        cmp = an - bn;
      } else {
        cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [normalizedResults, searchText, sortBy, sortDir]);

  // ------- pagination -------
  const totalPages = Math.max(1, Math.ceil(processedRows.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const start = (page - 1) * rowsPerPage;
  const pageRows = processedRows.slice(start, start + rowsPerPage);

  const go = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  // ------- render -------
  return (
    <div className={`my-6 ${className}`}>
      <h2 className="text-lg font-semibold mb-3">Normalized RMSE Table</h2>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-stretch sm:items-center mb-3">
        <input
          type="text"
          placeholder="Search…"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-64 px-3 h-10 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:border-blue-500"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setCurrentPage(1);
            }}
            className="h-10 rounded-md border border-gray-300 px-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600">rows</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => {
                const active = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    className="px-4 py-2 text-left font-semibold text-gray-700 select-none"
                  >
                    <button
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center gap-1 ${active ? "text-blue-700" : "text-gray-700"}`}
                      title={`Sort by ${col.label}`}
                    >
                      {col.label}
                      <span className="text-xs">
                        {active ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                  No rows to display.
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => (
                <tr key={`${row.dataset_name}-${row.split_id}-${row.model}-${idx}`}>
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-2 ${col.numeric ? "text-right tabular-nums" : ""}`}>
                      {fmt(row[col.key], col.numeric)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / pagination */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="text-gray-600">
          Showing <span className="font-medium">{pageRows.length}</span> of{" "}
          <span className="font-medium">{processedRows.length}</span> rows
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => go(page - 1)}
            disabled={page === 1}
            className="px-2 py-1 border border-gray-300 rounded disabled:opacity-40"
          >
            ◀
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 6) return true;
              if (page <= 3) return p <= 4 || p === totalPages;
              if (page >= totalPages - 2) return p >= totalPages - 3 || p === 1;
              return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
            })
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showDots = prev && p - prev > 1;
              return (
                <React.Fragment key={p}>
                  {showDots && <span className="px-1">…</span>}
                  <button
                    onClick={() => go(p)}
                    className={`px-2 py-1 border rounded ${
                      p === page ? "bg-blue-600 text-white" : "border-gray-300"
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            onClick={() => go(page + 1)}
            disabled={page === totalPages}
            className="px-2 py-1 border border-gray-300 rounded disabled:opacity-40"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
