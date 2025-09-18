// src/components/results/ModelErrorBoxPlot.jsx
import React from "react";
import Plot from "react-plotly.js";

export default function ModelErrorBoxPlot({ stdAnalysis }) {
  if (!stdAnalysis || stdAnalysis.length === 0) return null;

  // Transform and clean the data
  const data = stdAnalysis
    .map((d) => ({
      model: d.model,
      std: parseFloat(d.std_rmse),
    }))
    .filter((d) => !isNaN(d.std));

  if (data.length === 0) return null;

  // Generate a color palette for distinct model bars
  const palette = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
  ];
  const colors = data.map((_, i) => palette[i % palette.length]);

  return (
    <div className="my-6">
      <h2 className="text-lg font-semibold mb-4">
        Model Error Standard Deviation (3D-style)
      </h2>
      <Plot
        data={[
          {
            x: data.map((d) => d.model), // X-axis: Model names
            y: data.map((d) => d.std),   // Y-axis: Standard deviation values
            type: "bar",
            marker: {
              color: colors,
              line: { color: "#333", width: 1 }
            },
            text: data.map((d) => d.std.toFixed(3)),
            textposition: "auto",
            hovertemplate: "Model: %{x}<br>Std Dev (RMSE): %{y}<extra></extra>"
          }
        ]}
        layout={{
          title: { text: "Model RMSE Standard Deviation", font: { size: 18 } },
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
              text: "Standard Deviation (Y-axis)",
              font: { size: 14, color: "#333" }
            },
            automargin: true
          },
          bargap: 0.3,
          // Adds a slight 3D effect by tilting the camera
          scene: { camera: { eye: { x: 1.5, y: 1, z: 0.5 } } }
        }}
        config={{ displayModeBar: false }} // Hides Plotly toolbar
        style={{ width: "100%" }}
      />
    </div>
  );
}
