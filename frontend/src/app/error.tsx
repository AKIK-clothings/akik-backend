"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application render error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#FAF9F6] font-sans">
      <div className="max-w-md w-full text-center bg-white border border-[#EAE5DE] rounded-2xl p-8 shadow-lg">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#C47D5A]/10 flex items-center justify-center text-[#C47D5A]">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#1A1918] mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-[#6B6661] mb-6">
          We encountered an unexpected error while rendering this page. Please try refreshing or return home.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#C47D5A] hover:bg-[#A86947] text-white text-sm font-semibold tracking-wider uppercase transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#3D3A36] text-[#1A1918] hover:bg-[#F5F3F0] text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
