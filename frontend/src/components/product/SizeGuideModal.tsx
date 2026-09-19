"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ruler, Sparkles } from "lucide-react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [unit, setUnit] = useState<"in" | "cm">("in");

  const measurements = [
    { size: "S", bustIn: "36", waistIn: "32", hipIn: "38", lengthIn: "44", bustCm: "91", waistCm: "81", hipCm: "96", lengthCm: "112" },
    { size: "M", bustIn: "38", waistIn: "34", hipIn: "40", lengthIn: "44", bustCm: "96", waistCm: "86", hipCm: "101", lengthCm: "112" },
    { size: "L", bustIn: "40", waistIn: "36", hipIn: "42", lengthIn: "45", bustCm: "101", waistCm: "91", hipCm: "106", lengthCm: "114" },
    { size: "XL", bustIn: "42", waistIn: "38", hipIn: "44", lengthIn: "45", bustCm: "106", waistCm: "96", hipCm: "111", lengthCm: "114" },
    { size: "XXL", bustIn: "44", waistIn: "40", hipIn: "46", lengthIn: "46", bustCm: "111", waistCm: "101", hipCm: "116", lengthCm: "117" },
    { size: "XXXL", bustIn: "46", waistIn: "42", hipIn: "48", lengthIn: "46", bustCm: "117", waistCm: "106", hipCm: "122", lengthCm: "117" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1F1E1D]/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-2xl mx-auto bg-white rounded-xl shadow-2xl z-50 p-6 md:p-8 font-sans border border-[#EAE5DE] max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE5DE]">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[#C47D5A]" />
                <h3
                  id="size-guide-title"
                  className="font-serif text-2xl text-[#1F1E1D] font-normal"
                >
                  Size & Measurement Guide
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#75706B] hover:text-[#1F1E1D] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Unit Switcher */}
            <div className="flex items-center justify-between mt-5 mb-4">
              <p className="text-xs text-[#75706B]">
                All garment measurements are ready garment dimensions.
              </p>
              <div className="flex items-center bg-[#F4EFEA] p-1 rounded-md text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setUnit("in")}
                  className={`px-3 py-1 rounded transition-colors ${
                    unit === "in"
                      ? "bg-white text-[#1F1E1D] shadow-sm"
                      : "text-[#75706B]"
                  }`}
                >
                  Inches (in)
                </button>
                <button
                  type="button"
                  onClick={() => setUnit("cm")}
                  className={`px-3 py-1 rounded transition-colors ${
                    unit === "cm"
                      ? "bg-white text-[#1F1E1D] shadow-sm"
                      : "text-[#75706B]"
                  }`}
                >
                  Centimeters (cm)
                </button>
              </div>
            </div>

            {/* Measurement Table */}
            <div className="overflow-x-auto border border-[#EAE5DE] rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF9F6] text-[#1F1E1D] uppercase tracking-wider font-semibold border-b border-[#EAE5DE]">
                  <tr>
                    <th className="p-3">Size</th>
                    <th className="p-3">Bust</th>
                    <th className="p-3">Waist</th>
                    <th className="p-3">Hip</th>
                    <th className="p-3">Kurta Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5DE]">
                  {measurements.map((row) => (
                    <tr
                      key={row.size}
                      className="hover:bg-[#FAF9F6]/50 transition-colors"
                    >
                      <td className="p-3 font-bold text-[#1F1E1D]">{row.size}</td>
                      <td className="p-3 text-[#75706B]">
                        {unit === "in" ? `${row.bustIn}"` : `${row.bustCm} cm`}
                      </td>
                      <td className="p-3 text-[#75706B]">
                        {unit === "in" ? `${row.waistIn}"` : `${row.waistCm} cm`}
                      </td>
                      <td className="p-3 text-[#75706B]">
                        {unit === "in" ? `${row.hipIn}"` : `${row.hipCm} cm`}
                      </td>
                      <td className="p-3 text-[#75706B]">
                        {unit === "in" ? `${row.lengthIn}"` : `${row.lengthCm} cm`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Measuring Tips Note */}
            <div className="mt-5 p-4 bg-[#F4EFEA] rounded-lg text-xs text-[#75706B] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#1F1E1D] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#C47D5A]" />
                <span>Boutique Tailoring Note</span>
              </div>
              <p>
                All AKIK luxury garments come with an additional <strong>2 inches of internal seam margin</strong> to allow personalized tailoring and size adjustments if needed.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
