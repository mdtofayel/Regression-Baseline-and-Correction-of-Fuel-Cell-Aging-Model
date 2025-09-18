import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFolderOpen } from "react-icons/fa";
import axios from "axios";

export default function ResultsPage() {
  const [resultFolders, setResultFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:8080/runApi/getAllResults", { withCredentials: true })
      .then((res) => {
        setResultFolders(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching result folders:", err);
        setLoading(false);
      });
  }, []);

  const handleOpenFolder = (folderName) => {
    navigate(`/showResult/${encodeURIComponent(folderName)}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">📂 ML Run Sessions</h2>

      {loading ? (
        <p className="text-gray-600">Loading results...</p>
      ) : resultFolders.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {resultFolders.map((folder, idx) => (
            <li
              key={idx}
              className="flex items-center gap-4 p-4 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleOpenFolder(folder.folderName)}
            >
              <FaFolderOpen className="text-blue-600" />
              <div>
                <p className="font-semibold text-blue-800">{folder.folderName}</p>
                <p className="text-sm text-gray-500">Created: {folder.createdAt}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No result folders found.</p>
      )}
    </div>
  );
}
