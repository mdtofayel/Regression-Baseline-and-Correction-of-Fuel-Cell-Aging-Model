import React from "react";
import Plot from "react-plotly.js";

export default function GlobalModelResultsChart({ globalResults }) {
  if (!globalResults || globalResults.length === 0) return null;

  const uniqueModels = [...new Set(globalResults.map(r => r.model))];

  // Assign colors
  const colorMap = {};
  const palette = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
  ];
  uniqueModels.forEach((model, idx) => {
    colorMap[model] = palette[idx % palette.length];
  });

  const traces = uniqueModels.map(model => {
    const subset = globalResults.filter(r => r.model === model);
    return {
      x: subset.map(r => r.dataset_name),
      y: subset.map(r => parseFloat(r.rmse)),
      z: subset.map((_, idx) => idx),
      text: subset.map(() => `${model}`),
      name: model,
      mode: "markers",
      type: "scatter3d",
      marker: { size: 5, color: colorMap[model] },
      hovertemplate: "Dataset: %{x}<br>RMSE: %{y}<br>Model: %{text}<extra></extra>"
    };
  });

  return (
    <div className="my-6 relative">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">
        Global Model Performance (3D Overview)
      </h3>

      <div className="relative">
        {/* Wrapper for the legend to allow scrolling */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "10px",
            maxHeight: "200px", // Limit height
            overflowY: uniqueModels.length > 10 ? "auto" : "visible",
            zIndex: 10,
            backgroundColor: "rgba(255,255,255,0.9)",
            border: "1px solid #ccc",
            padding: "5px",
            fontSize: "12px"
          }}
        >
          <strong>Models</strong>
          <ul style={{ margin: 0, paddingLeft: "15px" }}>
            {uniqueModels.map((model, idx) => (
              <li key={idx} style={{ color: colorMap[model] }}>
                {model}
              </li>
            ))}
          </ul>
        </div>

        <Plot
          data={traces}
          layout={{
            autosize: true,
            height: 600,
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
              xaxis: { title: "Dataset" },
              yaxis: { title: "RMSE" },
              zaxis: { title: "Index (per point)" }
            },
            showlegend: false // Disable Plotly's built-in legend
          }}
          config={{
            displayModeBar: false
          }}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}
