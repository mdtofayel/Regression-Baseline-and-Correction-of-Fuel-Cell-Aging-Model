import React, { useEffect, useState } from "react";
import { fetchDatasetCsv } from "../../services/showResultService";

export default function DatasetCsvViewer({ runId, dataset, pageSize = 500 }) {
  const [open, setOpen] = useState(false);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async (newOffset = 0) => {
    try {
      setLoading(true);
      setErr("");
      const data = await fetchDatasetCsv(runId, dataset, { offset: newOffset, limit: pageSize });
      setHeaders(data.headers || []);
      setRows(data.rows || []);
      setTotal(data.total || 0);
      setOffset(data.offset || 0);
    } catch (e) {
      console.error(e);
      setErr("Failed to load dataset page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset when dataset changes
    setHeaders([]); setRows([]); setTotal(0); setOffset(0); setErr("");
    if (open && dataset) load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, runId]);

  const canPrev = offset > 0;
  const canNext = offset + rows.length < total;

  return (
    <div className="my-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dataset Preview</h3>
        <button
          onClick={async () => {
            const nxt = !open;
            setOpen(nxt);
            if (nxt && rows.length === 0 && dataset) await load(0);
          }}
          className="px-3 h-9 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
        >
          {open ? "Hide dataset" : "Show dataset"}
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded-lg border border-gray-200">
          {/* toolbar */}
          <div className="flex items-center justify-between p-3">
            <div className="text-sm text-gray-600">
              {loading ? "Loading…" : `Rows ${offset + 1}–${offset + rows.length} of ${total}`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => load(Math.max(0, offset - pageSize))}
                disabled={!canPrev || loading}
                className="px-2 h-9 rounded-md border border-gray-300 text-sm disabled:opacity-40"
              >
                ◀ Prev
              </button>
              <button
                onClick={() => load(offset + pageSize)}
                disabled={!canNext || loading}
                className="px-2 h-9 rounded-md border border-gray-300 text-sm disabled:opacity-40"
              >
                Next ▶
              </button>
            </div>
          </div>

          {err && (
            <div className="mx-3 mb-3 rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
              {err}
            </div>
          )}

          {/* table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-t border-b border-gray-200">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    {r.map((cell, cidx) => (
                      <td key={cidx} className="px-3 py-1">{cell}</td>
                    ))}
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={headers.length} className="px-3 py-4 text-center text-gray-500">
                      No data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
