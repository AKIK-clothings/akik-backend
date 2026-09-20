"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingBag,
  ArrowRight,
  Trash2,
  Sparkles,
  ShieldCheck,
  Truck,
  MessageCircle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ProductCard } from "@/components/product/ProductCard";
import { MOCK_PRODUCTS } from "@/data/mockProducts";
import { Product } from "@/types/product";
import { api, mapApiProduct } from "@/lib/api";
import { CONTACT_INFO } from "@/data/contactInfo";

export default function WishlistPage() {
  const { wishlist, wishlistCount, isInWishlist, clearWishlist, isHydrated } = useCart();
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);

  // Load live products from API, fall back to MOCK_PRODUCTS
  useEffect(() => {
    let isMounted = true;
    api
      .getProducts()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setProducts(data.map(mapApiProduct) as unknown as Product[]);
        }
      })
      .catch((err) => {
        console.warn("API product load failed for wishlist, using fallback:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Merge mock and API products to ensure 100% resolution for any saved slug or id
  const allAvailableProducts = useMemo(() => {
    const productMap = new Map<string, Product>();
    MOCK_PRODUCTS.forEach((p) => {
      productMap.set(p.slug, p);
    });
    products.forEach((p) => {
      productMap.set(p.slug, p);
    });
    return Array.from(productMap.values());
  }, [products]);

  // Filter products that match current wishlist
  const wishlistProducts = useMemo(() => {
    return allAvailableProducts.filter((product) =>
      isInWishlist(product.id, product.slug)
    );
  }, [allAvailableProducts, wishlist, isInWishlist]);

  // Featured recommendation fallback for empty state
  const trendingRecommendations = useMemo(() => {
    return allAvailableProducts.filter((p) => p.isBestSeller || p.isNewArrival).slice(0, 4);
  }, [allAvailableProducts]);

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#1F1E1D] pt-6 sm:pt-10 pb-24 font-sans">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-xs text-[#75706B]">
            <li>
              <Link href="/" className="hover:text-[#C47D5A] transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/collections" className="hover:text-[#C47D5A] transition-colors">
                Collections
              </Link>
            </li>
            <li>/</li>
            <li className="font-semibold text-[#1F1E1D]">Wishlist</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-[#EAE5DE] gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-[#C47D5A] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Saved Ensembles</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1F1E1D] font-normal tracking-wide">
              My Wishlist
            </h1>
            <p className="text-xs sm:text-sm text-[#75706B] mt-2 max-w-xl leading-relaxed">
              Your personal gallery of handcrafted silhouettes, saved for your festive gatherings and celebrations.
            </p>
          </div>

          {/* Action Bar (when items present) */}
          {isHydrated && wishlistProducts.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearWishlist}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#75706B] hover:text-red-700 hover:bg-red-50 rounded border border-[#EAE5DE] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[#1F1E1D] hover:bg-[#C47D5A] text-white rounded transition-colors"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        {!isHydrated ? (
          // Loading Skeleton
          <div className="py-20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-[#EAE5DE]/40 rounded-lg aspect-[3/4]" />
            ))}
          </div>
        ) : wishlistProducts.length === 0 ? (
          // Empty State
          <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#F4EFEA] flex items-center justify-center mb-6 shadow-sm border border-[#EAE5DE]"
            >
              <Heart className="w-10 h-10 text-[#C47D5A]/70 stroke-[1.5]" />
            </motion.div>

            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#1F1E1D] mb-3">
              Your Wishlist is Empty
            </h2>
            <p className="text-xs sm:text-sm text-[#75706B] max-w-md mb-8 leading-relaxed">
              Explore our festive &amp; wedding edits, Banarasi weaves, and breathable handloom coordinates, then tap the heart to save your favorites.
            </p>

            <Link
              href="/collections"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#1F1E1D] hover:bg-[#C47D5A] text-[#FAF9F6] text-xs font-semibold uppercase tracking-widest rounded shadow-md transition-all duration-300 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore All Collections</span>
            </Link>

            {/* Recommended Products Carousel / Showcase */}
            {trendingRecommendations.length > 0 && (
              <div className="w-full mt-20 pt-12 border-t border-[#EAE5DE] text-left">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl text-[#1F1E1D]">
                      Trending Silhouettes
                    </h3>
                    <p className="text-xs text-[#75706B] mt-1">
                      Our most sought-after festive and wedding favourites
                    </p>
                  </div>
                  <Link
                    href="/collections?sort=featured"
                    className="text-xs font-semibold text-[#C47D5A] hover:underline flex items-center gap-1"
                  >
                    <span>View More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {trendingRecommendations.map((item, idx) => (
                    <ProductCard key={item.slug || item.id} product={item} priorityImage={idx === 0} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Populated Wishlist Grid
          <div className="pt-8">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#75706B]">
                Showing <strong className="text-[#1F1E1D]">{wishlistProducts.length}</strong> saved {wishlistProducts.length === 1 ? "silhouette" : "silhouettes"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              <AnimatePresence>
                {wishlistProducts.map((product, idx) => (
                  <motion.div
                    key={product.slug || product.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ProductCard product={product} priorityImage={idx < 4} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Assurance / Boutique Values Banner */}
        <section className="mt-20 pt-12 border-t border-[#EAE5DE] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-white/60 border border-[#EAE5DE]/60">
            <div className="p-2 rounded bg-[#F4EFEA] text-[#C47D5A] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F1E1D]">
                Free Shipping Above ₹3,000
              </h4>
              <p className="text-[11px] text-[#75706B] mt-1 leading-relaxed">
                Complimentary insured delivery across all Indian pin codes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-white/60 border border-[#EAE5DE]/60">
            <div className="p-2 rounded bg-[#F4EFEA] text-[#C47D5A] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F1E1D]">
                100% Authentic Handloom
              </h4>
              <p className="text-[11px] text-[#75706B] mt-1 leading-relaxed">
                Direct factory-to-consumer artisanal crafts &amp; pure fabrics.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-white/60 border border-[#EAE5DE]/60">
            <div className="p-2 rounded bg-[#F4EFEA] text-[#C47D5A] shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F1E1D]">
                WhatsApp Styling Concierge
              </h4>
              <p className="text-[11px] text-[#75706B] mt-1 leading-relaxed">
                Need sizing advice or customizations? Chat directly with Hafsa.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
