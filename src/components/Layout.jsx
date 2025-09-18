import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import uniLogo from '../assets/university-logo.png';
import cslLogo from '../assets/csl-logo.png';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="w-full bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <img src={uniLogo} alt="University of Bremen" className="h-12" />
          <h1 className="text-center flex-grow text-bremen-blue text-base sm:text-xl md:text-2xl font-semibold">
            Regression Baseline and Correction of Fuel Cell Aging Model
          </h1>
          <img src={cslLogo} alt="CSL Lab" className="h-10" />
        </div>
      </div>

      {/* ✅ This is critical */}
      <Navbar />

      {/* Main page content */}
      <main className="flex-grow bg-white p-6">{children}</main>

      {/* ✅ Footer must be outside main */}
      <Footer />
    </div>
  );
}
