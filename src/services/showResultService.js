// src/services/showResultService.js
// Robust fetchers with Axios-bypass for autoParsedRmse + strong debug logs

import api from "./api";
import Papa from "papaparse";

const DBG = true;
const log = (...a) => DBG && console.log("[showResultService]", ...a);
const warn = (...a) => DBG && console.warn("[showResultService]", ...a);
const s = (v) => String(v ?? "").trim();
const uniq = (a) => [...new Set(a)];
const isArr = Array.isArray;

function summarizeRows(rows) {
  return {
    count: rows.length,
    datasets: uniq(rows.map(r => s(r?.dataset_name)).filter(Boolean)),
    splits:   uniq(rows.map(r => s(r?.split_id)).filter(Boolean)),
    models:   uniq(rows.map(r => s(r?.model)).filter(Boolean)),
  };
}

function looksLikeRow(r) {
  return r && typeof r === "object" &&
         "dataset_name" in r && "split_id" in r && "model" in r;
}

function deriveSplits(rows) {
  return uniq((rows || []).map(r => s(r?.split_id))).filter(Boolean);
}

function parseCsvTextToRows(txt) {
  try {
    const out = Papa.parse(txt, { header: true, dynamicTyping: true, skipEmptyLines: true });
    const rows = Array.isArray(out?.data) ? out.data : [];
    return rows.filter(looksLikeRow);
  } catch {
    return [];
  }
}

/**
 * IMPORTANT: This bypasses axios transforms to avoid any interceptor
 * that might coerce the payload to [] if it isn't shaped like { data: ... }.
 * It then parses JSON first; if that fails, it tries CSV.
 */
export async function fetchAutoParsedRmse(runId, dataset) {
  const url = `/showResult/autoParsedRmse/${encodeURIComponent(runId)}/${encodeURIComponent(dataset)}`;

  // 1) Try Axios but request RAW TEXT (no default transform)
  try {
    const res = await api.get(url, { transformResponse: [(r) => r] });
    const raw = res?.data;

    log("autoParsedRmse AXIOS(raw):", typeof raw, raw ? (raw.slice ? raw.slice(0, 80) + "..." : "[obj]") : raw);

    // Try JSON first
    if (typeof raw === "string" && raw.length) {
      try {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === "object") {
          const rows =
            obj["normalized_results.csv"] ||
            obj["normalized_model_results.csv"] ||
            obj["normalized_model_results"] ||
            obj["all_model_results.csv"] ||
            [];

          // Make sure rows is an array
          const rowsArr = isArr(rows) ? rows : [];
          if (!rowsArr.length) {
            // maybe server sent CSV but axios labeled as json/text; try CSV parse
            const csvRows = parseCsvTextToRows(raw);
            if (csvRows.length) obj["normalized_results.csv"] = csvRows;
          }
          if (!obj.splits || (isArr(obj.splits) && !obj.splits.length)) {
            obj.splits = deriveSplits(obj["normalized_results.csv"] || []);
          }
          log("autoParsedRmse(JSON) summary:", summarizeRows(obj["normalized_results.csv"] || []), "splits:", obj.splits);
          return obj;
        }
      } catch {/* fall through to CSV */}
      // raw string but not JSON → try CSV
      const rows = parseCsvTextToRows(raw);
      if (rows.length) {
        const obj = {
          "normalized_results.csv": rows,
          splits: deriveSplits(rows),
          __source: "csv_from_raw_text",
        };
        log("autoParsedRmse(CSV) summary:", summarizeRows(rows), "splits:", obj.splits);
        return obj;
      }
      warn("autoParsedRmse: raw string but neither JSON nor CSV produced rows.");
    }

    // If axios gave us an object (not string), use it
    if (raw && typeof raw === "object" && !isArr(raw)) {
      const obj = raw;
      if (!obj.splits) obj.splits = deriveSplits(obj["normalized_results.csv"] || []);
      log("autoParsedRmse(OBJ) keys:", Object.keys(obj));
      return obj;
    }

    // If axios gave [] (your current symptom), fall back to window.fetch
    if (isArr(raw)) {
      warn("autoParsedRmse: axios returned an array (likely interceptor). Falling back to fetch().");
    }
  } catch (e) {
    warn("autoParsedRmse axios error → fallback to fetch():", e?.message || e);
  }

  // 2) Bypass Axios entirely
  try {
    const r = await fetch(url, { credentials: "include" });
    const ctype = (r.headers.get("content-type") || "").toLowerCase();
    const text = await r.text();
    log("autoParsedRmse FETCH content-type:", ctype, "size:", text?.length || 0);

    // Try JSON
    try {
      const obj = JSON.parse(text);
      if (obj && typeof obj === "object") {
        if (!obj.splits) obj.splits = deriveSplits(obj["normalized_results.csv"] || []);
        log("autoParsedRmse(FETCH JSON) keys:", Object.keys(obj));
        return obj;
      }
    } catch {/* not json */}

    // Try CSV
    const rows = parseCsvTextToRows(text);
    if (rows.length) {
      const obj = {
        "normalized_results.csv": rows,
        splits: deriveSplits(rows),
        __source: "csv_from_fetch",
      };
      log("autoParsedRmse(FETCH CSV) summary:", summarizeRows(rows), "splits:", obj.splits);
      return obj;
    }

    warn("autoParsedRmse fetch: no usable content.");
    return { "normalized_results.csv": [], splits: [], __source: "empty" };
  } catch (e) {
    warn("autoParsedRmse fetch failed:", e?.message || e);
    return { "normalized_results.csv": [], splits: [], __source: "error" };
  }
}

// unchanged
export async function fetchDatasets(runId) {
  const { data } = await api.get(`/showResult/datasets/${encodeURIComponent(runId)}`);
  return data;
}

export async function fetchDatasetCsv(runId, dataset, { offset = 0, limit = 500 } = {}) {
  const { data } = await api.get(
    `/showResult/dataset-csv/${encodeURIComponent(runId)}/${encodeURIComponent(dataset)}`,
    { params: { offset, limit } }
  );
  return data;
}

export async function fetchSeriesBundle(runId, dataset, splitId, models = [], maxPoints = 80000, keepFraction) {
  const p = new URLSearchParams();
  (Array.isArray(models) ? models : [models]).filter(Boolean).forEach(m => p.append("models", m));
  p.set("maxPoints", String(maxPoints));
  if (keepFraction != null) p.set("keepFraction", String(keepFraction)); // <— NEW
  const url = `/showResult/series-bundle/${encodeURIComponent(runId)}/${encodeURIComponent(dataset)}/${encodeURIComponent(splitId)}?${p}`;
  const { data } = await api.get(url);
  return data;
}

