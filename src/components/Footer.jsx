import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-bremen-blue text-white text-sm text-center py-4 mt-auto">
      &copy; {new Date().getFullYear()} University of Bremen – Master’s Thesis (Mohamad Tofayel Ahmed)
    </footer>
  );
}
