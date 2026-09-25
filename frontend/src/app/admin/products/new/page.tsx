"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, Plus, Minus } from "lucide-react";
import { adminApi } from "@/lib/api";

const CATEGORIES = [
  { value: "stitched", label: "Stitched" },
  { value: "unstitched", label: "Unstitched" },
  { value: "kids", label: "Kids" },
];

const SUBCATEGORIES = [
  "Embroidered Satin with Dupatta",
  "Luxury Cotton Satin",
  "Satin Lucknowi Collection",
  "Rose Royale Collection",
  "PURE COTTON SUITS",
];

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];

export default function AdminNewProductPage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", category: "unstitched", subcategory: "Embroidered Satin with Dupatta",
    regularPrice: "", discountedPrice: "",
    description: "", fabricDetails: "", dimensions: "",
    sku: "", isNewArrival: false, isBestSeller: false, isFeatured: false, isActive: true,
    fabricCare: "Dry clean or gentle cold hand wash.",
    stitchingDetails: "Comes with 2.5-inch inner margins for tailoring.",
    shippingReturns: "Dispatched within 24-48 hours. 7-day exchanges across India.",
  });

  const [selectedSizes, setSelectedSizes] = useState<string[]>(["S", "M", "L", "XL", "XXL", "XXXL"]);
  const [colorVariants, setColorVariants] = useState([{ name: "", hexCode: "#C47D5A" }]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isCustomSubcategory, setIsCustomSubcategory] = useState(false);
  const [customSubcategory, setCustomSubcategory] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const isUnstitched = form.category === "unstitched";
      const finalSizes = isUnstitched ? [] : selectedSizes;
      const sizeStockMap: Record<string, boolean> = {};
      if (!isUnstitched) {
        finalSizes.forEach((s) => { sizeStockMap[s] = true; });
      }

      // Step 1: Create product record
      const finalSubcategory = isCustomSubcategory ? customSubcategory.trim() : form.subcategory;
      if (isCustomSubcategory && !customSubcategory.trim()) {
        setError("Please enter a custom subcategory name");
        setIsSubmitting(false);
        return;
      }

      const { product } = await adminApi.createProduct({
        name: form.name,
        category: form.category,
        subcategory: finalSubcategory,
        regularPrice: Number(form.regularPrice) || Number(form.discountedPrice),
        discountedPrice: Number(form.discountedPrice),
        sizes: finalSizes,
        sizeStockMap,
        colorVariants: colorVariants.filter((c) => c.name),
        sku: form.sku,
        description: form.description,
        fabricDetails: form.fabricDetails,
        dimensions: form.dimensions,
        isNewArrival: form.isNewArrival,
        isBestSeller: form.isBestSeller,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        accordions: {
          fabricCare: form.fabricCare,
          stitchingDetails: form.stitchingDetails,
          shippingReturns: form.shippingReturns,
        },
      }) as { product: { id: string } };

      // Step 2: Upload images if any
      if (imageFiles.length > 0) {
        const { urls } = await adminApi.uploadImages(product.id, imageFiles) as { urls: string[] };

        // Update product with first image as primary
        await adminApi.updateProduct(product.id, {
          primaryImage: urls[0] || "",
          secondaryImage: urls[1] || "",
          galleryImages: urls,
          colorVariants: colorVariants.filter((c) => c.name).map((c, i) => ({
            ...c,
            imageSrc: urls[i] || urls[0] || "",
          })),
        });
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1918]">Add New Product</h1>
        <p className="text-sm text-[#75706B] mt-1">Fill in the product details below</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-[#1A1918]">Basic Information</h2>
          <div>
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Product Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              placeholder="e.g. Blue Lavish on Black Satin Embroidered Suit"
              className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Category *</label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] bg-white transition-colors">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#75706B] uppercase tracking-wider">Subcategory *</label>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isCustomSubcategory;
                    setIsCustomSubcategory(next);
                    if (!next) {
                      setForm((prev) => ({ ...prev, subcategory: SUBCATEGORIES[0] }));
                    }
                  }}
                  className="text-xs text-[#C47D5A] hover:underline font-medium cursor-pointer"
                >
                  {isCustomSubcategory ? "Choose from list" : "+ Add custom"}
                </button>
              </div>
              {isCustomSubcategory ? (
                <input
                  type="text"
                  placeholder="Enter custom subcategory (e.g. PURE COTTON SUITS)"
                  value={customSubcategory}
                  onChange={(e) => setCustomSubcategory(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-[#C47D5A] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#C47D5A] bg-[#FFFDFC] transition-colors"
                />
              ) : (
                <select
                  name="subcategory"
                  value={form.subcategory}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setIsCustomSubcategory(true);
                      setCustomSubcategory("");
                    } else {
                      handleChange(e);
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] bg-white transition-colors"
                >
                  {SUBCATEGORIES.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  <option value="__custom__">+ Custom Subcategory...</option>
                </select>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Regular Price (₹)</label>
              <input name="regularPrice" value={form.regularPrice} onChange={handleChange} type="number" min="0"
                placeholder="3499"
                className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Sale Price (₹) *</label>
              <input name="discountedPrice" value={form.discountedPrice} onChange={handleChange} type="number" min="0" required
                placeholder="2500"
                className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">SKU</label>
            <input name="sku" value={form.sku} onChange={handleChange}
              placeholder="AKIK-ESD-001"
              className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] transition-colors" />
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-[#1A1918]">Product Images</h2>
          <div className="flex flex-wrap gap-3">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#EAE5DE]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => imageInputRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-[#EAE5DE] rounded-lg flex flex-col items-center justify-center text-[#A8A49F] hover:border-[#C47D5A] hover:text-[#C47D5A] transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              <span className="text-[10px] mt-1">Add</span>
            </button>
          </div>
          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
          <p className="text-xs text-[#A8A49F]">First image will be the primary display image. Max 10 images, 10MB each.</p>
        </div>

        {/* Sizes */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-[#1A1918]">Available Sizes</h2>
          {form.category === "unstitched" ? (
            <p className="text-xs text-[#75706B] bg-[#FAF9F6] p-3 rounded-lg border border-[#EAE5DE]">
              Unstitched category does not require sizes. Products in this category are standard full fabric cuts.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <button key={size} type="button" onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedSizes.includes(size)
                      ? "bg-[#1A1918] text-white border-[#1A1918]"
                      : "bg-white text-[#75706B] border-[#EAE5DE] hover:border-[#1A1918]"
                  }`}>
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Variants */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-[#1A1918]">Color Variants</h2>
          {colorVariants.map((color, i) => (
            <div key={i} className="flex items-center gap-3">
              <input type="color" value={color.hexCode}
                onChange={(e) => setColorVariants((prev) => prev.map((c, idx) => idx === i ? { ...c, hexCode: e.target.value } : c))}
                className="w-10 h-10 rounded-lg border border-[#EAE5DE] cursor-pointer" />
              <input value={color.name} placeholder="Color name (e.g. Midnight Black)"
                onChange={(e) => setColorVariants((prev) => prev.map((c, idx) => idx === i ? { ...c, name: e.target.value } : c))}
                className="flex-1 px-3 py-2 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]" />
              {colorVariants.length > 1 && (
                <button type="button" onClick={() => setColorVariants((prev) => prev.filter((_, idx) => idx !== i))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setColorVariants((prev) => [...prev, { name: "", hexCode: "#C47D5A" }])}
            className="flex items-center gap-2 text-sm text-[#C47D5A] hover:text-[#A86947] font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Color Variant
          </button>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-[#1A1918]">Product Details</h2>
          <div>
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              placeholder="Describe the product — fabric, embroidery style, occasion..."
              className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] resize-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Fabric Details</label>
            <input name="fabricDetails" value={form.fabricDetails} onChange={handleChange}
              placeholder="e.g. Premium Cotton Satin with Resham Embroidery"
              className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Dimensions / Fabric Length</label>
            <input name="dimensions" value={form.dimensions} onChange={handleChange}
              placeholder="e.g. Kurta 2.5m + Bottom 2m + Dupatta 2.25m"
              className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] transition-colors" />
          </div>
        </div>

        {/* Accordions */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-[#1A1918]">Product Accordion Details</h2>
          {[
            { name: "fabricCare", label: "Fabric Care Instructions" },
            { name: "stitchingDetails", label: "Stitching Details" },
            { name: "shippingReturns", label: "Shipping & Returns" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">{label}</label>
              <textarea name={name} value={form[name as keyof typeof form] as string} onChange={handleChange} rows={2}
                className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] resize-none transition-colors" />
            </div>
          ))}
        </div>

        {/* Flags */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm">
          <h2 className="font-semibold text-[#1A1918] mb-4">Product Flags</h2>
          <div className="flex flex-wrap gap-6">
            {[
              { name: "isNewArrival", label: "New Arrival" },
              { name: "isBestSeller", label: "Best Seller" },
              { name: "isFeatured", label: "Featured" },
              { name: "isActive", label: "Active (visible on site)" },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name={name} checked={form[name as keyof typeof form] as boolean} onChange={handleChange}
                  className="w-4 h-4 accent-[#C47D5A]" />
                <span className="text-sm text-[#1A1918]">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={isSubmitting}
            className="px-8 py-3 bg-[#C47D5A] text-white text-sm font-semibold rounded-lg hover:bg-[#A86947] transition-colors disabled:opacity-60 flex items-center gap-2">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Product"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-3 bg-white border border-[#EAE5DE] text-[#1A1918] text-sm font-medium rounded-lg hover:bg-[#F5F3F0] transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
