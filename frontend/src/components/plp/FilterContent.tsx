"use client";

import React from "react";
import { ALL_COLORS } from "@/data/mockProducts";
import { ApparelSize } from "@/types/product";

interface FilterContentProps {
  selectedCollection: string;
  onSelectCollection: (col: string) => void;
  selectedSubcategories: string[];
  onToggleSubcategory: (sub: string) => void;
  selectedSizes: ApparelSize[];
  onToggleSize: (size: ApparelSize) => void;
  selectedColors: string[];
  onToggleColor: (colorName: string) => void;
  inStockOnly: boolean;
  onToggleInStock: (val: boolean) => void;
  priceRange: [number, number];
  onChangePriceRange: (range: [number, number]) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const SHARED_SUBCATEGORIES = [
  "Embroidered Satin with Dupatta",
  "Luxury Cotton Satin",
  "Satin Lucknowi Collection",
  "Rose Royale Collection",
];

const ALL_SIZES: ApparelSize[] = ["S", "M", "L", "XL", "XXL", "XXXL"];

export const FilterContent: React.FC<FilterContentProps> = ({
  selectedCollection,
  onSelectCollection,
  selectedSubcategories,
  onToggleSubcategory,
  selectedSizes,
  onToggleSize,
  selectedColors,
  onToggleColor,
  inStockOnly,
  onToggleInStock,
  priceRange,
  onChangePriceRange,
  onResetFilters,
  hasActiveFilters,
}) => {
  const availableSubs = SHARED_SUBCATEGORIES;

  return (
    <div className="space-y-6 text-sm font-sans text-[#1F1E1D]">
      {/* Header with Clear Action */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DE]">
        <h3 className="font-serif text-lg font-normal tracking-wide text-[#1F1E1D]">
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-[#C47D5A] hover:underline font-semibold"
          >
            Clear All
          </button>
        )}
      </div>

      {/* 1. Main Collection Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#75706B] mb-2.5">
          Collection
        </h4>
        <div className="flex flex-col gap-1.5">
          {[
            { id: "all", label: "All Collections" },
            { id: "stitched", label: "Stitched" },
            { id: "unstitched", label: "Unstitched" },
            { id: "kids", label: "Kids" },
          ].map((col) => (
            <label
              key={col.id}
              className="flex items-center gap-2 cursor-pointer text-xs hover:text-[#C47D5A] transition-colors"
            >
              <input
                type="radio"
                name="collection"
                checked={selectedCollection === col.id}
                onChange={() => onSelectCollection(col.id)}
                className="w-3.5 h-3.5 text-[#C47D5A] accent-[#C47D5A] focus:ring-[#C47D5A]"
              />
              <span
                className={
                  selectedCollection === col.id ? "font-bold text-[#1F1E1D]" : ""
                }
              >
                {col.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 2. Sub-Category Multi-Select */}
      <div className="pt-3 border-t border-[#EAE5DE]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#75706B] mb-2.5">
          Subcategories
        </h4>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {availableSubs.map((sub) => {
            const isChecked = selectedSubcategories.includes(sub);
            return (
              <label
                key={sub}
                className="flex items-center gap-2 cursor-pointer text-xs hover:text-[#C47D5A] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleSubcategory(sub)}
                  className="w-3.5 h-3.5 rounded text-[#C47D5A] accent-[#C47D5A] focus:ring-[#C47D5A]"
                />
                <span className={isChecked ? "font-semibold text-[#1F1E1D]" : ""}>
                  {sub}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Size Filter (Hidden if unstitched selected) */}
      {selectedCollection !== "unstitched" && (
        <div className="pt-3 border-t border-[#EAE5DE]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#75706B] mb-2.5">
            Size
          </h4>
          <div className="grid grid-cols-3 gap-1.5">
            {ALL_SIZES.map((sz) => {
              const isSelected = selectedSizes.includes(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onToggleSize(sz)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded border transition-all ${
                    isSelected
                      ? "bg-[#1F1E1D] text-white border-[#1F1E1D]"
                      : "bg-white text-[#1F1E1D] border-[#EAE5DE] hover:border-[#C47D5A]"
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Color Picker Filter: Clickable Swatches */}
      <div className="pt-3 border-t border-[#EAE5DE]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#75706B] mb-2.5">
          Color
        </h4>
        <div className="flex items-center flex-wrap gap-2">
          {ALL_COLORS.map((c) => {
            const isSelected = selectedColors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => onToggleColor(c.name)}
                title={c.name}
                className={`w-6 h-6 rounded-full border transition-all relative ${
                  isSelected
                    ? "ring-2 ring-[#C47D5A] ring-offset-2 scale-110 border-white"
                    : "border-black/10 hover:scale-105"
                }`}
                style={{ backgroundColor: c.hexCode }}
              />
            );
          })}
        </div>
      </div>

      {/* 5. Price Range Slider with Min/Max Inputs */}
      <div className="pt-3 border-t border-[#EAE5DE]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#75706B] mb-2.5">
          Price Range
        </h4>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 px-2.5 py-1.5 bg-white border border-[#EAE5DE] rounded text-xs">
            <span className="text-[#75706B] mr-1">₹</span>
            <input
              type="number"
              value={priceRange[0]}
              min={1000}
              max={priceRange[1]}
              onChange={(e) =>
                onChangePriceRange([Number(e.target.value), priceRange[1]])
              }
              className="w-16 focus:outline-none text-[#1F1E1D] font-medium"
            />
          </div>
          <span className="text-xs text-[#75706B]">to</span>
          <div className="flex-1 px-2.5 py-1.5 bg-white border border-[#EAE5DE] rounded text-xs">
            <span className="text-[#75706B] mr-1">₹</span>
            <input
              type="number"
              value={priceRange[1]}
              min={priceRange[0]}
              max={12000}
              onChange={(e) =>
                onChangePriceRange([priceRange[0], Number(e.target.value)])
              }
              className="w-16 focus:outline-none text-[#1F1E1D] font-medium"
            />
          </div>
        </div>

        <input
          type="range"
          min={1500}
          max={10000}
          step={500}
          value={priceRange[1]}
          onChange={(e) =>
            onChangePriceRange([priceRange[0], Number(e.target.value)])
          }
          className="w-full accent-[#C47D5A] cursor-pointer"
        />
      </div>

      {/* 6. Availability Toggle ("In Stock Only") */}
      <div className="pt-3 border-t border-[#EAE5DE]">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-medium text-[#1F1E1D]">
            In Stock Only
          </span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onToggleInStock(e.target.checked)}
            className="w-4 h-4 rounded text-[#C47D5A] accent-[#C47D5A] focus:ring-[#C47D5A]"
          />
        </label>
      </div>
    </div>
  );
};
