import React from "react";
import thesisImage from "../assets/thesis-diagram.png"; // use your image path

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-800 p-8">
      <div className="flex flex-col md:flex-row items-center justify-center gap-10">
        {/* Left Text Block */}
        <div className="md:w-1/2 text-lg leading-relaxed">
          <h2 className="text-2xl font-semibold text-bremen-blue mb-3">What is this thesis about?</h2>
          <p>
            This thesis focuses on building a robust and automated platform to benchmark machine learning models
            for predicting fuel cell aging. The system allows users to upload multiple time-series datasets, test
            performance, analyze RMSE trends, and visualize aging model behavior — offering both baseline analysis
            and correction capabilities.
          </p>
        </div>

        {/* Right Image */}
        <div className="md:w-1/2">
          <img
            src={thesisImage}
            alt="Fuel Cell Aging Model Diagram"
            className="w-full max-w-md mx-auto rounded shadow-md"
          />
        </div>
      </div>
    </div>
  );
}
