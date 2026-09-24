"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Ruler,
  ShoppingBag,
  Zap,
  Bell,
  ChevronDown,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Heart,
} from "lucide-react";

import { ImageGallery } from "@/components/product/ImageGallery";
import { SizeGuideModal } from "@/components/product/SizeGuideModal";
import { useCart } from "@/context/CartContext";
import { ApparelSize, ColorVariant, Product } from "@/types/product";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { CONTACT_INFO } from "@/data/contactInfo";
import { api, mapApiProduct } from "@/lib/api";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { addToCart, isInWishlist, toggleWishlist } = useCart();

  // Find fallback from mock
  const fallbackProduct = useMemo(() => {
    return null;
  }, [slug]);

  const [product, setProduct] = useState<Product | null>(fallbackProduct);
  const [isLoading, setIsLoading] = useState(!fallbackProduct);

  const isFavorited = product ? isInWishlist(product.id, product.slug) : false;

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;
    setIsLoading(!fallbackProduct);
    api
      .getProduct(slug)
      .then((data) => {
        if (isMounted && data) {
          const mapped = mapApiProduct(data) as unknown as Product;
          setProduct(mapped);
          if (mapped.colorVariants?.[0]) setSelectedColor(mapped.colorVariants[0]);
          if (mapped.sizes?.[0]) setSelectedSize(mapped.sizes[0]);
        }
      })
      .catch((err) => {
        console.warn("API product detail error, using fallback:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [slug, fallbackProduct]);

  // Active Color Variant State
  const [selectedColor, setSelectedColor] = useState<ColorVariant>(() => {
    return product?.colorVariants?.[0] || {
      name: "Default",
      hexCode: "#C47D5A",
      imageSrc: product?.primaryImage || "",
    };
  });

  // Active Size State
  const [selectedSize, setSelectedSize] = useState<ApparelSize>(() => {
    return product?.sizes?.[0] || "M";
  });

  // Size Guide Modal state
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Restock Notification modal/prompt state
  const [notifySize, setNotifySize] = useState<ApparelSize | null>(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySuccess, setNotifySuccess] = useState(false);

  // Accordion active state
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    fabricCare: true,
    makingProcess: true,
    stitchingDetails: false,
    shippingReturns: false,
  });

  const toggleAccordion = (key: string) => {
    setExpandedAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Gallery images update dynamically based on selected color variant (Prompt 4 requirement)
  const currentGalleryImages = useMemo(() => {
    if (!product) return [];
    if (selectedColor?.secondaryImageSrc) {
      return [
        selectedColor.imageSrc,
        selectedColor.secondaryImageSrc,
        ...(product.galleryImages || []).slice(2),
      ];
    }
    return [selectedColor?.imageSrc || product.primaryImage, ...(product.galleryImages || []).slice(1)];
  }, [selectedColor, product]);

  // Pricing calculations
  const hasDiscount = product ? product.regularPrice > product.discountedPrice : false;
  const savingsAmount = product ? product.regularPrice - product.discountedPrice : 0;
  const savingsPercentage = product && product.regularPrice
    ? Math.round((savingsAmount / product.regularPrice) * 100)
    : 0;

  const isUnstitched =
    product?.category === "unstitched" || !product?.sizes || product.sizes.length === 0;

  // Check if current selected size is out of stock
  const isSizeOutOfStock =
    product?.isSoldOut ||
    (!isUnstitched && selectedSize && product?.sizeStockMap?.[selectedSize] === false);

  const effectiveSize = isUnstitched ? "Unstitched" : selectedSize;

  const handleAddToCart = () => {
    if (!product || product.isSoldOut || isSizeOutOfStock) return;
    addToCart(product, effectiveSize as ApparelSize, selectedColor, 1);
  };

  const handleBuyNow = () => {
    if (!product || product.isSoldOut || isSizeOutOfStock) return;
    addToCart(product, effectiveSize as ApparelSize, selectedColor, 1);
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;
    // Redirect restock request to WhatsApp so the business receives the actual alert
    const waText = `Hello AKIK by Hafsa Khatri,\n\nI would like to be notified when the following is back in stock:\n• Product: ${product?.name ?? ""}\n• SKU: ${product?.sku ?? ""}\n• Size: ${notifySize}\n• My Email: ${notifyEmail}\n\nPlease alert me when available. Thank you!`;
    window.open(
      `https://wa.me/${CONTACT_INFO.phoneRaw}?text=${encodeURIComponent(waText)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setNotifySuccess(true);
    setTimeout(() => {
      setNotifySize(null);
      setNotifySuccess(false);
      setNotifyEmail("");
    }, 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-8 h-8 border-2 border-[#C47D5A] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-[#75706B]">Curating Ensemble...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#C47D5A] mb-2">
          404 — Piece Unavailable
        </span>
        <h1 className="text-3xl font-serif text-[#1F1E1D] mb-3">Product Not Found</h1>
        <p className="text-sm text-[#75706B] max-w-md mb-8 leading-relaxed">
          This piece is not available or may have been archived. Explore our current collections to discover similar designs.
        </p>
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1F1E1D] text-white text-xs font-semibold uppercase tracking-widest rounded-lg hover:bg-[#C47D5A] transition-colors"
        >
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans pb-24">
      {/* 2. Collection Breadcrumbs */}
      <div className="border-b border-[#EAE5DE] bg-white py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-medium text-[#75706B] overflow-x-auto">
          <Link href="/" className="hover:text-[#1F1E1D] shrink-0">
            Home
          </Link>
          <span>/</span>
          <Link
            href={`/collections?collection=${product.category}`}
            className="hover:text-[#1F1E1D] capitalize shrink-0"
          >
            {product.category} Collection
          </Link>
          <span>/</span>
          <Link
            href={`/collections?collection=${product.category}&sub=${encodeURIComponent(
              product.subcategory
            )}`}
            className="hover:text-[#1F1E1D] shrink-0"
          >
            {product.subcategory}
          </Link>
          <span>/</span>
          <span className="text-[#1F1E1D] font-semibold truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* 1. Gallery Section: Left 55% Width on Desktop */}
          <section className="lg:col-span-7">
            <ImageGallery
              images={currentGalleryImages}
              productName={product.name}
            />
          </section>

          {/* 2. Product Info & Action Section: Right 45% Width, Sticky */}
          <section className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            {/* Title, SKU & Reviews */}
            <div>
              <div className="flex items-center justify-between text-xs text-[#75706B] uppercase tracking-wider mb-2 font-semibold">
                <span>{product.subcategory}</span>
                <span className="font-mono">SKU: {product.sku}</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#1F1E1D] font-normal tracking-wide leading-snug">
                {product.name}
              </h1>

              {/* Star Rating & Verified Customer Review Summary */}
              <div className="flex items-center gap-2.5 mt-3 text-xs">
                <div className="flex items-center text-[#C47D5A]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(product.rating)
                          ? "fill-[#C47D5A]"
                          : "text-[#EAE5DE]"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-[#1F1E1D]">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-[#75706B]">
                  ({product.reviewCount} verified boutique reviews)
                </span>
              </div>
            </div>

            {/* Pricing Block with Savings Badge & GST Note */}
            <div className="p-4 rounded-lg bg-white border border-[#EAE5DE] shadow-sm">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-sans text-2xl sm:text-3xl font-bold text-[#1F1E1D]">
                  ₹{product.discountedPrice.toLocaleString()}
                </span>

                {hasDiscount && (
                  <>
                    <span className="font-sans text-base text-[#75706B] line-through">
                      ₹{product.regularPrice.toLocaleString()}
                    </span>

                    {/* Saved Savings Badge */}
                    <span className="inline-flex items-center gap-1 bg-[#F7EDE8] text-[#A8623E] border border-[#C47D5A]/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      Save ₹{savingsAmount.toLocaleString()} ({savingsPercentage}% off)
                    </span>
                  </>
                )}
              </div>

              {/* Tax Note */}
              <p className="text-[11px] text-[#75706B] mt-1.5 flex items-center gap-1">
                <span>Inclusive of all taxes (GST).</span>
                <span className="text-emerald-700 font-medium">Free express shipping above ₹2,999</span>
              </p>
            </div>

            {/* Color Selector */}
            <div>
              <div className="flex items-center justify-between mb-2.5 text-xs">
                <span className="font-semibold text-[#1F1E1D]">
                  Color: <strong className="text-[#C47D5A]">{selectedColor.name}</strong>
                </span>
                <span className="text-[#75706B]">
                  {product.colorVariants.length} Artisanal Shades
                </span>
              </div>

              {/* Clickable Color Circles with Active Ring Indicator */}
              <div className="flex items-center gap-3">
                {product.colorVariants.map((color) => {
                  const isCurrent = selectedColor.name === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Select color ${color.name}`}
                      className={`relative w-8 h-8 rounded-full transition-transform ${
                        isCurrent
                          ? "ring-2 ring-[#C47D5A] ring-offset-2 scale-110 shadow-sm"
                          : "border border-black/10 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hexCode }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Size Selector or Unstitched Notice */}
            {!isUnstitched ? (
              <div>
                <div className="flex items-center justify-between mb-2.5 text-xs">
                  <span className="font-semibold text-[#1F1E1D]">
                    Select Size: <strong className="text-[#C47D5A]">{selectedSize}</strong>
                  </span>

                  {/* Size Guide Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1 font-semibold text-[#C47D5A] hover:underline"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Guide</span>
                  </button>
                </div>

                {/* Size Chips */}
                <div className="grid grid-cols-6 gap-2">
                  {product.sizes.map((sz) => {
                    const isOutOfStock =
                      product.isSoldOut || product.sizeStockMap?.[sz] === false;
                    const isSelected = selectedSize === sz;

                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setSelectedSize(sz);
                          if (isOutOfStock) setNotifySize(sz);
                          else setNotifySize(null);
                        }}
                        className={`relative py-3 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                          isSelected
                            ? "bg-[#1F1E1D] text-white shadow-md border border-[#1F1E1D]"
                            : isOutOfStock
                            ? "bg-white/50 text-[#75706B]/50 border border-dashed border-[#EAE5DE] line-through cursor-pointer"
                            : "bg-white text-[#1F1E1D] border border-[#EAE5DE] hover:border-[#C47D5A]"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>

                {/* Struck-through Sold Out / "Notify Me" Trigger */}
                {isSizeOutOfStock && (
                  <div className="mt-3 p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Bell className="w-3.5 h-3.5 text-amber-700" />
                        Size {selectedSize} is currently out of stock
                      </span>
                      <button
                        type="button"
                        onClick={() => setNotifySize(selectedSize)}
                        className="font-bold text-amber-900 hover:underline"
                      >
                        Notify Me
                      </button>
                    </div>

                    {notifySize === selectedSize && (
                      <form
                        onSubmit={handleNotifySubmit}
                        className="mt-2.5 flex gap-2"
                      >
                        <input
                          type="email"
                          required
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-[#1F1E1D] text-white text-xs font-semibold rounded"
                        >
                          {notifySuccess ? "Registered!" : "Alert Me"}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-[#FAF9F6] border border-[#EAE5DE] text-xs text-[#75706B] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#1F1E1D] block">
                    Unstitched Fabric Piece
                  </span>
                  <span className="text-[11px] text-[#75706B]">
                    Complete 3-piece fabric cut • No sizing required • Ready for custom tailoring
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-white border border-[#EAE5DE] text-[10px] font-bold uppercase tracking-wider text-[#C47D5A] rounded shadow-sm">
                  Free Size Cut
                </span>
              </div>
            )}

            {/* CTA Buttons (Add to Bag & Buy It Now) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={product.isSoldOut || isSizeOutOfStock}
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 bg-[#1F1E1D] hover:bg-[#C47D5A] text-[#FAF9F6] text-xs font-semibold uppercase tracking-widest rounded-md shadow-lg transition-all duration-300 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {product.isSoldOut
                      ? "SOLD OUT"
                      : isSizeOutOfStock
                      ? "SIZE OUT OF STOCK"
                      : "Add to Bag"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => product && toggleWishlist(product.id, product.slug)}
                  aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                  className="p-3.5 rounded-md border border-[#EAE5DE] hover:border-[#C47D5A] bg-white text-[#1F1E1D] transition-all flex items-center justify-center hover:bg-[#F4EFEA] active:scale-95 shadow-sm"
                  title={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      isFavorited
                        ? "fill-[#C47D5A] text-[#C47D5A]"
                        : "text-[#1F1E1D] hover:text-[#C47D5A]"
                    }`}
                  />
                </button>
              </div>

              {/* Secondary Buy It Now Instant Checkout Button */}
              {!product.isSoldOut && !isSizeOutOfStock && (
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-white hover:bg-[#F4EFEA] border-2 border-[#1F1E1D] text-[#1F1E1D] text-xs font-semibold uppercase tracking-widest rounded-md shadow-sm transition-all duration-200"
                >
                  <Zap className="w-4 h-4 text-[#C47D5A]" />
                  <span>Buy It Now</span>
                </button>
              )}

              {/* WhatsApp Instant Enquiry Action */}
              <a
                href={`https://wa.me/${CONTACT_INFO.phoneRaw}?text=${encodeURIComponent(
                  `Hello AKIK by Hafsa Khatri,\n\nI would like to enquire about this product:\n• Name: ${product.name}\n• Price: ₹${product.discountedPrice.toLocaleString()}\n• Selected Size: ${selectedSize}\n• Shade: ${selectedColor.name}\n• SKU: ${product.sku}\n\nCould you please share availability and more details?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-[#25D366]/10 hover:bg-[#25D366] text-[#075E54] hover:text-white border border-[#25D366]/40 hover:border-[#25D366] text-xs font-semibold uppercase tracking-widest rounded-md shadow-sm transition-all duration-300 active:scale-[0.99] group"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366] group-hover:text-white transition-colors" />
                <span>Enquire on WhatsApp</span>
              </a>

              <p className="text-[11px] text-center text-[#75706B] flex items-center justify-center gap-1.5 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>Need custom styling or size guidance? WhatsApp: <strong>{CONTACT_INFO.phone}</strong></span>
              </p>
            </div>

            {/* Trust Micro-Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EAE5DE] text-center text-[11px] text-[#75706B]">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-[#C47D5A]" />
                <span>Express Dispatch</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#C47D5A]" />
                <span>100% Authentic Handloom</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-4 h-4 text-[#C47D5A]" />
                <span>7-Day Easy Exchange</span>
              </div>
            </div>

            {/* Accordion Tabs: "Fabric & Care", "Product Details & Stitching", "Shipping & Easy Returns" */}
            <div className="border-t border-[#EAE5DE] pt-2 divide-y divide-[#EAE5DE]">
              {/* Tab 1: Fabric & Care */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion("fabricCare")}
                  className="flex items-center justify-between w-full text-left font-serif text-base text-[#1F1E1D] hover:text-[#C47D5A]"
                >
                  <span>Fabric & Artisanal Care</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#75706B] transition-transform duration-200 ${
                      expandedAccordions.fabricCare ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {expandedAccordions.fabricCare && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-xs text-[#75706B] mt-2.5 leading-relaxed space-y-1.5"
                    >
                      <p>
                        <strong>Material:</strong> {product.fabricDetails}
                      </p>
                      <p>
                        <strong>Care:</strong>{" "}
                        {product.accordions?.fabricCare ||
                          "Dry clean recommended for the first two washes to preserve natural vegetable dyes and gold zari work."}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tab: Behind The Making Process Video */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion("makingProcess")}
                  className="flex items-center justify-between w-full text-left font-serif text-base text-[#1F1E1D] hover:text-[#C47D5A]"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C47D5A]" />
                    <span>Behind The Making (Cloth Making Reel)</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#75706B] transition-transform duration-200 ${
                      expandedAccordions.makingProcess ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {expandedAccordions.makingProcess && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-xs text-[#75706B] mt-3 leading-relaxed space-y-2"
                    >
                      <div className="relative aspect-[9/16] sm:aspect-video max-h-72 w-full rounded-lg overflow-hidden bg-black shadow-md border border-[#EAE5DE]">
                        <video
                          autoPlay
                          loop
                          muted
                          playsInline
                          controls
                          className="w-full h-full object-cover"
                        >
                          <source src="/videos/cloth_making_process.mp4" type="video/mp4" />
                        </video>
                      </div>
                      <p className="text-[11px] text-[#75706B]">
                        Authentic workshop footage: Watch master artisans hand-embroider intricate metallic zari and tailor the fabrics for AKIK luxury ensembles.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tab 2: Product Details & Stitching */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion("stitchingDetails")}
                  className="flex items-center justify-between w-full text-left font-serif text-base text-[#1F1E1D] hover:text-[#C47D5A]"
                >
                  <span>Product Details & Tailoring</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#75706B] transition-transform duration-200 ${
                      expandedAccordions.stitchingDetails ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {expandedAccordions.stitchingDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-xs text-[#75706B] mt-2.5 leading-relaxed space-y-1.5"
                    >
                      <p>{product.description}</p>
                      <p>
                        {product.accordions?.stitchingDetails ||
                          "Tailored with soft breathable inner lining and 2-inch concealed seams."}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tab 3: Shipping & Easy Returns */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion("shippingReturns")}
                  className="flex items-center justify-between w-full text-left font-serif text-base text-[#1F1E1D] hover:text-[#C47D5A]"
                >
                  <span>Shipping & Hassle-Free Returns</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#75706B] transition-transform duration-200 ${
                      expandedAccordions.shippingReturns ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {expandedAccordions.shippingReturns && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-xs text-[#75706B] mt-2.5 leading-relaxed space-y-2"
                    >
                      <p>
                        {product.accordions?.shippingReturns ||
                          "Dispatched within 24-48 business hours. Doorstep return pickup available across 19,000+ Indian pincodes within 7 days of delivery."}
                      </p>
                      <div className="pt-2 border-t border-[#EAE5DE] space-y-1 text-[11.5px] text-[#75706B]">
                        <p className="font-semibold text-[#1F1E1D] uppercase tracking-wider text-[10px]">Disclaimer:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>Colour variations may occur due to differences in lighting, photography, and screen settings.</li>
                          <li>Shipping charges are applicable separately.</li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Interactive Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />
    </div>
  );
}
