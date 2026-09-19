"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  productName,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const activeImage = images[activeIndex] || images[0] || "/images/embroidered-satin/blue-lavish-model.png";

  // Mouse move handler for hover zoom lens
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } =
      imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomCoords({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-4 items-start">
      {/* Desktop Left: Vertical Thumbnail Strip */}
      <div className="hidden md:flex flex-col gap-3 shrink-0 w-20">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveIndex(idx)}
            onMouseEnter={() => setActiveIndex(idx)}
            aria-label={`Thumbnail ${idx + 1}`}
            className={`relative aspect-[3/4] w-full overflow-hidden rounded-md border-2 transition-all bg-[#F4EFEA] ${
              activeIndex === idx
                ? "border-[#C47D5A] shadow-md scale-105"
                : "border-[#EAE5DE] opacity-70 hover:opacity-100 hover:border-[#75706B]"
            }`}
          >
            <Image
              src={img}
              alt={`${productName} thumbnail ${idx + 1}`}
              fill
              sizes="80px"
              className="object-cover object-top"
            />
          </button>
        ))}
      </div>

      {/* Main Active Image Container with Hover Zoom */}
      <div className="flex-1 w-full relative">
        <div
          ref={imageContainerRef}
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
          className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#F4EFEA] border border-[#EAE5DE] cursor-crosshair group shadow-sm select-none"
        >
          {/* Main Active Image */}
          <Image
            src={activeImage}
            alt={productName}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 55vw"
            className={`object-cover object-top transition-opacity duration-300 ${
              isZoomed ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* High-Resolution Zoom Lens Texture Inspection View (Prompt 4 requirement) */}
          {isZoomed && (
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-75"
              style={{
                backgroundImage: `url('${activeImage}')`,
                backgroundPosition: `${zoomCoords.x}% ${zoomCoords.y}%`,
                backgroundSize: "240%",
                backgroundRepeat: "no-repeat",
              }}
            />
          )}

          {/* Zoom Instruction Hint */}
          <div className="absolute bottom-3 right-3 pointer-events-none bg-black/60 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded flex items-center gap-1.5 opacity-90 group-hover:opacity-0 transition-opacity">
            <ZoomIn className="w-3 h-3" />
            <span>Hover to Inspect Weave</span>
          </div>

          {/* Navigation Arrows for Tablet / Mobile */}
          {images.length > 1 && (
            <div className="md:hidden">
              <button
                type="button"
                onClick={prevImage}
                aria-label="Previous photo"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow text-[#1F1E1D]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                aria-label="Next photo"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow text-[#1F1E1D]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile: Dot Indicators */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 md:hidden">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  activeIndex === idx ? "w-6 bg-[#C47D5A]" : "w-1.5 bg-[#EAE5DE]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
