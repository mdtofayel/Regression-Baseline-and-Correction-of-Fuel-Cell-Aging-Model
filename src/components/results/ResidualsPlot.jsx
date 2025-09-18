// src/components/results/ResidualsPlot.jsx
import React, { useMemo } from "react";
import Plot from "react-plotly.js";

export default function ResidualsPlot({ timeData, actual, corrected, baseline }) {
  const t  = Array.isArray(timeData) ? timeData : [];
  const ya = Array.isArray(actual) ? actual : [];
  const yc = Array.isArray(corrected) ? corrected : [];
  const yb = Array.isArray(baseline) ? baseline : [];

  const { resModel, resBase, x } = useMemo(() => {
    const n = Math.min(ya.length, yc.length, yb.length, t.length || Infinity);
    const xAxis = (t.length === n ? t.slice(0, n) : Array.from({ length: n }, (_, i) => i));
    const rM = new Array(n);
    const rB = new Array(n);
    for (let i = 0; i < n; i++) { rM[i] = ya[i] - yc[i]; rB[i] = ya[i] - yb[i]; }
    return { resModel: rM, resBase: rB, x: xAxis };
  }, [t, ya, yc, yb]);

  if (!x.length) return null;

  return (
    <div className="my-6 rounded-xl border border-gray-200 p-2 shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Residuals Over Time</h3>
      <Plot
        data={[
          { x, y: resBase,  mode: "lines", name: "Actual − Baseline",  line: { width: 1, color: "royalblue", dash: "dot" } },
          { x, y: resModel, mode: "lines", name: "Actual − Corrected", line: { width: 1, color: "seagreen" } },
        ]}
        layout={{
          autosize: true, height: 360,
          margin: { l: 60, r: 20, t: 10, b: 45 },
          yaxis: { zeroline: true, zerolinecolor: "#999", gridcolor: "rgba(0,0,0,0.06)" },
          legend: { orientation: "h", y: -0.2 },
        }}
        config={{ responsive: true, displaylogo: false }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
