"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Heart,
  Package,
} from "lucide-react";

import { ProductCard } from "@/components/product/ProductCard";
import { FilterContent } from "@/components/plp/FilterContent";
import { Product, SortOption } from "@/types/product";
import { api, mapApiProduct } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { CONTACT_INFO } from "@/data/contactInfo";

interface MenCollectionContentProps {
  defaultCategory?: string;
}

const FALLBACK_MEN_SUBCATEGORIES = [
  "Premium Cotton Plain",
  "Premium cotton self designed",
];

export function MenCollectionContent({ defaultCategory = "kurta-sets" }: MenCollectionContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isInWishlist, wishlistCount } = useCart();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [subcategories, setSubcategories] = useState<string[]>(FALLBACK_MEN_SUBCATEGORIES);

  // Read URL query parameters
  const collectionParam = searchParams.get("collection") || defaultCategory;
  const subParam = searchParams.getAll("sub");
  const colorParam = searchParams.getAll("color");
  const stockParam = searchParams.get("inStock") === "true";
  const minPriceParam = Number(searchParams.get("minPrice")) || 1000;
  const maxPriceParam = Number(searchParams.get("maxPrice")) || 10000;
  const sortParam = (searchParams.get("sort") as SortOption) || "featured";
  const searchParam = searchParams.get("q") || "";
  const wishlistParam = searchParams.get("wishlist") === "true";

  const updateUrlParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    updater(params);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSelectCollection = (col: string) => {
    updateUrlParams((params) => {
      if (col === "all") params.delete("collection");
      else params.set("collection", col);
      params.delete("sub");
    });
  };

  const handleToggleSubcategory = (sub: string) => {
    updateUrlParams((params) => {
      const current = params.getAll("sub");
      params.delete("sub");
      if (current.includes(sub)) {
        current.filter((s) => s !== sub).forEach((s) => params.append("sub", s));
      } else {
        [...current, sub].forEach((s) => params.append("sub", s));
      }
    });
  };

  const handleToggleColor = (colorName: string) => {
    updateUrlParams((params) => {
      const current = params.getAll("color");
      params.delete("color");
      if (current.includes(colorName)) {
        current.filter((c) => c !== colorName).forEach((c) => params.append("color", c));
      } else {
        [...current, colorName].forEach((c) => params.append("color", c));
      }
    });
  };

  const handleToggleInStock = (val: boolean) => {
    updateUrlParams((params) => {
      if (val) params.set("inStock", "true");
      else params.delete("inStock");
    });
  };

  const handleChangePriceRange = (range: [number, number]) => {
    updateUrlParams((params) => {
      params.set("minPrice", range[0].toString());
      params.set("maxPrice", range[1].toString());
    });
  };

  const handleSortChange = (sort: SortOption) => {
    updateUrlParams((params) => {
      params.set("sort", sort);
    });
  };

  const handleToggleWishlistOnly = (val: boolean) => {
    updateUrlParams((params) => {
      if (val) params.set("wishlist", "true");
      else params.delete("wishlist");
    });
  };

  const handleResetFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const hasActiveFilters =
    subParam.length > 0 ||
    colorParam.length > 0 ||
    stockParam ||
    wishlistParam ||
    maxPriceParam < 10000 ||
    Boolean(searchParam);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load subcategories for Men
  useEffect(() => {
    let isMounted = true;
    api
      .getSubcategories("men")
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          setSubcategories(items.map((it) => it.name));
        }
      })
      .catch(() => {
        // Fallback default
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Men products
  useEffect(() => {
    let isMounted = true;
    api
      .getProducts({ section: "men" })
      .then((data) => {
        if (isMounted && data) {
          setProducts(data.map(mapApiProduct) as unknown as Product[]);
        }
      })
      .catch((err) => {
        console.warn("Men products load error:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search term
        if (searchParam) {
          const query = searchParam.toLowerCase();
          const matchName = product.name.toLowerCase().includes(query);
          const matchSub = product.subcategory.toLowerCase().includes(query);
          const matchDesc = product.description.toLowerCase().includes(query);
          if (!matchName && !matchSub && !matchDesc) return false;
        }

        // Collection / category filter if not "all"
        if (collectionParam !== "all" && product.category !== collectionParam) {
          return false;
        }

        // Subcategory filter
        if (subParam.length > 0 && !subParam.includes(product.subcategory)) {
          return false;
        }

        // Color filter
        if (colorParam.length > 0) {
          const hasMatchingColor = product.colorVariants.some((v) =>
            colorParam.some((c) => v.name.toLowerCase().includes(c.toLowerCase()))
          );
          if (!hasMatchingColor) return false;
        }

        // In stock
        if (stockParam && product.isSoldOut) {
          return false;
        }

        // Wishlist
        if (wishlistParam && !isInWishlist(product.id, product.slug)) {
          return false;
        }

        // Price range
        if (
          product.discountedPrice < minPriceParam ||
          product.discountedPrice > maxPriceParam
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortParam === "newest") return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
        if (sortParam === "price-asc") return a.discountedPrice - b.discountedPrice;
        if (sortParam === "price-desc") return b.discountedPrice - a.discountedPrice;
        if (sortParam === "discount") {
          const discA = ((a.regularPrice - a.discountedPrice) / a.regularPrice) * 100;
          const discB = ((b.regularPrice - b.discountedPrice) / b.regularPrice) * 100;
          return discB - discA;
        }
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [
    products,
    collectionParam,
    subParam,
    colorParam,
    stockParam,
    wishlistParam,
    minPriceParam,
    maxPriceParam,
    sortParam,
    searchParam,
    isInWishlist,
  ]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans pb-24">
      {/* Page Header / Breadcrumb Hero */}
      <div className="border-b border-[#EAE5DE] bg-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-[#75706B] font-semibold mb-2">
            <Link href="/" className="hover:text-[#1F1E1D]">Home</Link> /{" "}
            <Link href="/men" className="hover:text-[#1F1E1D]">Men</Link> /{" "}
            <span className="text-[#1F1E1D]">Kurta Sets</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1F1E1D] font-normal tracking-wide">
            Men&apos;s Collection — Unstitched Kurta Sets
          </h1>
          <p className="text-xs sm:text-sm text-[#75706B] mt-2 max-w-2xl leading-relaxed">
            Artisanal unstitched kurta fabric sets crafted for bespoke men&apos;s tailoring in Premium Cotton Plain and Self Designed textures.
          </p>

          {/* Subcategory Pills */}
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                updateUrlParams((params) => {
                  params.delete("sub");
                });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                subParam.length === 0
                  ? "bg-[#1F1E1D] text-white shadow-sm"
                  : "bg-[#F4EFEA] text-[#75706B] hover:bg-[#EAE5DE] hover:text-[#1F1E1D]"
              }`}
            >
              All Kurta Sets
            </button>
            {subcategories.map((subName) => {
              const isActive = subParam.includes(subName);
              return (
                <button
                  key={subName}
                  type="button"
                  onClick={() => handleToggleSubcategory(subName)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#C47D5A] text-white shadow-sm"
                      : "bg-[#F4EFEA] text-[#75706B] hover:bg-[#EAE5DE] hover:text-[#1F1E1D]"
                  }`}
                >
                  {subName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Control Bar: Total Count & Sorting */}
        <div className="flex items-center justify-between pb-6 border-b border-[#EAE5DE]">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-[#75706B] uppercase tracking-wider">
              Showing <strong className="text-[#1F1E1D]">{filteredProducts.length}</strong> items
            </div>

            {wishlistCount > 0 && (
              <button
                type="button"
                onClick={() => handleToggleWishlistOnly(!wishlistParam)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  wishlistParam
                    ? "bg-[#C47D5A] text-white shadow-sm"
                    : "bg-[#F4EFEA] text-[#1F1E1D] hover:bg-[#EAE5DE]"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${wishlistParam ? "fill-white text-white" : "text-[#C47D5A]"}`} />
                <span>Favorites ({wishlistCount})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider text-[#75706B]">
              Sort By:
            </span>
            <div className="relative inline-block">
              <select
                value={sortParam}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="appearance-none bg-white border border-[#EAE5DE] text-xs font-semibold text-[#1F1E1D] py-2 pl-3 pr-8 rounded focus:outline-none focus:border-[#C47D5A] cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="newest">New Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Biggest Discount</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#75706B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#EAE5DE] text-xs font-semibold text-[#1F1E1D] rounded hover:border-[#C47D5A] transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C47D5A]" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#C47D5A]" />
              )}
            </button>
          </div>
        </div>

        {/* Active Filters Badges */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 py-3 flex-wrap">
            <span className="text-xs text-[#75706B] font-semibold">Active:</span>

            {subParam.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#EAE5DE] text-xs text-[#1F1E1D] rounded-full shadow-2xs"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => handleToggleSubcategory(s)}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {colorParam.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#EAE5DE] text-xs text-[#1F1E1D] rounded-full shadow-2xs"
              >
                <span>Color: {c}</span>
                <button
                  type="button"
                  onClick={() => handleToggleColor(c)}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {stockParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#EAE5DE] text-xs text-[#1F1E1D] rounded-full shadow-2xs">
                <span>In Stock Only</span>
                <button
                  type="button"
                  onClick={() => handleToggleInStock(false)}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-[#C47D5A] hover:underline font-semibold ml-2 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        )}

        {/* Main PLP Layout: Sidebar Filter & Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6 items-start">
          {/* Desktop Left Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 bg-white p-6 rounded-lg border border-[#EAE5DE] shadow-2xs sticky top-28">
            <FilterContent
              section="men"
              subcategoriesList={subcategories}
              selectedCollection={collectionParam}
              onSelectCollection={handleSelectCollection}
              selectedSubcategories={subParam}
              onToggleSubcategory={handleToggleSubcategory}
              selectedSizes={[]}
              onToggleSize={() => {}}
              selectedColors={colorParam}
              onToggleColor={handleToggleColor}
              inStockOnly={stockParam}
              onToggleInStock={handleToggleInStock}
              priceRange={[minPriceParam, maxPriceParam]}
              onChangePriceRange={handleChangePriceRange}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </aside>

          {/* Right Product Grid */}
          <main className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] bg-[#F4EFEA] animate-pulse rounded-md border border-[#EAE5DE]"
                  />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priorityImage={idx < 3}
                  />
                ))}
              </div>
            ) : (
              /* On-Brand Elegant Empty State */
              <div className="text-center py-16 px-6 bg-white rounded-xl border border-[#EAE5DE] shadow-sm max-w-lg mx-auto">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#FAF9F6] border border-[#EAE5DE] flex items-center justify-center text-[#C47D5A]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl text-[#1F1E1D] font-normal mb-2">
                  {hasActiveFilters ? "No Products Match Your Filter" : "Men's Collection Coming Soon"}
                </h3>
                <p className="text-xs sm:text-sm text-[#75706B] leading-relaxed mb-6">
                  {hasActiveFilters
                    ? "Try adjusting your price or subcategory filters to view available kurta sets."
                    : "Our master artisans are preparing the initial launch of unstitched Kurta Sets in Premium Cotton Plain and Self Designed textures."}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-5 py-2.5 bg-[#1F1E1D] text-white text-xs font-semibold rounded-lg hover:bg-[#333] transition-colors"
                    >
                      Clear Filters
                    </button>
                  ) : (
                    <>
                      <Link
                        href="/collections"
                        className="px-5 py-2.5 bg-[#1F1E1D] text-white text-xs font-semibold rounded-lg hover:bg-[#333] transition-colors"
                      >
                        Explore Women&apos;s Collection
                      </Link>
                      <a
                        href={CONTACT_INFO.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg hover:bg-[#1EBE5D] transition-colors"
                      >
                        <WhatsAppIcon className="w-4 h-4 fill-white" />
                        <span>Enquire on WhatsApp</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-[#1F1E1D]/60 backdrop-blur-xs z-50 lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-2xl z-50 flex flex-col overflow-hidden shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#EAE5DE]">
                <span className="font-serif text-lg font-bold text-[#1F1E1D]">Filters</span>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-[#75706B] hover:text-[#1F1E1D]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <FilterContent
                  section="men"
                  subcategoriesList={subcategories}
                  selectedCollection={collectionParam}
                  onSelectCollection={handleSelectCollection}
                  selectedSubcategories={subParam}
                  onToggleSubcategory={handleToggleSubcategory}
                  selectedSizes={[]}
                  onToggleSize={() => {}}
                  selectedColors={colorParam}
                  onToggleColor={handleToggleColor}
                  inStockOnly={stockParam}
                  onToggleInStock={handleToggleInStock}
                  priceRange={[minPriceParam, maxPriceParam]}
                  onChangePriceRange={handleChangePriceRange}
                  onResetFilters={handleResetFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>

              <div className="p-4 border-t border-[#EAE5DE] flex gap-3 bg-[#FAF9F6]">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-3 border border-[#EAE5DE] text-xs font-semibold uppercase tracking-wider rounded text-[#75706B] hover:bg-white"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-3 bg-[#1F1E1D] text-white text-xs font-semibold uppercase tracking-wider rounded"
                >
                  View {filteredProducts.length} Items
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
