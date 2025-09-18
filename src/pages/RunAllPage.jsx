import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function RunAllPage() {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [testTrainPairs, setTestTrainPairs] = useState([{ train: 80, test: 20 }]);
  const [selectedMLModels, setSelectedMLModels] = useState([]);
  const [selectAllModels, setSelectAllModels] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();
  const showValidationToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    };


  const availableModelGroups = [
    {
      category: "Traditional Time Series Models",
      models: [
        { label: "ARIMA", value: "arima_model" },
        { label: "SARIMA", value: "sarima_model" },
        { label: "ETS", value: "ets_model" },
        { label: "State Space", value: "state_space_model" },
        { label: "Kalman Filter", value: "kalman_filter_model" },
        { label: "GARCH", value: "garch_model" }
      ]
    },
    {
      category: "Tree-based & Ensemble Models",
      models: [
        { label: "Random Forest", value: "sklearn_random_forest" },
        { label: "Gradient Boosting", value: "sklearn_gradient_boosting" },
        { label: "XGBoost", value: "xgboost_regression" },
        { label: "LightGBM", value: "lightgbm_regression" },
        { label: "CatBoost", value: "catboost_regression" }
      ]
    },
    {
      category: "Neural Network Models",
      models: [
        { label: "RNN", value: "rnn_model" },
        { label: "LSTM", value: "lstm_model" },
        { label: "GRU", value: "gru_model" },
        { label: "CNN", value: "cnn_model" },
        { label: "InceptionTime", value: "inception_time_model" },
        { label: "TCN", value: "tcn_model" },
        { label: "Neural Prophet", value: "neural_prophet_model" }
      ]
    },
    {
      category: "Linear & Regression Models",
      models: [
        { label: "Linear Regression", value: "sklearn_linear_regression" },
        { label: "Ridge", value: "sklearn_ridge_regression" },
        { label: "Lasso", value: "sklearn_lasso_regression" },
        { label: "Elastic Net", value: "sklearn_elastic_net_regression" },
        { label: "Polynomial Regression", value: "sklearn_polynomial_regression" },
        { label: "SVR", value: "sklearn_svr" },
        { label: "Bayesian Regression", value: "sklearn_bayesian_linear_regression" },
        { label: "Gaussian Process", value: "sklearn_gaussian_process_regression" },
        { label: "PCR", value: "sklearn_principal_component_regression" },
        { label: "PLSR", value: "sklearn_partial_least_squares_regression" },
        { label: "Quantile Regression", value: "quantile_regression" },
        { label: "Robust Regression", value: "sklearn_robust_regression" }
      ]
    },
    {
      category: "Hybrid & Specialized Models",
      models: [
        { label: "ARIMA + ANN", value: "hybrid_arima_ann" },
        { label: "Model Stacking", value: "model_stacking" },
        { label: "Bagging", value: "bagging_regressor" },
        { label: "BSTS", value: "bsts_model" },
        { label: "HMM", value: "hmm_model" }
      ]
    },
    {
      category: "Emerging Techniques",
      models: [
        { label: "Attention", value: "attention_mechanism" },
        { label: "Reinforcement Learning", value: "rl_time_series" },
        { label: "FreshPrince", value: "freshprince" },
        { label: "DrCIF", value: "drcif" },
        { label: "Causal Impact", value: "causal_impact_analysis" },
        { label: "Granger Causality", value: "granger_causality" }
      ]
    },
    {
      category: "Advanced Generalized Models",
      models: [
        { label: "Linear GAM", value: "pygam_linear_gam" },
        { label: "GLMM", value: "statsmodels_glmm" },
        { label: "NLMM", value: "statsmodels_nlmm" }
      ]
    },
    {
      category: "Statistical & Econometric Models",
      models: [
        { label: "Poisson", value: "sklearn_poisson_regression" },
        { label: "Gamma", value: "sklearn_gamma_regression" },
        { label: "Negative Binomial", value: "statsmodels_negative_binomial" },
        { label: "Tobit", value: "statsmodels_tobit" },
        { label: "Probit", value: "statsmodels_probit" }
      ]
    }
  ];


  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/files", {
          withCredentials: true
        });
        setFiles(response.data);
      } catch (err) {
        console.error("Failed to load files", err);
      }
    };
    fetchFiles();
  }, []);

  const handleFileSelection = (fileName) => {
    setSelectedFiles(prev => 
      prev.includes(fileName) 
        ? prev.filter(f => f !== fileName) 
        : [...prev, fileName]
    );
  };

  const handleAddPair = () => {
    setTestTrainPairs([...testTrainPairs, { train: 80, test: 20 }]);
  };

  const handleModelChange = (model) => {
    if (selectedMLModels.includes(model)) {
      setSelectedMLModels(selectedMLModels.filter(m => m !== model));
    } else {
      setSelectedMLModels([...selectedMLModels, model]);
    }
  };

  const handleSelectAllModels = () => {
    if (selectAllModels) {
      setSelectedMLModels([]);
    } else {
      setSelectedMLModels([...availableModels]);
    }
    setSelectAllModels(!selectAllModels);
  };

  const handleRunAll = async () => {
    if (selectedFiles.length === 0) {
        showValidationToast("🚫 Please select at least one dataset.");
        return;
    }
    if (selectedMLModels.length === 0) {
        showValidationToast("🚫 Please select at least one machine learning model.");
        return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post("http://localhost:8080/runApi/run", {
        files: selectedFiles,
        models: selectedMLModels,
        splits: testTrainPairs
      }, { withCredentials: true });

      if (response.data.status === "success") {
        navigate("/results", { state: { result: response.data } });
      } else {
        setResult(response.data);
      }

    } catch (err) {
      console.error("Run all failed", err);
      setResult({ error: "Run all failed" });
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">▶️ Run ML on Multiple Datasets</h2>

      <input
        type="text"
        placeholder="Search datasets..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border px-3 py-2 rounded mb-4 w-full max-w-sm"
      />

      <div className="border rounded h-[220px] overflow-y-auto mb-4">
        <table className="min-w-full border text-sm">
            <thead className="bg-bremen-blue text-white sticky top-0 z-10">
                    <tr>
                        <th className="px-4 py-2 text-left">Dataset Name</th>
                        <th className="px-4 py-2 text-left">Uploaded At</th>
                        <th className="px-4 py-2 text-left">Size (MB)</th>
                        <th className="px-4 py-2 text-left">
                        <label className="flex items-center gap-2">
                            <input
                            type="checkbox"
                            checked={filteredFiles.length > 0 && selectedFiles.length === filteredFiles.length}
                            onChange={() => {
                                if (selectedFiles.length === filteredFiles.length) {
                                setSelectedFiles([]);
                                } else {
                                setSelectedFiles(filteredFiles.map((f) => f.name));
                                }
                            }}
                            />
                            Select
                        </label>
                        </th>
                    </tr>
                </thead>
                <tbody>
                {filteredFiles.map((file, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-100">
                    <td className="px-4 py-2">{file.name}</td>
                    <td className="py-2 px-4">{new Date(file.uploadedAt).toLocaleString()}</td>
                    <td className="py-2 px-4">
                        {file.size !== "unknown" ? `${parseFloat(file.size).toFixed(2)} MB` : "unknown"}
                    </td>
                    <td className="px-4 py-2">
                        <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.name)}
                        onChange={() => handleFileSelection(file.name)}
                        />
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>


        <div className="mb-6">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span role="img" aria-label="chart">📊</span> Train/Test Splits
          </h4>

          <div className="space-y-3">
            {testTrainPairs.map((pair, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Train %</label>
                <input
                  type="number"
                  value={pair.train}
                  onChange={(e) => {
                    const updated = [...testTrainPairs];
                    updated[idx].train = parseInt(e.target.value);
                    updated[idx].test = 100 - parseInt(e.target.value);
                    setTestTrainPairs(updated);
                  }}
                  className="border px-3 py-1 w-24 rounded shadow-sm"
                  min={1}
                  max={99}
                />

                <label className="text-sm font-medium text-gray-700">Test %</label>
                <input
                  type="number"
                  value={pair.test}
                  className="border px-3 py-1 w-24 bg-gray-100 rounded shadow-sm"
                  disabled
                />

                {testTrainPairs.length > 1 && (
                  <button
                    onClick={() => handleRemovePair(idx)}
                    className="ml-2 text-[#D71E38] text-lg hover:scale-110 transition-transform"
                    title="Remove split"
                  >
                    🗑️
                  </button>

                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setTestTrainPairs([...testTrainPairs, { train: 80, test: 20 }])}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            ➕ Add another split
          </button>
        </div>


        <div className="mb-6">
            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span role="img" aria-label="robot">🤖</span> Select ML Models
            </h4>

            {availableModelGroups.map((group, idx) => (
                <div key={idx} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h5 className="text-md font-medium text-gray-700">{group.category}</h5>
                    <label className="text-sm text-blue-700 cursor-pointer flex items-center gap-1">
                    <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={group.models.every(m => selectedMLModels.includes(m.value))}
                        onChange={() => {
                        const categoryValues = group.models.map(m => m.value);
                        const isAllSelected = categoryValues.every(v => selectedMLModels.includes(v));
                        if (isAllSelected) {
                            setSelectedMLModels(prev => prev.filter(m => !categoryValues.includes(m)));
                        } else {
                            const toAdd = categoryValues.filter(v => !selectedMLModels.includes(v));
                            setSelectedMLModels(prev => [...prev, ...toAdd]);
                        }
                        }}
                    />
                    Select All
                    </label>
                </div>

                <div className="flex flex-wrap gap-3">
                    {group.models.map((model, mIdx) => (
                    <label
                        key={mIdx}
                        className={`cursor-pointer px-3 py-2 rounded border shadow-sm text-sm font-medium 
                        ${selectedMLModels.includes(model.value)
                            ? "bg-blue-100 border-blue-600 text-blue-800"
                            : "bg-white border-gray-300 text-gray-800"}`}
                    >
                        <input
                        type="checkbox"
                        checked={selectedMLModels.includes(model.value)}
                        onChange={() =>
                            setSelectedMLModels(prev =>
                            prev.includes(model.value)
                                ? prev.filter(m => m !== model.value)
                                : [...prev, model.value]
                            )
                        }
                        className="hidden"
                        />
                        {model.label}
                    </label>
                    ))}
                </div>
                </div>
            ))}

            <button
                onClick={() => {
                const allModelValues = availableModelGroups.flatMap(g => g.models.map(m => m.value));
                if (selectAllModels) {
                    setSelectedMLModels([]);
                } else {
                    setSelectedMLModels(allModelValues);
                }
                setSelectAllModels(!selectAllModels);
                }}
                className="mt-2 text-sm text-blue-600 hover:underline"
            >
                {selectAllModels ? "Unselect All" : "Select All"}
            </button>
        </div>


      <button
        onClick={handleRunAll}
        disabled={loading || selectedFiles.length === 0 || selectedMLModels.length === 0}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        Run All
      </button>

      {loading && (
        <div className="mt-4 text-green-600 animate-pulse">Running models on selected datasets...</div>
      )}

      {result && (
        <div className="mt-6 border rounded p-4 bg-gray-50">
          {result.error ? (
            <p className="text-red-600">{result.error}</p>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-2">✅ Run Result:</h3>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </>
          )}
        </div>
      )}
      {showToast && (
            <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-md z-50 animate-fade-in-out">
                {toastMessage}
            </div>
        )}
    </div>
  );
}
