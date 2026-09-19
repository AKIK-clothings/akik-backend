"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, Check, Sparkles } from "lucide-react";
import { ANNOUNCEMENT_ITEMS } from "@/data/navigationData";
import Link from "next/link";

export const AnnouncementBar: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const nextAnnouncement = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENT_ITEMS.length);
  }, []);

  const prevAnnouncement = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + ANNOUNCEMENT_ITEMS.length) % ANNOUNCEMENT_ITEMS.length
    );
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextAnnouncement, 4200);
    return () => clearInterval(interval);
  }, [isPaused, nextAnnouncement]);

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const current = ANNOUNCEMENT_ITEMS[currentIndex];

  return (
    <div
      role="region"
      aria-label="Promotional Announcements"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative z-50 bg-[#1F1E1D]/90 backdrop-blur-sm text-[#FAF9F6] border-b border-white/10 px-3 py-1 text-[10.5px] font-sans select-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Previous Button */}
        <button
          onClick={prevAnnouncement}
          aria-label="Previous announcement"
          className="p-0.5 rounded text-[#FAF9F6]/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-[#C47D5A]"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>

        {/* Dynamic Rotating Message */}
        <div className="flex-1 overflow-hidden mx-2 text-center flex items-center justify-center min-h-[18px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="inline-flex items-center gap-2 flex-wrap justify-center"
            >
              {current.badge && (
                <span className="inline-flex items-center gap-1 bg-[#C47D5A] text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" />
                  {current.badge}
                </span>
              )}

              {current.link ? (
                <Link
                  href={current.link}
                  className="hover:underline underline-offset-4 tracking-wide text-[#FAF9F6] font-medium"
                >
                  {current.text}
                </Link>
              ) : (
                <span className="tracking-wide text-[#FAF9F6] font-medium">
                  {current.text}
                </span>
              )}

              {current.code && (
                <button
                  onClick={(e) => handleCopy(e, current.code!)}
                  title="Click to copy coupon code"
                  className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 border border-white/20 text-[#FAF9F6] px-2 py-0.5 rounded text-[11px] font-mono transition-colors"
                >
                  <span>{current.code}</span>
                  {copiedCode === current.code ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-[#C47D5A]" />
                  )}
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Next Button */}
        <button
          onClick={nextAnnouncement}
          aria-label="Next announcement"
          className="p-0.5 rounded text-[#FAF9F6]/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-[#C47D5A]"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
