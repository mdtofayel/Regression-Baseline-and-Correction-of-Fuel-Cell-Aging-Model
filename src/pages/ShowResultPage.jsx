// src/pages/ShowResultPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  fetchDatasets,
  fetchAutoParsedRmse,   // returns summary/files (shape may vary)
  fetchSeriesBundle,     // returns series bundle for split+model
} from "../services/showResultService";

import { FaFolderOpen } from "react-icons/fa";
import ChartLoader from "../components/common/ChartLoader";
import BaselineVsCorrectedPlot from "../components/results/BaselineVsCorrectedPlot";
import DatasetModelTable from "../components/results/DatasetModelTable";
import ResidualsPlot from "../components/results/ResidualsPlot";
import ErrorHistogram from "../components/results/ErrorHistogram";
import ActualVsPredScatter from "../components/results/ActualVsPredScatter";
import RollingRmsePlot from "../components/results/RollingRmsePlot";
import ModelComparisonBar from "../components/results/ModelComparisonBar";
import DatasetCsvViewer from "../components/results/DatasetCsvViewer";

// Extras
import SplitDiagram from "../components/results/SplitDiagram";
import ModelCorrelationHeatmap from "../components/results/ModelCorrelationHeatmap";
import TopRankingErrorBar from "../components/results/TopRankingErrorBar";

export default function ShowResultPage() {
  const { folderName } = useParams();

  // ===== DEBUG SWITCH =====
  const DEBUG = true;
  const logD = (...args) => DEBUG && console.log("[ShowResult]", ...args);
  const warnD = (...args) => DEBUG && console.warn("[ShowResult]", ...args);
  const group = (title) => DEBUG && console.groupCollapsed(title);
  const groupEnd = () => DEBUG && console.groupEnd();

  // selectors
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [splits, setSplits] = useState([]);
  const [selectedSplit, setSelectedSplit] = useState("");
  const [modelsForSplit, setModelsForSplit] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");

  // data from backend
  const [parsedResults, setParsedResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // series for plot
  const [baselineData, setBaselineData] = useState(null); // { actual, baseline, corrected, timeData }

  // Cache to avoid re-fetching
  const [bundleCache, setBundleCache] = useState({});

  // ---------------- helpers ----------------
  const s = (v) => String(v ?? "").trim();
  const eq = (a, b) => s(a).toLowerCase() === s(b).toLowerCase();
  const isObject = (x) => x && typeof x === "object";
  const isArray = Array.isArray;

  const looksLikeNormRow = (r) =>
    isObject(r) && ("dataset_name" in r) && ("split_id" in r) && ("model" in r);

  const uniq = (arr) => [...new Set(arr)];

  const summarizeRows = (rows) => {
    const datasetsU = uniq(rows.map((r) => s(r?.dataset_name)).filter(Boolean));
    const splitsU = uniq(rows.map((r) => s(r?.split_id)).filter(Boolean));
    const modelsU = uniq(rows.map((r) => s(r?.model)).filter(Boolean));
    return { count: rows.length, datasetsU, splitsU, modelsU };
  };

  // Deeply collect arrays of rows that look like normalized results
  // (INCREASED limit + recognizes common `.data` wrappers)
  const collectNormalizedRowsDeep = (root) => {
    if (!root) return [];
    const out = [];
    const seen = new Set();
    const stack = [root];

    const STEP_LIMIT = 200000; // handle very large responses safely
    let steps = 0;

    while (stack.length && steps < STEP_LIMIT) {
      steps++;
      const cur = stack.pop();
      if (!cur || typeof cur !== "object") continue;
      if (seen.has(cur)) continue;
      try { seen.add(cur); } catch {}

      if (Array.isArray(cur)) {
        if (cur.length && cur.every(looksLikeNormRow)) {
          out.push(...cur);
          continue; // don't traverse deeper into rows
        }
        for (const v of cur) stack.push(v);
        continue;
      }

      // recognize wrapper shapes like { data: [rows...] }
      if (Array.isArray(cur.data) && cur.data.length && cur.data.every(looksLikeNormRow)) {
        out.push(...cur.data);
        continue;
      }

      // traverse object values
      for (const k in cur) stack.push(cur[k]);
    }
    return out;
  };

  const getPreferredArray = (obj, keys) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (Array.isArray(v)) return v;
    }
    return null;
  };

  /**
   * Extract normalized rows.
   * Returns BOTH the used rows and debug meta about where they came from.
   */
  const getNormalizedRowsWithDebug = (parsed, dataset) => {
    const dbg = { source: "none", allCount: 0, filteredCount: 0, usedFiltered: false };
    if (!parsed) return { rows: [], dbg };

    const keys = [
      "normalized_results.csv",
      "normalized_model_results.csv",
      "normalized_model_results",
      "all_model_results.csv",
    ];

    // 1) Try well-known keys
    let rows =
      getPreferredArray(parsed, keys) ||
      getPreferredArray(parsed?.files, keys) ||
      getPreferredArray(parsed?.[dataset], keys);

    if (Array.isArray(rows) && rows.length) {
      dbg.source = "preferred_keys";
    } else {
      // 2) Deep fallback
      rows = collectNormalizedRowsDeep(parsed);
      if (rows.length) dbg.source = "deep_scan";
    }

    dbg.allCount = rows.length;

    // 3) Dataset filter (but don't wipe; keep unfiltered if filter gives 0)
    if (dataset) {
      const filtered = rows.filter((r) => eq(r?.dataset_name, dataset));
      dbg.filteredCount = filtered.length;
      if (filtered.length) {
        rows = filtered;
        dbg.usedFiltered = true;
      }
    }

    return { rows, dbg };
  };

  const getStdRows = (parsed, dataset) => {
    if (!parsed) return [];
    const keys = ["std_analysis.csv", "model_stats_summary.csv", "model_stats_summary"];

    let rows =
      getPreferredArray(parsed, keys) ||
      getPreferredArray(parsed?.files, keys) ||
      getPreferredArray(parsed?.[dataset], keys);

    if (!rows || !rows.length) {
      // heuristic fallback: rows that carry std/mean fields in deep scan
      rows = collectNormalizedRowsDeep(parsed).filter((r) => "std" in r || "mean" in r);
    }
    if (dataset) {
      const filtered = rows.filter((r) => eq(r?.dataset_name, dataset));
      rows = filtered.length ? filtered : rows;
    }
    return rows;
  };

  // ---------------- derived ----------------
  const { rows: normalizedRows, dbg: normDbgMemo } = useMemo(
    () => getNormalizedRowsWithDebug(parsedResults, selectedDataset),
    [parsedResults, selectedDataset]
  );

  const stdRowsForDataset = useMemo(
    () => getStdRows(parsedResults, selectedDataset),
    [parsedResults, selectedDataset]
  );

  // ---------------- effects ----------------

  // 1) Load dataset list for the run ID (folderName)
  useEffect(() => {
    if (!folderName) return;
    (async () => {
      try {
        const ds = await fetchDatasets(folderName);
        const list = Array.isArray(ds) ? ds : [];
        setDatasets(list);
        if (list.length && !selectedDataset) {
          setSelectedDataset(list[0]); // pick first by default
        }
        group("Datasets fetched");
        logD("runId:", folderName, "datasets:", list);
        groupEnd();
      } catch (e) {
        console.error("❌ Error fetching datasets:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderName]);

  // 2) When dataset changes, pull results (summary only) + DEBUG on splits
  useEffect(() => {
    if (!folderName || !selectedDataset) return;
    setLoading(true);
    (async () => {
      try {
        const data = await fetchAutoParsedRmse(folderName, selectedDataset);
        setParsedResults(data || null);

        // ===== DEBUG BLOCK: after first call =====
        try {
          group("After fetchAutoParsedRmse — RAW");
          logD("selectedDataset:", selectedDataset);
          logD("response keys:", Object.keys(data || {}));

          const apiSplitsArr = Array.isArray(data?.splits)
            ? data.splits.map(s)
            : Object.keys(data?.splits || {}).map(s);

          logD("api.splits:", apiSplitsArr, "(count:", apiSplitsArr.length, ")");

          // Try to read normalized rows directly from 'data' (before memo)
          const { rows: normRowsDirect, dbg: normDbg } = getNormalizedRowsWithDebug(data, selectedDataset);
          const sumAll = summarizeRows(normRowsDirect);
          logD("normalizedRows source:", normDbg.source,
               "| allCount:", normDbg.allCount,
               "| filteredCount:", normDbg.filteredCount,
               "| usedFiltered:", normDbg.usedFiltered);
          logD("normalizedRows summary:", sumAll);
          if (!sumAll.count) warnD("No normalized rows discovered in first response.");

          const splitsFromNorm = uniq(normRowsDirect.map(r => s(r?.split_id)).filter(Boolean));
          logD("splitsFromNormalized:", splitsFromNorm);

          groupEnd();
        } catch (dbgErr) {
          warnD("debug block error:", dbgErr);
        }
        // ===== END DEBUG BLOCK =====

      } catch (e) {
        console.error("❌ Error fetching dataset results:", e);
        setParsedResults(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [folderName, selectedDataset]);

  // 3) Derive splits ONLY from normalized rows; fallback to API if needed + DEBUG
  useEffect(() => {
    const fromNorm = uniq(normalizedRows.map((r) => s(r?.split_id)).filter(Boolean));

    // fallback to API-provided splits if normalizedRows empty
    let fromApi = [];
    try {
      fromApi = Array.isArray(parsedResults?.splits)
        ? parsedResults.splits.map(s)
        : Object.keys(parsedResults?.splits || {}).map(s);
    } catch {}

    const final = fromNorm.length ? fromNorm : fromApi;

    group("Split resolution");
    logD("selectedDataset:", selectedDataset);
    logD("normDbg:", normDbgMemo);
    logD("splits from normalized:", fromNorm);
    logD("splits from API:", fromApi);
    logD("final splits:", final);
    if (!final.length) warnD("No splits resolved — UI will show empty selector.");
    groupEnd();

    if (!final.length) {
      setSplits([]);
      setSelectedSplit("");
      return;
    }
    setSplits(final);
    setSelectedSplit((prev) => (prev && final.includes(prev) ? prev : final[0]));
  }, [normalizedRows, parsedResults, selectedDataset, normDbgMemo]);

  // 4) Compute models available in the selected split (from normalized rows) + DEBUG
  useEffect(() => {
    if (!selectedSplit) {
      setModelsForSplit([]);
      setSelectedModel("");
      return;
    }

    const rows = normalizedRows.filter(
      (r) =>
        eq(r?.split_id, selectedSplit) &&
        String(r?.category || "").toLowerCase() !== "baseline"
    );

    let models = uniq(rows.map((r) => s(r?.model))).filter(Boolean);

    // Fallback: try API structure like { splits: { splitId: [models...] } }
    if (!models.length) {
      try {
        const alt =
          (Array.isArray(parsedResults?.splits?.[selectedSplit]) &&
            parsedResults.splits[selectedSplit]) ||
          [];
        models = uniq(alt.map(s)).filter(Boolean);
      } catch {}
    }

    group("Model resolution");
    logD("split:", selectedSplit);
    logD("rowsForSplit:", rows.length);
    logD("models derived:", models);
    if (!models.length) warnD("No models resolved for split -> model dropdown empty.");
    groupEnd();

    setModelsForSplit(models);
    setSelectedModel((prev) => (prev && models.includes(prev) ? prev : models[0] || ""));
  }, [normalizedRows, parsedResults, selectedSplit]);

  // 5) Load XY + predictions for the selected split+model (via /series-bundle) + DEBUG
  useEffect(() => {
    if (!selectedDataset || !selectedSplit || !selectedModel) {
      setBaselineData(null);
      return;
    }
    const cacheKey = `${selectedDataset}|${selectedSplit}|${selectedModel}`;
    if (bundleCache[cacheKey]) {
      logD("Using cached series bundle:", cacheKey);
      setBaselineData(bundleCache[cacheKey]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        group("Series bundle fetch");
        logD("calling fetchSeriesBundle with:", {
          runId: folderName,
          dataset: selectedDataset,
          split: selectedSplit,
          model: selectedModel,
        });
        const bundle = await fetchSeriesBundle(
          folderName,
          selectedDataset,
          selectedSplit,
          [selectedModel],
            0,          // maxPoints not used when keepFraction set
            0.5  
        );
        if (cancelled) return;
        const corrected =
          bundle?.predictions?.[selectedModel]?.corrected ??
          bundle?.corrected ?? [];
        const payload = {
          actual: bundle?.y_test ?? bundle?.y_test_actual ?? [],
          baseline: bundle?.baseline ?? [],
          corrected,
          timeData: bundle?.x_test ?? bundle?.time_test ?? [],
        };
        logD("bundle lengths:", {
          actual: payload.actual?.length || 0,
          baseline: payload.baseline?.length || 0,
          corrected: payload.corrected?.length || 0,
          time: payload.timeData?.length || 0,
        });
        groupEnd();

        setBaselineData(payload);
        setBundleCache((prev) => ({ ...prev, [cacheKey]: payload }));
      } catch (err) {
        console.error("Failed to load series bundle:", err);
        if (!cancelled) setBaselineData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [folderName, selectedDataset, selectedSplit, selectedModel, bundleCache]);

  // 6) Table rows for the selected dataset + split
  const normalizedFiltered = useMemo(() => {
    if (!selectedSplit) return normalizedRows;
    return normalizedRows.filter((r) => eq(r?.split_id, selectedSplit));
  }, [normalizedRows, selectedSplit]);

  // ---------------- UI ----------------
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[1100px] px-6">

        {/* Run ID header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-lg font-semibold">
            <FaFolderOpen className="text-blue-600" />
            <span className="text-gray-900">ML</span>
            <span className="text-gray-500">Run&nbsp;ID:</span>
            <span className="text-blue-700 underline break-all">
              {decodeURIComponent(folderName || "")}
            </span>
          </div>
        </div>

        {/* Sticky controls bar */}
        <div className="sticky top-0 z-10 mb-6 rounded-xl border border-gray-200 bg-white/90 backdrop-blur p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Dataset */}
            <div className="flex flex-col">
              <label htmlFor="datasetSelect" className="mb-1 text-sm font-medium text-gray-700">
                Select Dataset
              </label>
              <select
                id="datasetSelect"
                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none"
                value={selectedDataset}
                onChange={(e) => {
                  setSelectedDataset(e.target.value);
                  setSelectedSplit("");
                  setSelectedModel("");
                  setBaselineData(null);
                }}
              >
                <option value="">-- Select a dataset --</option>
                {datasets.map((ds) => (
                  <option key={ds} value={ds}>{ds}</option>
                ))}
              </select>
            </div>

            {/* Split */}
            <div className="flex flex-col">
              <label htmlFor="splitSelect" className="mb-1 text	sm font-medium text-gray-700">
                Select Split
              </label>
              <select
                id="splitSelect"
                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50"
                value={selectedSplit}
                onChange={(e) => {
                  setSelectedSplit(e.target.value);
                  setSelectedModel("");
                  setBaselineData(null);
                }}
                disabled={!splits.length}
              >
                {!splits.length && <option>—</option>}
                {splits.map((sVal) => (
                  <option key={sVal} value={sVal}>{sVal}</option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div className="flex flex-col">
              <label htmlFor="modelSelect" className="mb-1 text-sm font-medium text-gray-700">
                Compare Model
              </label>
              <select
                id="modelSelect"
                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50"
                value={selectedModel}
                onChange={(e) => { setSelectedModel(e.target.value); setBaselineData(null); }}
                disabled={!modelsForSplit.length}
              >
                {!modelsForSplit.length && <option>—</option>}
                {modelsForSplit.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Loading */}
        {loading && <ChartLoader />}

        {/* Content */}
        {!loading && parsedResults && (
          <>
            {/* Plot */}
            {baselineData && selectedModel && selectedSplit && (
              <BaselineVsCorrectedPlot
                actualData={baselineData.actual}
                baselinePrediction={baselineData.baseline}
                correctedPrediction={baselineData.corrected}
                timeData={baselineData.timeData}
                modelName={`${selectedModel} (${selectedSplit})`}
                title={`Baseline + Correction vs Ground Truth — ${selectedModel} / ${selectedSplit}`}
              />
            )}

            {/* Table under the chart */}
            <div className="mt-12">
              <DatasetModelTable normalizedResults={normalizedFiltered} />
            </div>

            {/* Extra analytics — render only if arrays have values */}
            {(baselineData?.actual?.length && baselineData?.baseline?.length && baselineData?.corrected?.length) ? (
              <div>
                <ResidualsPlot
                  timeData={baselineData?.timeData}
                  actual={baselineData?.actual}
                  corrected={baselineData?.corrected}
                  baseline={baselineData?.baseline}
                />
                <ErrorHistogram
                  actual={baselineData?.actual}
                  corrected={baselineData?.corrected}
                  baseline={baselineData?.baseline}
                />
                <ActualVsPredScatter
                  actual={baselineData?.actual}
                  corrected={baselineData?.corrected}
                  baseline={baselineData?.baseline}
                />
                <RollingRmsePlot
                  timeData={baselineData?.timeData}
                  actual={baselineData?.actual}
                  corrected={baselineData?.corrected}
                  baseline={baselineData?.baseline}
                  window={2000}
                />

                {/* Train–Test split illustration 
                <SplitDiagram
                  splitId={selectedSplit}
                  totalN={baselineData?.timeData?.length || baselineData?.actual?.length}
                />
                */}
              
                {/* Top ranking with error bars */}
                <TopRankingErrorBar
                  normalizedRowsForDataset={normalizedRows}
                  stdRowsForDataset={stdRowsForDataset}
                />

                <div className="mt-12">
                  <ModelComparisonBar normalizedRowsForSplit={normalizedFiltered || []} />
                </div>

                <div className="mt-10">
                  <DatasetCsvViewer
                    runId={folderName}
                    dataset={selectedDataset}
                    pageSize={500}
                  />
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
