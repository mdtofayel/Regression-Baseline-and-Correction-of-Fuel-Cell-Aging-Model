// src/pages/ShowResultPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchDatasets, fetchOverview, fetchSeriesBundle } from "../services/showResultService";
import { FaFolderOpen } from "react-icons/fa";
import DatasetModelTable from "../components/results/DatasetModelTable";
import BaselineVsCorrectedPlot from "../components/results/BaselineVsCorrectedPlot";
import ChartLoader from "../components/common/ChartLoader";
import {
  fetchDatasets,
  fetchAutoParsedRmse,
  fetchOverview,
  fetchSeriesBundle,
} from "../services/showResultService";


export default function ShowResultPage() {
  const { folderName } = useParams();
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [parsedResults, setParsedResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedModel, setSelectedModel] = useState("");
  const [series, setSeries] = useState(null); // { t, actual, baseline, models: { m: { corrected,... } } }

  // 1) list datasets
  useEffect(() => {
    if (!folderName) return;
    fetchDatasets(folderName).then(setDatasets).catch(console.error);
  }, [folderName]);

  // 2) overview for selected dataset
  useEffect(() => {
    if (!folderName || !selectedDataset) return;
    setLoading(true);
    fetchOverview(folderName, selectedDataset)
      .then((data) => {
        setParsedResults({
          splits: data.splits || [],
          normalized_results: data["normalized_results.csv"] || [],
          std_analysis: data["std_analysis.csv"] || [],
          global_results: data["global_model_results"] || [],
        });
      })
      .finally(() => setLoading(false));
  }, [folderName, selectedDataset]);

  // 3) when a model is chosen, fetch its time series (using row.split_id)
  useEffect(() => {
    const run = async () => {
      if (!selectedModel || !parsedResults) return;
      const row = parsedResults.global_results.find(
        (r) => r.model === selectedModel && r.split_id && r.dataset_name === selectedDataset
      );
      if (!row) return;

      const splitId = row.split_id; // e.g. "split_80_20"
      const bundle = await fetchSeriesBundle(folderName, selectedDataset, splitId, [selectedModel]);
      setSeries(bundle);
    };
    run().catch(console.error);
  }, [selectedModel, parsedResults, folderName, selectedDataset]);

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[980px] px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center text-base md:text-lg font-semibold">
            <FaFolderOpen className="mr-2 text-blue-600" />
            ML Run ID:
            <span className="ml-2 text-blue-700 underline">{decodeURIComponent(folderName)}</span>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            {/* Dataset */}
            <div className="flex items-center gap-2 text-base">
              <label className="font-medium text-gray-800">Select Dataset:</label>
              <select
                value={selectedDataset}
                onChange={(e) => {
                  setSelectedDataset(e.target.value);
                  setSelectedModel("");
                  setSeries(null);
                }}
                className="p-2 border border-gray-300 rounded-md shadow-sm text-sm"
              >
                <option value="">-- Select a dataset --</option>
                {datasets.map((ds) => (
                  <option key={ds} value={ds}>{ds}</option>
                ))}
              </select>
            </div>

            {/* Model */}
            {!!parsedResults?.global_results?.length && (
              <div className="flex items-center gap-2 text-base">
                <label className="font-medium text-gray-800">Compare Model:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">-- Select a model --</option>
                  {[...new Set(parsedResults.global_results.map((r) => r.model))].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Loader */}
        {loading && <ChartLoader />}

        {/* Results */}
        {!loading && parsedResults && (
          <>
            <DatasetModelTable normalizedResults={parsedResults.normalized_results} />

            {selectedModel && series?.models?.[selectedModel] && (
              <BaselineVsCorrectedPlot
                timeData={series.t}
                actualData={series.actual}
                baselinePrediction={series.baseline}
                correctedPrediction={series.models[selectedModel].corrected}
                modelName={selectedModel}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
