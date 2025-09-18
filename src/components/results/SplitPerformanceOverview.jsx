// src/components/results/SplitPerformanceOverview.jsx
import React from "react";
import Plot from "react-plotly.js";

export default function SplitPerformanceOverview({ splits }) {
  if (!splits || typeof splits !== "object") return null;

  // Create a 3D-effect bar chart with distinct colors per model
  const create3DBarChart = (title, data) => {
  const palette = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
  ];
  const colors = data.map((_, i) => palette[i % palette.length]);

  return (
    <Plot
      data={[
        {
          x: data.map(d => d.model),                            // Model names
          y: data.map(d => Number(d.rmse_validation)),          // ✅ Use correct RMSE field
          type: "bar",
          marker: {
            color: colors,
            line: { color: "#333", width: 1 }
          },
          text: data.map(d => {
            const rmse = Number(d.rmse_validation);
            return isNaN(rmse) ? "N/A" : rmse.toFixed(2);        // ✅ Prevent error
          }),
          textposition: "auto",
          hovertemplate: "Model: %{x}<br>RMSE: %{y}<extra></extra>"
        }
      ]}
      layout={{
        title: { text: title, font: { size: 18 } },
        height: 500,
        margin: { l: 70, r: 30, t: 70, b: 120 },
        xaxis: {
          title: {
            text: "Model Name (X-axis)",
            font: { size: 14, color: "#333" }
          },
          tickangle: -45,
          automargin: true
        },
        yaxis: {
          title: {
            text: "RMSE (Validation)",
            font: { size: 14, color: "#333" }
          },
          automargin: true
        },
        bargap: 0.3,
        scene: { camera: { eye: { x: 1.5, y: 1, z: 0.5 } } }
      }}
      config={{ displayModeBar: false }}
      style={{ width: "100%" }}
    />
  );
};


  return (
    <div className="my-8">
      {Object.entries(splits).map(([split, result]) => {
        const results = result["model_results.csv"] || [];
        if (!results.length) return null;

        const topHigh = results.slice().sort((a, b) => b.rmse - a.rmse).slice(0, 6);
        const topLow = results.slice().sort((a, b) => a.rmse - b.rmse).slice(0, 6);

        return (
          <div key={split} className="mb-12">
            <h3 className="font-semibold text-lg mb-4">Split: {split}</h3>

            {/* 3D-like Full Split Overview */}
            {create3DBarChart(`All Models – ${split}`, results)}

            {/* 3D-like Top 6 Highest */}
            {create3DBarChart(`🔺 Top 6 Models (Highest RMSE) – ${split}`, topHigh)}

            {/* 3D-like Top 6 Lowest */}
            {create3DBarChart(`✅ Top 6 Models (Lowest RMSE) – ${split}`, topLow)}
          </div>
        );
      })}
    </div>
  );
}
