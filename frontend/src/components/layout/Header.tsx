"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Heart,
  ShoppingBag,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { MegaMenu } from "./MegaMenu";
import { MobileNav } from "./MobileNav";
import { AnnouncementBar } from "./AnnouncementBar";
import { NAVIGATION_CATEGORIES } from "@/data/navigationData";
import { MegaMenuCategory } from "@/types/navigation";
import { useCart } from "@/context/CartContext";
import { WhatsAppIcon, InstagramIcon } from "@/components/ui/Icons";
import { CONTACT_INFO } from "@/data/contactInfo";

export const Header: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<MegaMenuCategory | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const { wishlistCount, totalItemCount, openCart } = useCart();

  // Handle scroll shadow and background transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mega menu on route change
  useEffect(() => {
    setActiveCategory(null);
  }, [pathname]);

  const handleMouseEnter = (cat: MegaMenuCategory) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setActiveCategory(cat);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 180);
  };

  const cancelClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
  };

  // Clear admin auth whenever user is outside /admin
  useEffect(() => {
    if (pathname && !pathname.startsWith("/admin")) {
      sessionStorage.removeItem("akik_admin_token");
      sessionStorage.removeItem("akik_admin_info");
      localStorage.removeItem("akik_admin_token");
      localStorage.removeItem("akik_admin_info");
    }
  }, [pathname]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const isHomePage = pathname === "/";
  const isTransparent = isHomePage && !isScrolled;

  return (
    <>
      {/* Main Sticky Header */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isTransparent
            ? "bg-black/25 backdrop-blur-md text-white border-b border-white/15"
            : isScrolled
            ? "bg-[#FAF9F6]/95 backdrop-blur-md shadow-sm text-[#1F1E1D] border-b border-[#EAE5DE]"
            : "bg-[#FAF9F6] text-[#1F1E1D] border-b border-[#EAE5DE]/60"
        }`}
      >
        {/* Continuous Right-to-Left Marquee Announcement */}
        <AnnouncementBar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-13">
            {/* Left: Mobile Menu Toggle & Brand Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Open mobile navigation"
                className={`lg:hidden p-1.5 rounded-md transition-colors ${
                  isTransparent
                    ? "text-white hover:bg-white/15"
                    : "text-[#1F1E1D] hover:bg-[#F4EFEA]"
                }`}
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Brand Logo (Very slim, single-line) */}
              <Link
                href="/"
                className="flex items-center gap-2 group focus:outline-none focus:ring-1 focus:ring-[#C47D5A]/40 rounded p-0.5"
              >
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-[#C47D5A]/40 shadow-sm bg-white shrink-0">
                  <Image
                    src="/logo.jpeg"
                    alt="AKIK Boutique"
                    fill
                    sizes="32px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-serif text-lg sm:text-xl font-bold tracking-[0.16em] transition-colors uppercase leading-none ${
                      isTransparent
                        ? "text-white group-hover:text-[#C47D5A]"
                        : "text-[#1F1E1D] group-hover:text-[#C47D5A]"
                    }`}
                  >
                    AKIK
                  </span>
                  <span
                    className={`hidden sm:inline font-sans text-[8px] uppercase tracking-[0.25em] font-semibold border-l pl-1.5 leading-none ${
                      isTransparent
                        ? "text-white/70 border-white/30"
                        : "text-[#75706B] border-[#EAE5DE]"
                    }`}
                  >
                    Boutique
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Desktop Navigation Bar with MegaMenu Triggers */}
            <nav
              className="hidden lg:flex items-center gap-1 xl:gap-1.5 h-full"
              aria-label="Main Navigation"
            >
              {NAVIGATION_CATEGORIES.map((category) => {
                const isActive = activeCategory?.id === category.id;

                return (
                  <div
                    key={category.id}
                    onMouseEnter={() => handleMouseEnter(category)}
                    onMouseLeave={handleMouseLeave}
                    className="relative h-full flex items-center"
                  >
                    <Link
                      href={category.href}
                      aria-haspopup="true"
                      aria-expanded={isActive}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 rounded ${
                        category.isHighlighted
                          ? isTransparent
                            ? "text-white bg-[#C47D5A] font-bold shadow-sm"
                            : "text-[#C47D5A] hover:bg-[#C47D5A]/10 font-bold"
                          : isActive
                          ? isTransparent
                            ? "text-white bg-white/20"
                            : "text-[#1F1E1D] bg-[#F4EFEA]"
                          : isTransparent
                          ? "text-white/90 hover:text-white hover:bg-white/10"
                          : "text-[#1F1E1D]/80 hover:text-[#1F1E1D] hover:bg-[#F4EFEA]/70"
                      }`}
                    >
                      <span>{category.title}</span>

                      {category.badge && (
                        <span
                          className={`text-[8.5px] px-1 py-0.2 rounded-full uppercase tracking-widest font-bold ${
                            category.isHighlighted
                              ? "bg-[#C47D5A] text-white"
                              : isTransparent
                              ? "bg-white/20 text-white border border-white/30"
                              : "bg-[#F4EFEA] text-[#C47D5A] border border-[#C47D5A]/30"
                          }`}
                        >
                          {category.isHighlighted && (
                            <Sparkles className="w-2 h-2 inline mr-0.5" />
                          )}
                          {category.badge}
                        </span>
                      )}

                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                          isActive
                            ? "rotate-180 text-[#C47D5A]"
                            : isTransparent
                            ? "text-white/70"
                            : "text-[#75706B]"
                        }`}
                      />
                    </Link>
                  </div>
                );
              })}

              <Link
                href="/collections"
                className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded transition-colors ${
                  isTransparent
                    ? "text-white/90 hover:text-white hover:bg-white/10"
                    : "text-[#1F1E1D]/80 hover:text-[#1F1E1D] hover:bg-[#F4EFEA]/70"
                }`}
              >
                All Pieces
              </Link>

              <Link
                href="/contact"
                className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded transition-colors ${
                  isTransparent
                    ? "text-white/90 hover:text-white hover:bg-white/10"
                    : "text-[#1F1E1D]/80 hover:text-[#1F1E1D] hover:bg-[#F4EFEA]/70"
                }`}
              >
                Contact
              </Link>
            </nav>

            {/* Right: Utility Icons (Search, Wishlist, Cart Drawer) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Search Trigger */}
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                aria-label="Search catalog"
                className={`p-1.5 rounded-full transition-colors relative ${
                  isTransparent
                    ? "text-white hover:text-[#C47D5A] hover:bg-white/10"
                    : "text-[#1F1E1D] hover:text-[#C47D5A] hover:bg-[#F4EFEA]"
                }`}
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Wishlist Counter */}
              <Link
                href="/wishlist"
                aria-label={`Wishlist containing ${wishlistCount} items`}
                className={`p-1.5 rounded-full transition-colors relative ${
                  isTransparent
                    ? "text-white hover:text-[#C47D5A] hover:bg-white/10"
                    : "text-[#1F1E1D] hover:text-[#C47D5A] hover:bg-[#F4EFEA]"
                }`}
              >
                <Heart className="w-4 h-4" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] flex items-center justify-center text-[9px] font-bold text-white bg-[#C47D5A] rounded-full px-0.5 shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Instagram Direct Link */}
              <a
                href={CONTACT_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow AKIK on Instagram"
                className={`p-1.5 rounded-full transition-colors ${
                  isTransparent
                    ? "text-white hover:text-[#E1306C] hover:bg-white/10"
                    : "text-[#1F1E1D] hover:text-[#E1306C] hover:bg-[#F4EFEA]"
                }`}
              >
                <InstagramIcon className="w-4 h-4" />
              </a>

              {/* WhatsApp Quick Link */}
              <a
                href={CONTACT_INFO.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with AKIK on WhatsApp"
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  isTransparent
                    ? "bg-[#25D366]/25 text-[#25D366] hover:bg-[#25D366] hover:text-white"
                    : "bg-[#25D366]/15 text-[#075E54] hover:bg-[#25D366] hover:text-white"
                }`}
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                <span className="hidden xl:inline">WhatsApp</span>
              </a>

              {/* Cart Drawer Trigger with Live Badge */}
              <button
                type="button"
                onClick={openCart}
                aria-label={`Open shopping cart with ${totalItemCount} items`}
                className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 rounded-full sm:rounded-md transition-colors relative group ${
                  isTransparent
                    ? "text-white hover:text-[#C47D5A] hover:bg-white/10"
                    : "text-[#1F1E1D] hover:text-[#C47D5A] hover:bg-[#F4EFEA]"
                }`}
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 group-hover:scale-105 transition-transform" />
                  {totalItemCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] flex items-center justify-center text-[9px] font-bold text-white bg-[#C47D5A] rounded-full px-0.5 shadow-sm animate-fade-in">
                      {totalItemCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline font-sans text-[11px] font-semibold tracking-wide">
                  Bag
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Search Overlay Dropdown */}
        {isSearchOpen && (
          <div className="border-t border-[#EAE5DE] bg-white py-3 px-4 shadow-lg animate-fade-in">
            <div className="max-w-3xl mx-auto flex items-center gap-2">
              <Search className="w-4 h-4 text-[#C47D5A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by fabric, style, kurti set, saree, or co-ord..."
                className="w-full text-sm bg-transparent border-none focus:outline-none text-[#1F1E1D] placeholder-[#75706B]"
                autoFocus
              />
              <Link
                href={`/collections?q=${encodeURIComponent(searchQuery)}`}
                onClick={() => setIsSearchOpen(false)}
                className="text-xs uppercase tracking-wider font-semibold text-[#C47D5A] hover:text-[#A8623E] px-3 py-1.5 bg-[#F4EFEA] rounded"
              >
                Search
              </Link>
            </div>
          </div>
        )}

        {/* Desktop Mega Menu Dropdown */}
        <MegaMenu
          activeCategory={activeCategory}
          onClose={() => setActiveCategory(null)}
          onMouseEnter={cancelClose}
          onMouseLeave={handleMouseLeave}
        />
      </header>

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </>
  );
};
