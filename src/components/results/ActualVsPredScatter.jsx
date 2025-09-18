// src/components/results/ActualVsPredScatter.jsx
import React, { useMemo } from "react";
import Plot from "react-plotly.js";

export default function ActualVsPredScatter({ actual = [], corrected = [], baseline = [] }) {
  const MAX_POINTS = 120_000; // target cap per series

  const memo = useMemo(() => {
    const ya = Array.isArray(actual) ? actual : [];
    const yc = Array.isArray(corrected) ? corrected : [];
    const yb = Array.isArray(baseline) ? baseline : [];

    // we only plot where pairs exist
    const n = Math.min(ya.length, yc.length || Infinity, yb.length || Infinity);
    if (!Number.isFinite(n) || n <= 0) {
      return { actB: [], base: [], actC: [], corr: [], minA: 0, maxA: 1, note: null };
    }

    // stride so we stay under the cap
    const stride = Math.max(1, Math.ceil(n / MAX_POINTS));

    const actB = [];
    const base = [];
    const actC = [];
    const corr = [];

    for (let i = 0; i < n; i += stride) {
      const a = Number(ya[i]);
      const b = Number(yb[i]);
      const c = Number(yc[i]);
      if (Number.isFinite(a) && Number.isFinite(b)) { actB.push(a); base.push(b); }
      if (Number.isFinite(a) && Number.isFinite(c)) { actC.push(a); corr.push(c); }
    }

    // manual min/max (NO spread!)
    let minA = Infinity;
    let maxA = -Infinity;
    for (let i = 0; i < actB.length; i++) {
      const v = actB[i];
      if (v < minA) minA = v;
      if (v > maxA) maxA = v;
    }
    for (let i = 0; i < actC.length; i++) {
      const v = actC[i];
      if (v < minA) minA = v;
      if (v > maxA) maxA = v;
    }
    if (!Number.isFinite(minA) || !Number.isFinite(maxA)) { minA = 0; maxA = 1; }

    const kept = Math.max(actB.length, actC.length);
    const note = kept < n
      ? `Previewing ${kept.toLocaleString()} of ${n.toLocaleString()} points (stride ${stride})`
      : null;

    return { actB, base, actC, corr, minA, maxA, note };
  }, [actual, corrected, baseline]);

  const { actB, base, actC, corr, minA, maxA, note } = memo;

  if (!actB.length && !actC.length) return null;

  return (
    <div className="my-6 rounded-xl border border-gray-200 p-2 shadow-sm">
      <div className="flex items-end justify-between mb-2">
        <h3 className="text-lg font-semibold">Actual vs Predicted</h3>
        {note && <span className="text-xs text-gray-500">{note}</span>}
      </div>

      <Plot
        data={[
          actB.length && {
            x: actB,
            y: base,
            type: "scattergl",
            mode: "markers",
            name: "Baseline",
            marker: { size: 4, opacity: 0.6 },
          },
          actC.length && {
            x: actC,
            y: corr,
            type: "scattergl",
            mode: "markers",
            name: "Corrected",
            marker: { size: 4, opacity: 0.6 },
          },
          {
            x: [minA, maxA],
            y: [minA, maxA],
            mode: "lines",
            name: "y = x",
            line: { width: 1, color: "black", dash: "dash" },
            hoverinfo: "skip",
          },
        ].filter(Boolean)}
        layout={{
          autosize: true,
          height: 360,
          margin: { l: 60, r: 20, t: 10, b: 45 },
          xaxis: { title: "Actual" },
          yaxis: { title: "Predicted" },
          legend: { orientation: "h", y: -0.2 },
          hovermode: "closest",
        }}
        config={{ responsive: true, displaylogo: false }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
