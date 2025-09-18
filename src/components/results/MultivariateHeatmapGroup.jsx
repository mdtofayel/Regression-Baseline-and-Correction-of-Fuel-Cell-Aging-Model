import React from "react";
import MultivariateHeatmap from "./MultivariateHeatmap";
import MultivariatePredictionLineChart from "./MultivariatePredictionLineChart";
import PcaScatterPlot from "./PcaScatterPlot";
import PredictionLineChart from "./PredictionLineChart";
import ParallelCoordinatesPlot from "./ParallelCoordinatesPlot";

export default function MultivariateHeatmapGroup({ splits, normalizedResults }) {
  if (!splits || Object.keys(splits).length === 0) return null;

  return (
    <div className="my-6">
      <h2 className="text-lg font-semibold mb-4">📊 Per-Split RMSE & Multivariate Diagrams</h2>

      {/* 🔁 Iterate over each split */}
      {Object.entries(splits).map(([splitName, files]) => {
        const xTest = files["x_test.csv"];
        const yTest = files["y_test.csv"];
        const modelResults = files["model_results.csv"];

        const xTestArray =
          xTest && Array.isArray(xTest)
            ? xTest.map((row) => Object.values(row).map((v) => parseFloat(v)))
            : [];

        return (
          <div key={splitName} className="mb-10 border-t pt-6">
            <h3 className="text-md font-bold text-gray-800 mb-3">
              🔹 Split: <span className="text-blue-600">{splitName}</span>
            </h3>

            {/* 🔥 Multivariate Heatmap */}
            {xTestArray.length > 0 && (
              <MultivariateHeatmap xTest={xTestArray} splitName={splitName} />
            )}

            {/* 📈 Prediction vs Actual Chart */}
            {modelResults && yTest && (
              <MultivariatePredictionLineChart
                yTest={yTest}
                modelResults={modelResults}
                splitName={splitName}
              />
            )}

            {/* 📉 First X sample Line Plot */}
            {xTestArray.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold mb-2">
                  🧬 First X Sample – Feature-wise Plot
                </h4>
                <PredictionLineChart sample={xTestArray[0]} />
              </div>
            )}
          </div>
        );
      })}

      {/* 🧠 PCA Scatter Plot */}
      {normalizedResults?.length > 0 && (
        <div className="my-10">
          <h3 className="text-md font-semibold mb-2">🧠 PCA Scatter Plot</h3>
          <PcaScatterPlot data={normalizedResults} />
        </div>
      )}

      {/* 🌐 Parallel Coordinates */}
      {normalizedResults?.length > 0 && (
        <div className="my-10">
          <h3 className="text-md font-semibold mb-2">🌐 Parallel Coordinates Plot</h3>
          <ParallelCoordinatesPlot data={normalizedResults} />
        </div>
      )}
    </div>
  );
}
