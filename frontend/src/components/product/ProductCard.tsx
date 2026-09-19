"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Check } from "lucide-react";
import { Product, ApparelSize, ColorVariant } from "@/types/product";
import { useCart } from "@/context/CartContext";

export interface ProductCardProps {
  product: Product;
  priorityImage?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  priorityImage = false,
}) => {
  const { addToCart, isInWishlist, toggleWishlist } = useCart();

  // Active color variant state
  const [selectedColor, setSelectedColor] = useState<ColorVariant>(
    product.colorVariants[0] || {
      name: "Default",
      hexCode: "#C47D5A",
      imageSrc: product.primaryImage,
    }
  );

  // Added-to-cart micro-interaction feedback state
  const [addedSizeFeedback, setAddedSizeFeedback] = useState<string | null>(null);

  const isFavorited = isInWishlist(product.id);

  // Discount percentage auto-calculation
  const discountPercentage =
    product.regularPrice > product.discountedPrice
      ? Math.round(
          ((product.regularPrice - product.discountedPrice) / product.regularPrice) * 100
        )
      : 0;

  const handleSizeClick = (e: React.MouseEvent, size: ApparelSize) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if out of stock
    const isOutOfStock = product.sizeStockMap?.[size] === false || product.isSoldOut;
    if (isOutOfStock) return;

    // Trigger cart addition
    addToCart(product, size, selectedColor, 1);

    // Provide micro-interaction feedback
    setAddedSizeFeedback(size);
    setTimeout(() => setAddedSizeFeedback(null), 1200);
  };

  const handleColorChange = (e: React.MouseEvent, color: ColorVariant) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColor(color);
  };

  const activeImage = selectedColor.imageSrc || product.primaryImage;
  const secondaryImage =
    selectedColor.secondaryImageSrc || product.secondaryImage || activeImage;

  return (
    <div className="group relative flex flex-col w-full text-left font-sans">
      {/* 1. Media Container: Aspect Ratio 3:4 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-[#F4EFEA] border border-[#EAE5DE]/80 shadow-sm transition-all duration-300 group-hover:shadow-md">
        <Link
          href={`/product/${product.slug}`}
          className="block w-full h-full relative"
          aria-label={`View ${product.name}`}
        >
          {/* Primary & Secondary Images (fade-in secondary on hover) */}
          <div
            className={`w-full h-full relative transition-all duration-500 ${
              product.isSoldOut ? "filter grayscale contrast-75 opacity-75" : ""
            }`}
          >
            {/* Primary Image */}
            <Image
              src={activeImage}
              alt={`${product.name} - ${selectedColor.name}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
              priority={priorityImage}
            />

            {/* Secondary Image Fade-in on Hover (Prompt 2 requirement) */}
            {!product.isSoldOut && secondaryImage && (
              <Image
                src={secondaryImage}
                alt={`${product.name} alternate view`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out"
              />
            )}
          </div>
        </Link>

        {/* Badges: Top-Left Discount Badge */}
        {discountPercentage > 0 && !product.isSoldOut && (
          <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
            <span className="inline-flex items-center bg-[#C47D5A] text-white text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md">
              {discountPercentage}% OFF
            </span>
          </div>
        )}

        {/* Badges: Top-Right Wishlist Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2.5 right-2.5 z-20 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white text-[#1F1E1D] hover:scale-110 active:scale-95 transition-all"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorited
                ? "fill-[#C47D5A] text-[#C47D5A]"
                : "text-[#1F1E1D] hover:text-[#C47D5A]"
            }`}
          />
        </button>

        {/* "Sold Out" Overlay (Prompt 2 requirement) */}
        {product.isSoldOut && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px] pointer-events-none">
            <span className="bg-[#1F1E1D] text-[#FAF9F6] text-xs sm:text-sm font-serif tracking-[0.2em] font-semibold px-4 py-1.5 rounded uppercase shadow-xl border border-white/20">
              SOLD OUT
            </span>
          </div>
        )}

        {/* 3. Quick-Add / Size Selector (Slides up on desktop hover) */}
        {!product.isSoldOut && (
          <div className="absolute bottom-0 inset-x-0 z-20 hidden md:block translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 pt-6">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/90 mb-1.5 text-center">
              Quick Add Size
            </div>
            <div className="flex items-center justify-center flex-wrap gap-1.5">
              {product.sizes.map((sz) => {
                const isOutOfStock = product.sizeStockMap?.[sz] === false;
                const isJustAdded = addedSizeFeedback === sz;

                return (
                  <button
                    key={sz}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={(e) => handleSizeClick(e, sz)}
                    aria-label={`Select size ${sz}`}
                    className={`relative min-w-[28px] h-7 px-2 text-xs font-semibold rounded flex items-center justify-center transition-all ${
                      isJustAdded
                        ? "bg-emerald-600 text-white scale-105"
                        : isOutOfStock
                        ? "bg-white/20 text-white/40 cursor-not-allowed line-through"
                        : "bg-white text-[#1F1E1D] hover:bg-[#C47D5A] hover:text-white active:scale-95 shadow"
                    }`}
                  >
                    {isJustAdded ? <Check className="w-3.5 h-3.5" /> : sz}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Color Swatches & Label */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {product.colorVariants.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.colorVariants.map((color) => {
              const isCurrent = selectedColor.name === color.name;
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={(e) => handleColorChange(e, color)}
                  onMouseEnter={() => setSelectedColor(color)}
                  aria-label={`Select color ${color.name}`}
                  className={`relative w-4 h-4 rounded-full transition-transform ${
                    isCurrent
                      ? "ring-2 ring-offset-1 ring-[#C47D5A] scale-110"
                      : "hover:scale-110 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color.hexCode }}
                />
              );
            })}
          </div>
        )}

        <span className="text-[11px] text-[#75706B] font-sans truncate">
          {selectedColor.name}
        </span>
      </div>

      {/* Product Category & Title */}
      <div className="mt-1.5">
        <span className="text-[11px] uppercase tracking-wider text-[#75706B] font-semibold">
          {product.subcategory}
        </span>
        <h3 className="font-serif text-sm sm:text-base font-normal text-[#1F1E1D] group-hover:text-[#C47D5A] transition-colors line-clamp-1 mt-0.5">
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
      </div>

      {/* Pricing Row */}
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-sans text-sm sm:text-base font-bold text-[#1F1E1D]">
          ₹{product.discountedPrice.toLocaleString()}
        </span>
        {product.regularPrice > product.discountedPrice && (
          <span className="font-sans text-xs text-[#75706B] line-through">
            ₹{product.regularPrice.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};
