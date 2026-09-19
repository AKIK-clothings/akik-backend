"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Search,
} from "lucide-react";
import { MOCK_PRODUCTS } from "@/data/mockProducts";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterContent } from "@/components/plp/FilterContent";
import { ApparelSize, Product, SortOption } from "@/types/product";
import { api, mapApiProduct } from "@/lib/api";

function CollectionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Mobile Bottom Sheet state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Read URL query parameters
  const collectionParam = searchParams.get("collection") || "all";
  const subParam = searchParams.getAll("sub");
  const sizeParam = searchParams.getAll("size") as ApparelSize[];
  const colorParam = searchParams.getAll("color");
  const stockParam = searchParams.get("inStock") === "true";
  const minPriceParam = Number(searchParams.get("minPrice")) || 1000;
  const maxPriceParam = Number(searchParams.get("maxPrice")) || 10000;
  const sortParam = (searchParams.get("sort") as SortOption) || "featured";
  const searchParam = searchParams.get("q") || "";

  // Helper to push updated query parameters to the URL
  const updateUrlParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    updater(params);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // State update handlers sync directly to URL
  const handleSelectCollection = (col: string) => {
    updateUrlParams((params) => {
      if (col === "all") params.delete("collection");
      else params.set("collection", col);
      params.delete("sub"); // reset subcategories when collection changes
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

  const handleToggleSize = (size: ApparelSize) => {
    updateUrlParams((params) => {
      const current = params.getAll("size");
      params.delete("size");
      if (current.includes(size)) {
        current.filter((s) => s !== size).forEach((s) => params.append("size", s));
      } else {
        [...current, size].forEach((s) => params.append("size", s));
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

  const handleResetFilters = () => {
    router.push(pathname, { scroll: false });
  };

  // Has active filters check
  const hasActiveFilters =
    collectionParam !== "all" ||
    subParam.length > 0 ||
    sizeParam.length > 0 ||
    colorParam.length > 0 ||
    stockParam ||
    maxPriceParam < 10000 ||
    Boolean(searchParam);

  // Products state (live from API, fallback to mock)
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

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
        console.warn("API load error, fallback used:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search term
      if (searchParam) {
        const query = searchParam.toLowerCase();
        const matchName = product.name.toLowerCase().includes(query);
        const matchSub = product.subcategory.toLowerCase().includes(query);
        const matchDesc = product.description.toLowerCase().includes(query);
        if (!matchName && !matchSub && !matchDesc) return false;
      }

      // Collection
      if (collectionParam !== "all" && product.category !== collectionParam) {
        return false;
      }

      // Subcategory multi-select
      if (subParam.length > 0 && !subParam.includes(product.subcategory)) {
        return false;
      }

      // Size multi-select
      if (sizeParam.length > 0) {
        const hasMatchingSize = sizeParam.some((sz) => product.sizes.includes(sz));
        if (!hasMatchingSize) return false;
      }

      // Color filter
      if (colorParam.length > 0) {
        const hasMatchingColor = product.colorVariants.some((v) =>
          colorParam.some((c) => v.name.toLowerCase().includes(c.toLowerCase()))
        );
        if (!hasMatchingColor) return false;
      }

      // In-stock only
      if (stockParam && product.isSoldOut) {
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
    }).sort((a, b) => {
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
    sizeParam,
    colorParam,
    stockParam,
    minPriceParam,
    maxPriceParam,
    sortParam,
    searchParam,
  ]);

  const activeCollectionTitle =
    collectionParam === "embroidered-satin"
      ? "Embroidered Satin with Dupatta (₹2,500)"
      : collectionParam === "luxury-cotton-satin"
      ? "Luxury Cotton Satin Catalogue (₹2,000)"
      : collectionParam === "satin-lucknowi"
      ? "Satin Lucknowi Collection (₹2,250)"
      : "All Curated Collections";

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans pb-24">
      {/* Page Header / Breadcrumb Hero */}
      <div className="border-b border-[#EAE5DE] bg-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-[#75706B] font-semibold mb-2">
            Home / Collections / {activeCollectionTitle}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1F1E1D] font-normal tracking-wide">
            {activeCollectionTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#75706B] mt-2 max-w-2xl leading-relaxed">
            Factory-direct luxury in combed cotton satin, artisanal embroidery, and handloom-inspired Chikankari needlework.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Control Bar: Total Count & Sorting */}
        <div className="flex items-center justify-between pb-6 border-b border-[#EAE5DE]">
          <div className="text-xs font-semibold text-[#75706B] uppercase tracking-wider">
            Showing <strong className="text-[#1F1E1D]">{filteredProducts.length}</strong> items
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
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div className="py-3.5 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[#75706B] font-semibold">Active:</span>

            {collectionParam !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#EAE5DE] rounded-full text-[#1F1E1D]">
                Collection: {collectionParam}
                <button
                  onClick={() => handleSelectCollection("all")}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {subParam.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#EAE5DE] rounded-full text-[#1F1E1D]"
              >
                {s}
                <button
                  onClick={() => handleToggleSubcategory(s)}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {sizeParam.map((sz) => (
              <span
                key={sz}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#EAE5DE] rounded-full text-[#1F1E1D]"
              >
                Size: {sz}
                <button
                  onClick={() => handleToggleSize(sz)}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {colorParam.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#EAE5DE] rounded-full text-[#1F1E1D]"
              >
                Color: {c}
                <button
                  onClick={() => handleToggleColor(c)}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {stockParam && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#EAE5DE] rounded-full text-[#1F1E1D]">
                In Stock Only
                <button
                  onClick={() => handleToggleInStock(false)}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#C47D5A] hover:underline ml-2"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main Grid & Desktop Sidebar Layout */}
        <div className="grid grid-cols-12 gap-8 mt-6 items-start">
          {/* Desktop Filter Sidebar (3 Columns / Sticky) */}
          <aside className="hidden lg:block col-span-3 sticky top-28 bg-white p-5 rounded-lg border border-[#EAE5DE] shadow-sm">
            <FilterContent
              selectedCollection={collectionParam}
              onSelectCollection={handleSelectCollection}
              selectedSubcategories={subParam}
              onToggleSubcategory={handleToggleSubcategory}
              selectedSizes={sizeParam}
              onToggleSize={handleToggleSize}
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

          {/* Product Grid Area (9 Columns on Desktop / 12 on Mobile) */}
          <main className="col-span-12 lg:col-span-9">
            {filteredProducts.length === 0 ? (
              /* Empty State UI */
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg border border-[#EAE5DE] min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-[#F4EFEA] flex items-center justify-center mb-4 text-[#C47D5A]">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl text-[#1F1E1D] font-normal">
                  No matching designs found
                </h3>
                <p className="text-xs sm:text-sm text-[#75706B] max-w-sm mt-2 mb-6 leading-relaxed">
                  We couldn&apos;t find any items matching your filter criteria. Try clearing some filters or expanding your price range.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1F1E1D] text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#C47D5A] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              /* Responsive Product Card Grid: 2-column mobile, 3-column desktop with sidebar */
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6">
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priorityImage={idx < 4}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Sticky Bottom "Filter & Sort" Action Trigger */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-[#EAE5DE] p-3 shadow-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1F1E1D] text-white text-xs font-semibold uppercase tracking-wider rounded-md"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#C47D5A]" />
            <span>Filter & Sort</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#C47D5A]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Filter & Sort Bottom Sheet Modal */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-[#1F1E1D]/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 inset-x-0 max-h-[85vh] bg-[#FAF9F6] rounded-t-2xl shadow-2xl z-50 flex flex-col overflow-hidden lg:hidden border-t border-[#EAE5DE]"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#EAE5DE]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#C47D5A]" />
                  <h3 className="font-serif text-lg font-normal text-[#1F1E1D]">
                    Filter & Sort
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 text-[#75706B] hover:text-[#1F1E1D] rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <FilterContent
                  selectedCollection={collectionParam}
                  onSelectCollection={handleSelectCollection}
                  selectedSubcategories={subParam}
                  onToggleSubcategory={handleToggleSubcategory}
                  selectedSizes={sizeParam}
                  onToggleSize={handleToggleSize}
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

              <div className="p-4 bg-white border-t border-[#EAE5DE] flex gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 py-3 border border-[#EAE5DE] text-xs font-semibold uppercase tracking-wider rounded text-[#1F1E1D]"
                >
                  Clear All
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

export default function CollectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="font-serif text-lg text-[#C47D5A] animate-pulse">
            Loading Boutique Collection...
          </div>
        </div>
      }
    >
      <CollectionsContent />
    </Suspense>
  );
}
