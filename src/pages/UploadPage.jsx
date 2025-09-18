import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from "../context/AuthContext";

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isCSV = (file) => file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

  const filterCSV = (fileList) => {
    const validFiles = Array.from(fileList).filter(isCSV);
    const invalidFiles = Array.from(fileList).filter(f => !isCSV(f));
    if (invalidFiles.length > 0) {
      alert("Only .csv files are allowed. Invalid files were ignored.");
    }
    return validFiles;
  };

  const handleFileChange = (e) => {
    const validFiles = filterCSV(e.target.files);
    setFiles((prev) => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const validFiles = filterCSV(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };
  
  const { user } = useAuth();

const handleUpload = async () => {
  if (!user || !user.email) {
    alert("Not logged in. Please login again.");
    return;
  }

  if (files.length === 0) return;

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  console.log("Current cookie:", document.cookie);
  try {
    setUploading(true);
   const response =await axios.post("http://localhost:8080/api/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true   // ✅ Sends JSESSIONID
    });
    alert(`Upload successful: ${response.data.message}`);
    console.log("Upload response:", response.data);
    alert("Upload successful!");
    setFiles([]);
  } catch (error) {
    console.error("Upload failed", error);
    alert("Upload failed. Please try again.");
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="bg-white text-gray-800 p-8">
      <h2 className="text-3xl font-semibold text-bremen-blue mb-4">Upload Time-Series Datasets</h2>
      <p className="mb-6">
        Please upload one or more <strong>.csv</strong> files. Drag and drop into the box below or click the box.
      </p>

      <div
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-dashed border-2 border-bremen-blue rounded-md p-6 text-center text-bremen-blue cursor-pointer mb-6 transition hover:bg-blue-50"
      >
        <p className="mb-4 text-lg">Click or Drag & Drop your .csv files here</p>

        {files.length > 0 && (
          <ul className="text-left text-sm text-gray-700 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <li key={index} className="flex justify-between items-center py-1 border-b">
                <span>{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  ✕ Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        className={`bg-bremen-blue text-white px-6 py-2 rounded hover:bg-bremen-red transition ${
          uploading || files.length === 0 ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {uploading ? "Uploading..." : "Upload to Backend"}
      </button>
    </div>
  );
}
