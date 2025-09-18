import React, { useEffect, useState } from "react";
import axios from "axios";

export default function TestRunPage() {
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/files", {
          withCredentials: true,
        });
        setFiles(response.data);
      } catch (err) {
        console.error("Failed to load files", err);
      }
    };

    fetchFiles();
  }, []);

  const handleSelect = (fileName) => {
    setSelectedFile(prev => (prev === fileName ? "" : fileName));
  };

  const handleRunTest = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setResult(null);

    try {
            const response = await axios.post("http://localhost:8080/testApi/test-run", {
                filename: selectedFile
                }, {
                withCredentials: true
                });
                setResult(response.data);

    } catch (err) {
      console.error("Test run failed", err);
      setResult({ error: "Test run failed" });
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (bytesStr) => {
    try {
      const size = parseInt(bytesStr);
      return (size / (1024 * 1024)).toFixed(2) + " MB";
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">🧪 Test Run on a Single Dataset</h2>

      <input
        type="text"
        placeholder="Search datasets..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border px-3 py-2 rounded mb-4 w-full max-w-sm"
      />

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-bremen-blue text-white">
            <tr>
              <th className="px-4 py-2 text-left">Dataset Name</th>
              <th className="px-4 py-2 text-left">Uploaded At</th>
              <th className="px-4 py-2 text-left">Size (MB)</th>
              <th className="px-4 py-2 text-left">Select</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-100">
                <td className="px-4 py-2">{file.name}</td>
                 <td className="py-2 px-4">
                        {new Date(file.uploadedAt).toLocaleString()}
                        </td>
                <td className="py-2 px-4">
                        {file.size !== "unknown"
                            ? `${parseFloat(file.size).toFixed(2)} MB`
                            : "unknown"}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="radio"
                    name="fileSelect"
                    checked={selectedFile === file.name}
                    onChange={() => handleSelect(file.name)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleRunTest}
        disabled={!selectedFile || loading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Run Test
      </button>

      {/* Modal Animation */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg flex flex-col items-center space-y-4 animate-pulse">
            <svg
              className="animate-spin h-10 w-10 text-bremen-blue"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p className="text-bremen-blue font-semibold text-lg">Running your test...</p>
            <p className="text-sm text-gray-500 text-center">Please wait while your selected dataset is processed</p>
          </div>
        </div>
      )}

      {/* Result Output */}
      {result && (
            <div className="mt-6 border rounded p-4 bg-gray-50">
                {result.error ? (
                <p className="text-red-600">{result.error}</p>
                ) : (
                <>
                    <h3 className="text-lg font-medium mb-2">✅ Response:</h3>
                    <p>{result.message}</p>
                </>
                )}
            </div>
        )}
    </div>
  );
}
