"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MegaMenuCategory } from "@/types/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

interface MegaMenuProps {
  activeCategory: MegaMenuCategory | null;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  activeCategory,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => {
  if (!activeCategory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="absolute top-full left-0 w-full bg-[#FAF9F6] border-b border-[#EAE5DE] shadow-2xl z-40"
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-12 gap-8 items-stretch">
            {/* Category Submenu Column (8 Columns) */}
            <div className="col-span-8 pr-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#EAE5DE] mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-2xl font-normal text-[#1F1E1D] tracking-wide">
                      {activeCategory.title}
                    </h3>
                    {activeCategory.badge && (
                      <span className="inline-flex items-center gap-1 bg-[#C47D5A]/15 text-[#C47D5A] border border-[#C47D5A]/30 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                        {activeCategory.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#75706B] mt-1 font-sans">
                    Handpicked artisanal designs tailored for contemporary elegance
                  </p>
                </div>

                <Link
                  href={activeCategory.href}
                  onClick={onClose}
                  className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C47D5A] hover:text-[#A8623E] transition-colors"
                >
                  <span>View All in {activeCategory.title.replace(" Collection", "")}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Subcategories Grid */}
              <div className="grid grid-cols-2 gap-4">
                {activeCategory.subcategories.map((sub) => (
                  <Link
                    key={sub.title}
                    href={sub.href}
                    onClick={onClose}
                    className="group flex flex-col p-3.5 rounded-lg border border-transparent hover:border-[#EAE5DE] hover:bg-white/80 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-base text-[#1F1E1D] group-hover:text-[#C47D5A] transition-colors">
                        {sub.title}
                      </span>
                      {sub.badge && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F4EFEA] text-[#1F1E1D] group-hover:bg-[#C47D5A] group-hover:text-white transition-colors">
                          {sub.badge}
                        </span>
                      )}
                    </div>
                    {sub.description && (
                      <p className="text-xs text-[#75706B] mt-1 font-sans line-clamp-2 leading-relaxed">
                        {sub.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Editorial Feature Spotlight Card (4 Columns) */}
            {activeCategory.featuredCard && (
              <div className="col-span-4 bg-white rounded-xl overflow-hidden border border-[#EAE5DE] shadow-sm flex flex-col justify-between group">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4EFEA]">
                  <Image
                    src={activeCategory.featuredCard.imageSrc}
                    alt={activeCategory.featuredCard.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  {activeCategory.featuredCard.tag && (
                    <span className="absolute top-3 left-3 bg-[#1F1E1D]/80 backdrop-blur-sm text-[#FAF9F6] text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded">
                      {activeCategory.featuredCard.tag}
                    </span>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1 justify-between bg-white">
                  <div>
                    <h4 className="font-serif text-lg text-[#1F1E1D] font-medium leading-snug">
                      {activeCategory.featuredCard.title}
                    </h4>
                    <p className="text-xs text-[#75706B] mt-1 font-sans leading-relaxed">
                      {activeCategory.featuredCard.subtitle}
                    </p>
                  </div>

                  <Link
                    href={activeCategory.featuredCard.href}
                    onClick={onClose}
                    className="mt-4 inline-flex items-center justify-between w-full text-xs font-semibold tracking-wider uppercase text-[#1F1E1D] hover:text-[#C47D5A] pt-3 border-t border-[#EAE5DE] transition-colors"
                  >
                    <span>{activeCategory.featuredCard.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
