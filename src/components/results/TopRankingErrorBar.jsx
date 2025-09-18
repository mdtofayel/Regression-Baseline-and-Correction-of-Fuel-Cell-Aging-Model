// src/components/results/TopRankingErrorBar.jsx
import React, { useMemo } from "react";
import Plot from "react-plotly.js";

/**
 * Top-10 models by mean normalized RMSE with error bars (std across splits).
 * - Removes models with any zero normalized_rmse.
 * - Removes the best model (lowest mean) from the chart (dropBest = true).
 * - Optionally removes models whose delta to best < minDeltaPctToShow (default 0.001%).
 */
export default function TopRankingErrorBar({
  normalizedRowsForDataset,
  stdRowsForDataset = null,
  dropBest = true,
  minDeltaPctToShow = 0.001, // %; set 0 to show all non-best models
}) {
  const stats = useMemo(() => {
    if (!Array.isArray(normalizedRowsForDataset) || !normalizedRowsForDataset.length) return [];

    const EPS = 1e-12;

    // Group normalized_rmse by model
    const byModel = new Map();
    for (const r of normalizedRowsForDataset) {
      const model = String(r.model ?? "");
      const v = Number(r.normalized_rmse);
      if (!Number.isFinite(v) || !model) continue;
      (byModel.get(model) ?? byModel.set(model, []).get(model)).push(v);
    }

    // Remove models with any zero result
    for (const [model, arr] of Array.from(byModel.entries())) {
      if (arr.some((v) => Math.abs(v) <= EPS)) byModel.delete(model);
    }

    // helpers
    const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
    const std = (a) => {
      if (a.length < 2) return 0;
      const m = mean(a);
      return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1));
    };

    // compute from normalized_results
    let rows = Array.from(byModel, ([model, arr]) => ({
      model,
      mean: mean(arr),
      std: std(arr),
      n: arr.length,
    }));

    // optional override from std_analysis.csv
    if (Array.isArray(stdRowsForDataset) && stdRowsForDataset.length) {
      const override = new Map();
      for (const r of stdRowsForDataset) {
        const k = String(r.model ?? "");
        const m = Number(r.mean_normalized_rmse ?? r.mean);
        const s = Number(r.std_normalized_rmse ?? r.std);
        if (!k) continue;
        override.set(k, {
          mean: Number.isFinite(m) ? m : undefined,
          std: Number.isFinite(s) ? s : undefined,
        });
      }
      rows = rows.map((r) => {
        const ov = override.get(r.model);
        return ov
          ? { ...r, ...Object.fromEntries(Object.entries(ov).filter(([, v]) => v !== undefined)) }
          : r;
      });
    }

    // remove any rows whose mean is ~0 (safety)
    rows = rows.filter((r) => !(Math.abs(r.mean) <= EPS));

    // order by mean (lower is better)
    rows.sort((a, b) => a.mean - b.mean);
    if (!rows.length) return [];

    // drop the best model entirely, and optionally near-ties
    const best = rows[0].mean;
    rows = rows.filter((r, i) => {
      if (dropBest && i === 0) return false; // remove best
      const deltaPct = ((r.mean - best) / best) * 100;
      return deltaPct >= (minDeltaPctToShow ?? 0);
    });

    return rows.slice(0, 10);
  }, [normalizedRowsForDataset, stdRowsForDataset, dropBest, minDeltaPctToShow]);

  if (!stats.length) return null;

  const x = stats.map((s) => s.model);
  const y = stats.map((s) => s.mean);
  const yErr = stats.map((s) => s.std);

  // deltas for display (relative to the *true* best that was removed)
  const trueBest = Math.min(...y.map(Number), Infinity); // not used for filtering now
  const ymin = Math.min(...y);
  const ymax = Math.max(...y);
  const span = Math.max(1e-8, ymax - ymin);
  const pad  = Math.max(1e-4, span * 0.15);

  // Using the first bar’s mean as local best for nice labels
  const localBest = Math.min(...y);
  const deltaPct = y.map((v) => ((v - localBest) / localBest) * 100);
  const displayText = deltaPct.map((d) => (Math.abs(d) < 0.001 ? "Δ <0.001%" : `Δ ${d.toFixed(3)}%`));

  return (
    <div className="mt-12">
      <h3 className="text-lg font-semibold mb-3">Top Models (Mean Normalized RMSE ± Std)</h3>
      <Plot
        style={{ width: "100%", height: 440 }}
        config={{ displaylogo: false, responsive: true }}
        data={[
          {
            type: "bar",
            x,
            y,
            error_y: { type: "data", array: yErr, visible: true },
            text: displayText,
            textposition: "outside",
            marker: { opacity: 0.9 },
            hovertemplate:
              "<b>%{x}</b><br>" +
              "Mean nRMSE: %{y:.6f}<br>" +
              "Std: %{error_y.array:.6f}<br>" +
              `Δ to best (shown): %{customdata:.6f}%<extra></extra>`,
            customdata: deltaPct,
          },
        ]}
        layout={{
          margin: { l: 70, r: 20, t: 25, b: 110 },
          xaxis: { tickangle: -30, automargin: true },
          yaxis: {
            title: "Mean normalized RMSE (lower is better)",
            range: [ymin - pad, ymax + pad],
            tickformat: ".4f",
          },
          uniformtext: { mode: "hide", minsize: 10 },
          showlegend: false,
        }}
      />
    </div>
  );
}
