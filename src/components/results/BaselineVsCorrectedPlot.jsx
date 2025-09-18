// src/components/results/BaselineVsCorrectedPlot.jsx
import React from "react";
import Plot from "react-plotly.js";

export default function BaselineVsCorrectedPlot({
  timeData,
  actualData,
  baselinePrediction,
  correctedPrediction,
  modelName,
  title,
}) {
  const actual    = typeof actualData === "string" ? JSON.parse(actualData) : actualData;
  const baseline  = typeof baselinePrediction === "string" ? JSON.parse(baselinePrediction) : baselinePrediction;
  const corrected = typeof correctedPrediction === "string" ? JSON.parse(correctedPrediction) : correctedPrediction;
  const t         = typeof timeData === "string" ? JSON.parse(timeData) : timeData;

  if (!actual?.length || !baseline?.length || !corrected?.length) {
    return <div className="mt-4 rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm font-medium">
      Invalid data for plotting
    </div>;
  }

  const xAxis = (t && t.length === actual.length)
    ? t
    : Array.from({ length: actual.length }, (_, i) => i);

  return (
    <div className="my-6">
      <div className="mb-3">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight">
          {title || `Baseline + Correction vs Ground Truth – ${modelName}`}
        </h2>
      </div>

      <div className="rounded-xl border border-gray-200 p-2 shadow-sm">
        <Plot
          data={[
            { x: xAxis, y: actual,   mode: "lines", name: "Actual",    line: { width: 1.2, color: "black" } },
            { x: xAxis, y: baseline, mode: "lines", name: "Baseline",  line: { width: 1,   color: "royalblue", dash: "dot" } },
            { x: xAxis, y: corrected,mode: "lines", name: "Corrected", line: { width: 1,   color: "seagreen" } },
          ]}
          layout={{
            autosize: true,
            height: 440,
            margin: { l: 55, r: 20, t: 10, b: 45 },
            xaxis: {
              automargin: true,
              title: { text: "", standoff: 8 },
              showgrid: false,
            },
            yaxis: {
              automargin: true,
              title: { text: "", standoff: 8 },
              zeroline: false,
              gridcolor: "rgba(0,0,0,0.06)",
            },
            legend: { orientation: "h", y: -0.2, x: 0, font: { size: 12 } },
          }}
          config={{
            responsive: true,
            displaylogo: false,
            modeBarButtonsToRemove: [
              "lasso2d","select2d","toggleSpikelines","autoScale2d",
            ],
          }}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler
        />
      </div>
    </div>
  );
}
