// src/components/results/ModelComparisonBar.jsx
import React, { useMemo } from "react";
import Plot from "react-plotly.js";

export default function ModelComparisonBar({
  normalizedRowsForSplit = [],
  dropBest = true,              // remove the best (lowest nRMSE) bar
  minDeltaPctToShow = 0.001,    // remove near-ties: Δ(best) < this %, set 0 to keep all
  debug = true,                 // prints before/after lists so you can verify filtering
}) {
  const data = useMemo(() => {
    const EPS = 1e-12;

    // Build clean rows, skip baseline + non-finite numbers
    const allRows = (normalizedRowsForSplit || [])
      .filter(r => String(r.category).toLowerCase() !== "baseline")
      .map(r => ({
        model: String(r.model ?? ""),
        rmse:  Number(r.rmse_test),
        nrmse: Number(r.normalized_rmse),
      }))
      .filter(r => r.model && Number.isFinite(r.rmse) && Number.isFinite(r.nrmse));

    // Remove models with any zero normalized RMSE
    const nonZero = allRows.filter(r => Math.abs(r.nrmse) > EPS);

    if (debug) {
      console.log("[ModelComparisonBar] input count:", (normalizedRowsForSplit || []).length);
      console.log("[ModelComparisonBar] after baseline & finite:", allRows.length);
      console.log("[ModelComparisonBar] after nonZero nrmse:", nonZero.length);
      console.table(nonZero.map(r => ({ model: r.model, rmse: r.rmse, nrmse: r.nrmse })));
    }

    if (!nonZero.length) {
      return { models: [], rmse: [], nrmse: [], deltas: [], removed: [] };
    }

    // Sort by normalized RMSE (lower is better)
    nonZero.sort((a, b) => a.nrmse - b.nrmse);

    const best = nonZero[0].nrmse;
    const removed = [];
    const filtered = nonZero.filter((r, i) => {
      if (dropBest && i === 0) {
        removed.push({ reason: "best", ...r });
        return false;
      }
      const deltaPct = ((r.nrmse - best) / best) * 100;
      if (deltaPct < (minDeltaPctToShow ?? 0)) {
        removed.push({ reason: "near-tie", deltaPct, ...r });
        return false;
      }
      return true;
    });

    const models = filtered.map(r => r.model);
    const rmse   = filtered.map(r => r.rmse);
    const nrmse  = filtered.map(r => r.nrmse);

    // For labels (relative to true best, even if we dropped it)
    const deltas = nrmse.map(v => ((v - best) / best) * 100);

    if (debug) {
      console.log("[ModelComparisonBar] removed:", removed);
      console.table(removed.map(r => ({
        reason: r.reason, model: r.model, nrmse: r.nrmse,
        deltaPct: r.deltaPct ?? ((r.nrmse - best) / best) * 100
      })));
      console.log("[ModelComparisonBar] final models:", models);
    }

    return { models, rmse, nrmse, deltas, removed };
  }, [normalizedRowsForSplit, dropBest, minDeltaPctToShow, debug]);

  if (!data.models.length) return null;

  // Δ labels on the orange bars
  const deltaText = data.deltas.map(d =>
    Math.abs(d) < 0.001 ? "Δ <0.001%" : `Δ ${d.toFixed(3)}%`
  );

  return (
    <div className="my-6 rounded-xl border border-gray-200 p-2 shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Model Comparison (RMSE & Normalized)</h3>
      <Plot
        data={[
          // Put RMSE on its own axis so it’s visible
          {
            x: data.models,
            y: data.rmse,
            type: "bar",
            name: "RMSE",
            marker: { opacity: 0.9 },
            yaxis: "y2",
            hovertemplate: "<b>%{x}</b><br>RMSE: %{y:.6f}<extra></extra>",
          },
          {
            x: data.models,
            y: data.nrmse,
            type: "bar",
            name: "Normalized RMSE",
            marker: { opacity: 0.9 },
            text: deltaText,
            textposition: "outside",
            hovertemplate:
              "<b>%{x}</b><br>nRMSE: %{y:.6f}<br>%{text}<extra></extra>",
          },
        ]}
        layout={{
          barmode: "group",
          autosize: true,
          height: 380,
          margin: { l: 60, r: 60, t: 10, b: 90 },
          xaxis: { tickangle: -30, automargin: true },

          // Left y-axis for nRMSE
          yaxis: {
            title: "Normalized RMSE",
            tickformat: ".6f",
            rangemode: "tozero",
          },
          // Right y-axis for RMSE so it’s not squashed at zero
          yaxis2: {
            title: "RMSE",
            overlaying: "y",
            side: "right",
            tickformat: ".6f",
            showgrid: false,
            rangemode: "tozero",
          },

          legend: { orientation: "h", y: -0.25 },
          uniformtext: { mode: "hide", minsize: 10 },
        }}
        config={{ responsive: true, displaylogo: false }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
