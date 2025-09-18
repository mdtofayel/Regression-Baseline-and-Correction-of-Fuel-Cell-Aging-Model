import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function MyFilesPage() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");

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

  const handleDelete = async (filename) => {
    if (!window.confirm(`Delete "${filename}"?`)) return;
    try {
      await axios.delete(`http://localhost:8080/api/files/${filename}`, {
        withCredentials: true,
      });
      fetchFiles();
    } catch (err) {
      console.error("Failed to delete file", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search dataset..."
          className="border px-3 py-2 w-1/2 rounded-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link
          to="/upload"
          className="bg-bremen-blue text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded">
          <thead className="bg-bremen-blue text-white">
                <tr>
                    <th className="py-2 px-4 text-left">Dataset Name</th>
                    <th className="py-2 px-4 text-left">Uploaded At</th>
                    <th className="py-2 px-4 text-left">Size (MB)</th> {/* New column */}
                    <th className="py-2 px-4 text-left">Action</th>
                </tr>
            </thead>
            <tbody>
                {filteredFiles.length > 0 ? (
                    filteredFiles.map((file, index) => (
                    <tr key={index} className="border-t">
                        <td className="py-2 px-4">{file.name}</td>
                        <td className="py-2 px-4">
                        {new Date(file.uploadedAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-4">
                            {file.size !== "unknown"
                                ? `${parseFloat(file.size).toFixed(2)} MB`
                                : "unknown"}
                        </td>

                        <td className="py-2 px-4">
                        <button
                            onClick={() => handleDelete(file.name)}
                            className="text-red-600 hover:underline"
                        >
                            Delete
                        </button>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td className="py-3 px-4" colSpan="4">
                        No matching datasets found.
                    </td>
                    </tr>
                )}
            </tbody>

        </table>
      </div>
    </div>
  );
}
