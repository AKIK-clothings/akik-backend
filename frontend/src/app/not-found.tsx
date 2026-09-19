import React from "react";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 bg-[#FAF9F6]">
      <div className="w-16 h-16 rounded-full bg-white border border-[#EAE5DE] flex items-center justify-center text-[#C47D5A] shadow-sm mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#C47D5A] mb-2">
        404 — Page Not Found
      </span>
      <h1 className="font-serif text-3xl sm:text-4xl text-[#1F1E1D] font-normal mb-3">
        The Piece You Seek Has Wandered
      </h1>
      <p className="text-xs sm:text-sm text-[#75706B] max-w-md mb-8 leading-relaxed">
        The requested boutique page could not be found. Discover our latest handloom kurti sets, banarasi sarees, and contemporary co-ords below.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1F1E1D] text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#C47D5A] transition-colors"
        >
          <span>Return Home</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/collections"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#EAE5DE] text-[#1F1E1D] text-xs font-semibold uppercase tracking-wider rounded hover:border-[#C47D5A] transition-colors"
        >
          <span>Browse All Collections</span>
        </Link>
      </div>
    </div>
  );
}
