"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronDown,
  Sparkles,
  Heart,
  ShoppingBag,
  Search,
  Phone,
  ArrowRight,
} from "lucide-react";
import { NAVIGATION_CATEGORIES } from "@/data/navigationData";
import { useCart } from "@/context/CartContext";
import { WhatsAppIcon, InstagramIcon } from "@/components/ui/Icons";
import { CONTACT_INFO } from "@/data/contactInfo";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "embroidered-satin": true, // open first by default
  });
  const { wishlistCount, totalItemCount, openCart } = useCart();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1F1E1D]/60 backdrop-blur-sm z-50 lg:hidden"
            aria-hidden="true"
          />

          {/* Off-Canvas Slide Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-md bg-[#FAF9F6] text-[#1F1E1D] shadow-2xl z-50 flex flex-col justify-between overflow-hidden lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE5DE] bg-white">
              <Link href="/" onClick={onClose} className="flex items-center gap-2">
                <span className="font-serif text-2xl tracking-wider font-bold text-[#1F1E1D]">
                  AKIK
                </span>
                <span className="text-[9px] uppercase tracking-widest text-[#C47D5A] font-semibold border-l border-[#C47D5A]/40 pl-2">
                  Boutique
                </span>
              </Link>

              <button
                onClick={onClose}
                aria-label="Close navigation drawer"
                className="p-2 text-[#75706B] hover:text-[#1F1E1D] hover:bg-[#F4EFEA] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search Shortcut */}
            <div className="p-4 border-b border-[#EAE5DE] bg-[#FAF9F6]">
              <Link
                href="/collections"
                onClick={onClose}
                className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-[#EAE5DE] rounded-lg text-xs text-[#75706B] shadow-inner"
              >
                <Search className="w-4 h-4 text-[#C47D5A]" />
                <span>Search Kurtis, Sarees, Co-ords...</span>
              </Link>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-[#EAE5DE]/70">
              {NAVIGATION_CATEGORIES.map((category) => {
                const isExpanded = !!expandedCategories[category.id];

                return (
                  <div key={category.id} className="py-2.5">
                    {/* Category Title Accordion Trigger */}
                    <div className="flex items-center justify-between">
                      <Link
                        href={category.href}
                        onClick={onClose}
                        className="flex items-center gap-2 font-serif text-lg font-normal text-[#1F1E1D] hover:text-[#C47D5A] transition-colors"
                      >
                        <span>{category.title}</span>
                        {category.badge && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#C47D5A]/15 text-[#C47D5A] border border-[#C47D5A]/30">
                            {category.badge}
                          </span>
                        )}
                      </Link>

                      <button
                        onClick={() => toggleCategory(category.id)}
                        aria-expanded={isExpanded}
                        aria-label={`Toggle ${category.title} subcategories`}
                        className="p-2 text-[#75706B] hover:text-[#1F1E1D] rounded transition-colors"
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </button>
                    </div>

                    {/* Collapsible Accordion Items */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 pb-1 pl-3 space-y-2">
                            {category.subcategories.map((sub) => (
                              <Link
                                key={sub.title}
                                href={sub.href}
                                onClick={onClose}
                                className="flex items-center justify-between py-2 text-sm text-[#75706B] hover:text-[#C47D5A] transition-colors"
                              >
                                <span className="font-sans">{sub.title}</span>
                                {sub.badge && (
                                  <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#F4EFEA] text-[#1F1E1D]">
                                    {sub.badge}
                                  </span>
                                )}
                              </Link>
                            ))}
                            <Link
                              href={category.href}
                              onClick={onClose}
                              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#C47D5A] pt-1"
                            >
                              <span>Explore All</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Utility Quick Links in Drawer */}
              <div className="py-4 space-y-2.5">
                <Link
                  href="/collections"
                  onClick={onClose}
                  className="flex items-center justify-between py-1.5 text-sm font-medium text-[#1F1E1D] hover:text-[#C47D5A]"
                >
                  <span>All Collections</span>
                  <span className="text-xs text-[#75706B]">Browse</span>
                </Link>

                <Link
                  href="/contact"
                  onClick={onClose}
                  className="flex items-center justify-between py-1.5 text-sm font-medium text-[#1F1E1D] hover:text-[#C47D5A]"
                >
                  <span>Contact & Concierge</span>
                  <span className="text-xs text-[#C47D5A]">WhatsApp</span>
                </Link>

                <div className="flex items-center justify-between py-1.5 text-sm font-medium text-[#1F1E1D]">
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#C47D5A]" />
                    Wishlist
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4EFEA] font-bold">
                    {wishlistCount}
                  </span>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    openCart();
                  }}
                  className="flex items-center justify-between w-full py-1.5 text-sm font-medium text-[#1F1E1D]"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#C47D5A]" />
                    Shopping Bag
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#C47D5A] text-white font-bold">
                    {totalItemCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Drawer Footer with Business Contact Support */}
            <div className="p-4 border-t border-[#EAE5DE] bg-[#F4EFEA]/90 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#75706B]">Boutique Direct:</span>
                <span className="font-bold text-[#1F1E1D]">{CONTACT_INFO.phone}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={CONTACT_INFO.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#25D366] text-white rounded-md text-[11px] font-bold shadow-sm"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={CONTACT_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1F1E1D] text-white rounded-md text-[11px] font-bold shadow-sm"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
