"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Scissors,
} from "lucide-react";
import { MOCK_PRODUCTS } from "@/data/mockProducts";
import { ProductCard } from "@/components/product/ProductCard";
import { NAVIGATION_CATEGORIES } from "@/data/navigationData";
import { CraftProcessShowcase } from "@/components/home/CraftProcessShowcase";
import { api, mapApiProduct } from "@/lib/api";
import { Product } from "@/types/product";

export default function HomePage() {
  const [bestsellers, setBestsellers] = useState<Product[]>(() =>
    MOCK_PRODUCTS.filter((p) => p.isBestSeller).slice(0, 4)
  );
  const [newArrivals, setNewArrivals] = useState<Product[]>(() =>
    MOCK_PRODUCTS.filter((p) => p.isNewArrival).slice(0, 4)
  );

  useEffect(() => {
    let isMounted = true;
    api
      .getFeaturedProducts()
      .then((data) => {
        if (!isMounted) return;
        if (data.bestsellers?.length > 0) {
          setBestsellers(data.bestsellers.map(mapApiProduct) as unknown as Product[]);
        }
        if (data.newArrivals?.length > 0) {
          setNewArrivals(data.newArrivals.map(mapApiProduct) as unknown as Product[]);
        }
      })
      .catch((err) => {
        console.warn("API featured load error, using fallback:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#FAF9F6] font-sans pb-20">
      {/* 1. Cinematic Hero Section with Brand Background Video (Model Face Completely Visible) */}
      <section className="relative -mt-[52px] pt-[52px] h-[95vh] min-h-[660px] w-full overflow-hidden flex flex-col justify-end items-center text-center pb-12 sm:pb-16 md:pb-20">
        {/* Background Video (Desktop 16:9 & Mobile 9:16, anchored to top so face is always visible) */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ objectPosition: "center 8%" }}
        >
          <source src="/windows_background.mp4" type="video/mp4" media="(min-width: 768px)" />
          <source src="/mobile_background.mp4" type="video/mp4" />
        </video>

        {/* Subtle Bottom Vignette Overlay: Leaves the model's face completely clear & unobstructed at the top */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141312]/90 via-black/35 to-transparent z-10 pointer-events-none" />

        {/* Hero Content (Positioned at bottom so model's face is completely unobstructed) */}
        <div className="relative z-20 max-w-4xl mx-auto px-6 text-white flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 text-[#FAF9F6] text-[11px] uppercase tracking-[0.25em] font-semibold px-3.5 py-1 rounded-full mb-3 animate-fade-in shadow-md">
            <Sparkles className="w-3 h-3 text-[#C47D5A]" />
            <span>The Festive & Wedding Edit &apos;26</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal tracking-wide leading-[1.15] max-w-3xl text-balance drop-shadow-md">
            Artisanal Grace, Handcrafted for Celebrations.
          </h1>

          <p className="text-xs sm:text-sm text-[#FAF9F6]/90 max-w-lg mt-3 mb-6 font-light leading-relaxed drop-shadow">
            Pure Chanderi silks, Banarasi weaves, and breathable handloom coordinates tailored with royal silhouettes.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/collections?collection=embroidered-satin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#FAF9F6] text-[#1F1E1D] hover:bg-[#C47D5A] hover:text-white text-xs font-semibold uppercase tracking-widest rounded shadow-xl transition-all duration-300 active:scale-95"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/collections"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-black/40 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold uppercase tracking-widest rounded transition-all duration-300 active:scale-95"
            >
              <span>View All Collections</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Signature Collections: Curated For Every Celebration */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#C47D5A]">
            Signature Collections
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1F1E1D] font-normal tracking-wide mt-2">
            Curated For Every Celebration
          </h2>
          <p className="text-xs sm:text-sm text-[#75706B] mt-2">
            Browse our three master collections crafted by premier heritage artisans
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {NAVIGATION_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="group relative rounded-xl overflow-hidden bg-white border border-[#EAE5DE] shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F4EFEA]">
                {category.featuredCard && (
                  <Image
                    src={category.featuredCard.imageSrc}
                    alt={category.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {category.badge && (
                  <span className="absolute top-4 left-4 bg-[#C47D5A] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                    {category.badge}
                  </span>
                )}

                {/* Overlay Text */}
                <div className="absolute bottom-4 inset-x-4 text-white">
                  <h3 className="font-serif text-2xl font-normal">
                    {category.title}
                  </h3>
                  <p className="text-xs text-white/80 mt-1 font-sans line-clamp-2">
                    {category.featuredCard?.subtitle}
                  </p>
                </div>
              </div>

              <div className="p-5 bg-white">
                <ul className="text-xs text-[#75706B] space-y-1.5 mb-4">
                  {category.subcategories.slice(0, 3).map((sub) => (
                    <li key={sub.title} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C47D5A]" />
                      <span>{sub.title}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={category.href}
                  className="inline-flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-[#1F1E1D] group-hover:text-[#C47D5A] pt-3 border-t border-[#EAE5DE] transition-colors"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Interactive Craft Process & Cloth Making Showcase */}
      <CraftProcessShowcase />

      {/* 4. Featured Bestsellers Showcase (Prompt 2 ProductCard Demo) */}
      <section className="bg-white border-y border-[#EAE5DE] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#C47D5A]">
                Most Loved
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1F1E1D] font-normal tracking-wide mt-1">
                Boutique Bestsellers
              </h2>
            </div>

            <Link
              href="/collections"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C47D5A] hover:text-[#A8623E] transition-colors"
            >
              <span>View All 31 Pieces</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {bestsellers.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-14 text-center border border-dashed border-[#EAE5DE] rounded-xl bg-[#FAF9F6]">
              <p className="font-serif text-lg text-[#1F1E1D] mb-1">Collection Updating</p>
              <p className="text-xs text-[#75706B]">New artisanal arrivals are being curated.</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Brand Value Props / Trust Guarantee */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 rounded-xl bg-white border border-[#EAE5DE] shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#F7EDE8] flex items-center justify-center text-[#C47D5A] mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-base text-[#1F1E1D] font-medium">
              Handloom Certified
            </h4>
            <p className="text-xs text-[#75706B] mt-1">
              Pure silk mark & authentic hand-carved block prints
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-[#EAE5DE] shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#F7EDE8] flex items-center justify-center text-[#C47D5A] mb-3">
              <Scissors className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-base text-[#1F1E1D] font-medium">
              Tailoring Margins
            </h4>
            <p className="text-xs text-[#75706B] mt-1">
              2 inches of inner margin on every luxury piece
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-[#EAE5DE] shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#F7EDE8] flex items-center justify-center text-[#C47D5A] mb-3">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-base text-[#1F1E1D] font-medium">
              Complimentary Express
            </h4>
            <p className="text-xs text-[#75706B] mt-1">
              Free nationwide delivery on orders over ₹2,999
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-[#EAE5DE] shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#F7EDE8] flex items-center justify-center text-[#C47D5A] mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-base text-[#1F1E1D] font-medium">
              Doorstep Returns
            </h4>
            <p className="text-xs text-[#75706B] mt-1">
              Seamless 7-day hassle-free exchange service
            </p>
          </div>
        </div>
      </section>

      {/* 5. New Arrivals Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#C47D5A]">
              Fresh Off The Loom
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1F1E1D] font-normal tracking-wide mt-1">
              New Arrivals
            </h2>
          </div>

          <Link
            href="/collections?sort=newest"
            className="text-xs font-semibold uppercase tracking-wider text-[#C47D5A] hover:underline"
          >
            View All New
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
