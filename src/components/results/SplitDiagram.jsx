// src/components/results/SplitDiagram.jsx
import React, { useMemo } from "react";
import Plot from "react-plotly.js";

/**
 * Simple train/test split illustration based on a split label like "split_70_30".
 * If totalN is unknown, the diagram still renders as percentages.
 */
export default function SplitDiagram({ splitId, totalN }) {
  const { trainPct, testPct } = useMemo(() => {
    // parse "split_70_30" → 70 / 30
    const m = String(splitId || "").match(/split_(\d+)[-_](\d+)/i);
    const t = m ? Number(m[1]) : 80;
    const u = m ? Number(m[2]) : 20;
    return { trainPct: t, testPct: u };
  }, [splitId]);

  const trainN = totalN ? Math.round((trainPct / 100) * totalN) : null;
  const testN = totalN ? Math.round((testPct / 100) * totalN) : null;

  const text =
    totalN && trainN != null && testN != null
      ? [`Train ${trainPct}% (${trainN})`, `Test ${testPct}% (${testN})`]
      : [`Train ${trainPct}%`, `Test ${testPct}%`];

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Train–Test Split</h3>
      <Plot
        style={{ width: "100%", height: 200 }}
        config={{ displaylogo: false, responsive: true }}
        data={[
          {
            type: "bar",
            x: [trainPct, testPct],
            y: ["Split"],
            text,
            textposition: "inside",
            hovertemplate: "%{text}<extra></extra>",
            marker: { opacity: 0.85 },
            orientation: "h",
          },
        ]}
        layout={{
          barmode: "stack",
          xaxis: { range: [0, 100], ticksuffix: "%", fixedrange: true },
          yaxis: { fixedrange: true },
          margin: { l: 60, r: 20, t: 10, b: 30 },
          showlegend: false,
        }}
      />
    </div>
  );
}
