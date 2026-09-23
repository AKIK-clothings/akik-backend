"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X, Loader2, Plus, Minus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { adminApi, ApiProduct } from "@/lib/api";

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
];

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "embroidered-satin",
    subcategory: "",
    regularPrice: "",
    discountedPrice: "",
    description: "",
    fabricDetails: "",
    dimensions: "",
    sku: "",
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    isActive: true,
    isSoldOut: false,
    fabricCare: "Dry clean or gentle cold hand wash.",
    stitchingDetails: "Comes with 2.5-inch inner margins for tailoring.",
    shippingReturns: "Dispatched within 24-48 hours. 7-day exchanges across India.",
  });

  const [selectedSizes, setSelectedSizes] = useState<string[]>(["S", "M", "L", "XL", "XXL", "XXXL"]);
  const [colorVariants, setColorVariants] = useState([{ name: "", hexCode: "#C47D5A" }]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setIsLoading(true);
    try {
      const { product } = await adminApi.getProduct(id);
      if (!product) {
        setError("Product not found");
        return;
      }

      setForm({
        name: product.name || "",
        category: product.category || "embroidered-satin",
        subcategory: product.subcategory || "",
        regularPrice: String(product.regular_price || ""),
        discountedPrice: String(product.discounted_price || ""),
        description: product.description || "",
        fabricDetails: product.fabric_details || "",
        dimensions: product.dimensions || "",
        sku: product.sku || "",
        isNewArrival: Boolean(product.is_new_arrival),
        isBestSeller: Boolean(product.is_best_seller),
        isFeatured: Boolean(product.is_featured),
        isActive: Boolean(product.is_active),
        isSoldOut: Boolean(product.is_sold_out),
        fabricCare: product.accordions?.fabricCare || "Dry clean or gentle cold hand wash.",
        stitchingDetails: product.accordions?.stitchingDetails || "Comes with 2.5-inch inner margins for tailoring.",
        shippingReturns: product.accordions?.shippingReturns || "Dispatched within 24-48 hours. 7-day exchanges across India.",
      });

      if (product.sizes && Array.isArray(product.sizes)) {
        setSelectedSizes(product.sizes);
      }

      if (product.color_variants && Array.isArray(product.color_variants) && product.color_variants.length > 0) {
        setColorVariants(product.color_variants.map((c) => ({ name: c.name, hexCode: c.hexCode })));
      }

      const images: string[] = [];
      if (product.primary_image) images.push(product.primary_image);
      if (product.secondary_image && !images.includes(product.secondary_image)) images.push(product.secondary_image);
      if (product.gallery_images && Array.isArray(product.gallery_images)) {
        product.gallery_images.forEach((img) => {
          if (img && !images.includes(img)) images.push(img);
        });
      }
      setExistingImages(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImageFiles((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
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
        finalSizes.forEach((s) => {
          sizeStockMap[s] = true;
        });
      }

      let updatedImages = [...existingImages];

      // Step 1: Upload new images if any
      if (newImageFiles.length > 0) {
        const { urls } = (await adminApi.uploadImages(id, newImageFiles)) as { urls: string[] };
        if (urls && urls.length > 0) {
          updatedImages = [...updatedImages, ...urls];
        }
      }

      // Step 2: Update product record
      await adminApi.updateProduct(id, {
        name: form.name,
        category: form.category,
        subcategory: form.subcategory,
        regularPrice: Number(form.regularPrice) || Number(form.discountedPrice),
        discountedPrice: Number(form.discountedPrice),
        sizes: finalSizes,
        sizeStockMap,
        colorVariants: colorVariants.filter((c) => c.name).map((c, i) => ({
          name: c.name,
          hexCode: c.hexCode,
          imageSrc: updatedImages[i] || updatedImages[0] || "",
        })),
        primaryImage: updatedImages[0] || "",
        secondaryImage: updatedImages[1] || "",
        galleryImages: updatedImages,
        sku: form.sku,
        description: form.description,
        fabricDetails: form.fabricDetails,
        dimensions: form.dimensions,
        isNewArrival: form.isNewArrival,
        isBestSeller: form.isBestSeller,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        isSoldOut: form.isSoldOut,
        accordions: {
          fabricCare: form.fabricCare,
          stitchingDetails: form.stitchingDetails,
          shippingReturns: form.shippingReturns,
        },
      });

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#C47D5A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="p-2 rounded-lg text-[#75706B] hover:bg-[#F5F3F0] hover:text-[#1A1918] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1918]">Edit Product</h1>
          <p className="text-sm text-[#75706B] mt-0.5">Update product details below</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-[#1A1918]">Basic Information</h2>
          <div>
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">
              Product Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">
                Subcategory *
              </label>
              <select
                name="subcategory"
                value={form.subcategory}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
              >
                {SUBCATEGORIES.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">SKU</label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="e.g. AKIK-ESD-EMB-1"
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-[#1A1918]">Pricing & Stock</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">
                Selling Price (₹) *
              </label>
              <input
                name="discountedPrice"
                type="number"
                value={form.discountedPrice}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">
                Regular / MRP (₹)
              </label>
              <input
                name="regularPrice"
                type="number"
                value={form.regularPrice}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#1A1918]">
              <input
                type="checkbox"
                name="isSoldOut"
                checked={form.isSoldOut}
                onChange={handleChange}
                className="rounded text-[#C47D5A] focus:ring-[#C47D5A]"
              />
              Mark as Sold Out
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#1A1918]">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="rounded text-[#C47D5A] focus:ring-[#C47D5A]"
              />
              Product Active (Visible in Store)
            </label>
          </div>
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
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                    selectedSizes.includes(size)
                      ? "bg-[#C47D5A] border-[#C47D5A] text-white shadow-sm"
                      : "bg-[#FAF9F6] border-[#EAE5DE] text-[#75706B] hover:border-[#C47D5A]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Variants */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#1A1918]">Color Variants</h2>
            <button
              type="button"
              onClick={() => setColorVariants((prev) => [...prev, { name: "", hexCode: "#C47D5A" }])}
              className="text-xs text-[#C47D5A] hover:text-[#A86947] font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Color
            </button>
          </div>
          <div className="space-y-2">
            {colorVariants.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="color"
                  value={c.hexCode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setColorVariants((prev) => prev.map((item, idx) => (idx === i ? { ...item, hexCode: val } : item)));
                  }}
                  className="w-10 h-10 rounded border border-[#EAE5DE] cursor-pointer p-0.5 bg-white shrink-0"
                />
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setColorVariants((prev) => prev.map((item, idx) => (idx === i ? { ...item, name: val } : item)));
                  }}
                  placeholder="Color name (e.g. Noir, Turquoise)"
                  className="flex-1 px-3 py-2 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
                />
                {colorVariants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setColorVariants((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-2 text-[#75706B] hover:text-red-600 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-[#1A1918]">Product Images</h2>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div>
              <p className="text-xs text-[#75706B] mb-2 font-medium">Current Images:</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {existingImages.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[#EAE5DE] bg-[#FAF9F6] group"
                  >
                    <Image src={src} alt="Product" fill className="object-cover" sizes="100px" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-0 inset-x-0 text-[10px] bg-[#C47D5A] text-white text-center py-0.5">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New images */}
          {newImagePreviews.length > 0 && (
            <div>
              <p className="text-xs text-[#75706B] mb-2 font-medium">New Images to Upload:</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {newImagePreviews.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-[#C47D5A] bg-[#FAF9F6] group"
                  >
                    <Image src={src} alt="New upload" fill className="object-cover" sizes="100px" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 text-[9px] bg-green-600 text-white text-center py-0.5">
                      New
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full border-2 border-dashed border-[#EAE5DE] hover:border-[#C47D5A] rounded-xl p-6 text-center transition-colors cursor-pointer"
          >
            <Upload className="w-6 h-6 text-[#75706B] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#1A1918]">Click to upload additional images</p>
            <p className="text-xs text-[#75706B] mt-0.5">PNG, JPG, WEBP up to 10MB each</p>
          </button>
        </div>

        {/* Details & Copy */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-[#1A1918]">Description & Fabric</h2>
          <div>
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">
              Product Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">
              Fabric Details
            </label>
            <input
              name="fabricDetails"
              value={form.fabricDetails}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">
              Dimensions / Fabric Cuts
            </label>
            <input
              name="dimensions"
              value={form.dimensions}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
            />
          </div>
        </div>

        {/* Flags */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm">
          <h2 className="font-semibold text-[#1A1918] mb-3">Badges & Promotion</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                name="isNewArrival"
                checked={form.isNewArrival}
                onChange={handleChange}
                className="rounded text-[#C47D5A] focus:ring-[#C47D5A]"
              />
              New Arrival
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                name="isBestSeller"
                checked={form.isBestSeller}
                onChange={handleChange}
                className="rounded text-[#C47D5A] focus:ring-[#C47D5A]"
              />
              Bestseller
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
                className="rounded text-[#C47D5A] focus:ring-[#C47D5A]"
              />
              Featured
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/products"
            className="px-6 py-3 rounded-lg border border-[#EAE5DE] text-[#75706B] hover:text-[#1A1918] hover:bg-[#FAF9F6] text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-[#C47D5A] hover:bg-[#A86947] text-white text-sm font-semibold rounded-lg shadow transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
