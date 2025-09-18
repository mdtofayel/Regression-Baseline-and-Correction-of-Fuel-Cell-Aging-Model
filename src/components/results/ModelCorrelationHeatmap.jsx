// src/components/results/ModelCorrelationHeatmap.jsx
import React, { useMemo } from "react";
import Plot from "react-plotly.js";

/**
 * Correlation heatmap between models using normalized RMSE across splits
 * for the selected dataset. Expects rows from normalized_results.csv.
 */
export default function ModelCorrelationHeatmap({ normalizedRowsForDataset }) {
  // Build model -> vector of normalized_rmse across splits
  const { models, corrMatrix } = useMemo(() => {
    if (!Array.isArray(normalizedRowsForDataset) || !normalizedRowsForDataset.length) {
      return { models: [], corrMatrix: [] };
    }

    // collect splits
    const splits = Array.from(
      new Set(normalizedRowsForDataset.map((r) => r.split_id))
    );

    // model vectors
    const byModel = new Map();
    normalizedRowsForDataset.forEach((r) => {
      const model = String(r.model);
      const v = byModel.get(model) || new Map();
      v.set(r.split_id, Number(r.normalized_rmse));
      byModel.set(model, v);
    });

    const modelsList = Array.from(byModel.keys()).sort();

    // build dense vectors aligned by 'splits' order
    const dense = modelsList.map((m) =>
      splits.map((s) => {
        const v = byModel.get(m).get(s);
        return Number.isFinite(v) ? v : NaN;
      })
    );

    // helper: pearson correlation with NaN handling (pairwise complete)
    const corr = (a, b) => {
      const pairs = [];
      for (let i = 0; i < a.length; i++) {
        const x = a[i], y = b[i];
        if (Number.isFinite(x) && Number.isFinite(y)) pairs.push([x, y]);
      }
      if (pairs.length < 2) return NaN;
      const xs = pairs.map((p) => p[0]);
      const ys = pairs.map((p) => p[1]);
      const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
      const mx = mean(xs), my = mean(ys);
      let num = 0, dx = 0, dy = 0;
      for (let i = 0; i < pairs.length; i++) {
        const ax = xs[i] - mx, ay = ys[i] - my;
        num += ax * ay; dx += ax * ax; dy += ay * ay;
      }
      const den = Math.sqrt(dx * dy);
      return den === 0 ? NaN : num / den;
    };

    const M = modelsList.length;
    const matrix = Array.from({ length: M }, (_, i) =>
      Array.from({ length: M }, (_, j) => (i === j ? 1 : corr(dense[i], dense[j])))
    );

    return { models: modelsList, corrMatrix: matrix };
  }, [normalizedRowsForDataset]);

  if (!models.length) return null;

  return (
    <div className="mt-12">
      <h3 className="text-lg font-semibold mb-3">Cross-Model Correlation (Normalized RMSE)</h3>
      <Plot
        style={{ width: "100%", height: 520 }}
        config={{ displaylogo: false, responsive: true }}
        data={[
          {
            type: "heatmap",
            z: corrMatrix,
            x: models,
            y: models,
            colorscale: [
              [0, "Black"],
              [0.5, "yellow"],
              [1, "yellow"]
            ],
            reversescale: true,
            zmin: 0.9,
            zmax: 1,
            hovertemplate: "Model X: %{x}<br>Model Y: %{y}<br>r = %{z:.2f}<extra></extra>",
          },
        ]}
        layout={{
          margin: { l: 120, r: 20, t: 20, b: 140 },
          xaxis: { tickangle: -35, automargin: true },
          yaxis: { automargin: true },
        }}
      />
    </div>
  );
}
