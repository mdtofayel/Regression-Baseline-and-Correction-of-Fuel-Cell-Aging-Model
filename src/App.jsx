import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import MyFilesPage from "./pages/MyFilesPage";
import MyTestRunPage from"./pages/TestRunPage";
import MyRunAllPages from"./pages/RunAllPage";
import ResultsPage from "./pages/ResultsPage";
import ShowResultPage from "./pages/ShowResultPage";
import RunFuelCellData from "./pages/RunFuelCellData";
import ErrorBoundary from "./components/common/ErrorBoundary";



export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/myFiles" element={<MyFilesPage />} />
        <Route path="/myTest" element={<MyTestRunPage />} />
        <Route path="/run-all" element={<MyRunAllPages />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/showResult/:folderName" element={<ShowResultPage />} />
        <Route
          path="/showResult/:folderName"
          element={
            <ErrorBoundary>
              <ShowResultPage />
            </ErrorBoundary>
          }
        />

        
        <Route path="/run-fuelcell" element={<RunFuelCellData />} />

      </Routes>
    </Layout>
  );
}
