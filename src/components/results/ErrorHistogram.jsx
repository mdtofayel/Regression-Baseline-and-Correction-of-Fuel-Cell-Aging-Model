// src/components/results/ErrorHistogram.jsx
import React, { useMemo } from "react";
import Plot from "react-plotly.js";

export default function ErrorHistogram({ actual, corrected, baseline, bins = 60 }) {
  const ya = actual || [], yc = corrected || [], yb = baseline || [];
  const { eM, eB } = useMemo(() => {
    const n = Math.min(ya.length, yc.length, yb.length);
    const m = new Array(n), b = new Array(n);
    for (let i = 0; i < n; i++) { m[i] = ya[i] - yc[i]; b[i] = ya[i] - yb[i]; }
    return { eM: m, eB: b };
  }, [ya, yc, yb]);

  if (!eM.length) return null;

  return (
    <div className="my-6 rounded-xl border border-gray-200 p-2 shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Error Distribution</h3>
      <Plot
        data={[
          { x: eB, type: "histogram", name: "Actual − Baseline", opacity: 0.5, nbinsx: bins },
          { x: eM, type: "histogram", name: "Actual − Corrected", opacity: 0.5, nbinsx: bins },
        ]}
        layout={{
          barmode: "overlay",
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
