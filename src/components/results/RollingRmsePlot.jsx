// src/components/results/RollingRmsePlot.jsx
import React, { useMemo } from "react";
import Plot from "react-plotly.js";

function rmse(a, b) {
  const n = Math.min(a.length, b.length);
  if (!n) return NaN;
  let s = 0;
  for (let i = 0; i < n; i++) { const e = a[i] - b[i]; s += e * e; }
  return Math.sqrt(s / n);
}

export default function RollingRmsePlot({ timeData, actual, corrected, baseline, window = 2000 }) {
  const t = timeData || [], y = actual || [], c = corrected || [], b = baseline || [];
  const n = Math.min(t.length || Infinity, y.length, c.length, b.length);
  if (!n) return null;

  const { x, rModel, rBase } = useMemo(() => {
    const x = [], m = [], bb = [];
    const step = Math.max(1, Math.floor(window / 5));
    for (let i = 0; i < n - window; i += step) {
      const ys = y.slice(i, i + window);
      const cs = c.slice(i, i + window);
      const bs = b.slice(i, i + window);
      const tx = (t.length === n ? t[i + Math.floor(window / 2)] : i + Math.floor(window / 2));
      x.push(tx);
      m.push(rmse(ys, cs));
      bb.push(rmse(ys, bs));
    }
    return { x, rModel: m, rBase: bb };
  }, [t, y, c, b, n, window]);

  if (!x.length) return null;

  return (
    <div className="my-6 rounded-xl border border-gray-200 p-2 shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Rolling RMSE (window {window})</h3>
      <Plot
        data={[
          { x, y: rBase,  mode: "lines", name: "Baseline RMSE",  line: { width: 1, color: "royalblue", dash: "dot" } },
          { x, y: rModel, mode: "lines", name: "Corrected RMSE", line: { width: 1, color: "seagreen" } },
        ]}
        layout={{
          autosize: true, height: 360,
          margin: { l: 60, r: 20, t: 10, b: 45 },
          legend: { orientation: "h", y: -0.2 },
        }}
        config={{ responsive: true, displaylogo: false }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
