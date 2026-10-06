"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X, Loader2, Plus, Minus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { adminApi, ApiProduct } from "@/lib/api";

const CATEGORIES_BY_SECTION: Record<"women" | "men", Array<{ value: string; label: string }>> = {
  women: [
    { value: "unstitched", label: "Unstitched" },
    { value: "stitched", label: "Stitched" },
    { value: "kids", label: "Kids" },
    { value: "embroidered-satin", label: "Embroidered Satin" },
    { value: "luxury-cotton-satin", label: "Luxury Cotton Satin" },
    { value: "satin-lucknowi", label: "Satin Lucknowi" },
  ],
  men: [
    { value: "kurta-sets", label: "Kurta Sets" },
  ],
};

const DEFAULT_SUBCATEGORIES: Record<"women" | "men", string[]> = {
  women: [
    "Embroidered Satin with Dupatta",
    "Luxury Cotton Satin",
    "Satin Lucknowi Collection",
    "Rose Royale Collection",
    "PURE COTTON SUITS",
  ],
  men: [
    "Kurta Sets",
    "Premium Cotton Plain",
    "Premium cotton self designed",
  ],
};

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [section, setSection] = useState<"women" | "men">("women");
  const [subcategories, setSubcategories] = useState<Array<{ id?: string; name: string }>>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [subcategoryError, setSubcategoryError] = useState("");
  const [subcategorySuccess, setSubcategorySuccess] = useState("");
  const [isSavingSubcategory, setIsSavingSubcategory] = useState(false);

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
  const [unstitchedQuantity, setUnstitchedQuantity] = useState<number>(1);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [colorVariants, setColorVariants] = useState<{ name: string; hexCode: string; isSoldOut: boolean }[]>([
    { name: "", hexCode: "#C47D5A", isSoldOut: false },
  ]);
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

      const prodSection = (product.section === "men" ? "men" : "women") as "women" | "men";
      setSection(prodSection);
      setSelectedSubcategoryId(product.subcategory_id || null);

      const sub = product.subcategory || "";

      // Load subcategories for this section
      try {
        const subRes = await adminApi.getSubcategories(prodSection);
        let list: Array<{ id?: string; name: string }> = (subRes?.subcategories || []).map((s) => ({ id: s.id, name: s.name }));
        if (list.length === 0) {
          list = DEFAULT_SUBCATEGORIES[prodSection].map((name) => ({ name }));
        }
        if (sub && !list.some((s) => s.name.toLowerCase() === sub.toLowerCase())) {
          list.push({ id: product.subcategory_id || undefined, name: sub });
        }
        setSubcategories(list);
      } catch {
        const list: Array<{ id?: string; name: string }> = DEFAULT_SUBCATEGORIES[prodSection].map((name) => ({ name }));
        if (sub && !list.some((s) => s.name.toLowerCase() === sub.toLowerCase())) {
          list.push({ id: product.subcategory_id || undefined, name: sub });
        }
        setSubcategories(list);
      }

      setForm({
        name: product.name || "",
        category: product.category || (prodSection === "men" ? "kurta-sets" : "unstitched"),
        subcategory: sub,
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

      // Populate stock quantities from size_stock_map
      const sm = (product.size_stock_map || {}) as Record<string, boolean | number>;
      if (product.category === "unstitched" || prodSection === "men") {
        const q = typeof sm.total === "number" ? sm.total : (product.is_sold_out ? 0 : 1);
        setUnstitchedQuantity(q);
      }
      const counts: Record<string, number> = {};
      const productSizes = Array.isArray(product.sizes) ? product.sizes : [];
      productSizes.forEach((s: string) => {
        const val = sm[s];
        if (typeof val === "number") {
          counts[s] = val;
        } else if (val === false) {
          counts[s] = 0;
        } else {
          counts[s] = product.is_sold_out ? 0 : 1;
        }
      });
      setSizeQuantities(counts);

      if (product.color_variants && Array.isArray(product.color_variants) && product.color_variants.length > 0) {
        setColorVariants(
          product.color_variants.map((c) => ({
            name: c.name,
            hexCode: c.hexCode,
            isSoldOut: Boolean(c.isSoldOut),
          }))
        );
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

  const handleSectionChange = async (newSection: "women" | "men") => {
    setSection(newSection);
    const defaultCat = newSection === "men" ? "kurta-sets" : "unstitched";
    setForm((prev) => ({
      ...prev,
      category: defaultCat,
    }));
    setIsCreatingSubcategory(false);
    setNewSubcategoryName("");
    setSubcategoryError("");
    try {
      const res = await adminApi.getSubcategories(newSection);
      const list: Array<{ id?: string; name: string }> = (res?.subcategories || []).map((s) => ({ id: s.id, name: s.name }));
      const finalSubList: Array<{ id?: string; name: string }> = list.length > 0 ? list : DEFAULT_SUBCATEGORIES[newSection].map((name) => ({ name }));
      setSubcategories(finalSubList);
      setForm((prev) => ({ ...prev, subcategory: finalSubList[0].name }));
      setSelectedSubcategoryId(finalSubList[0].id || null);
    } catch {
      const finalSubList: Array<{ id?: string; name: string }> = DEFAULT_SUBCATEGORIES[newSection].map((name) => ({ name }));
      setSubcategories(finalSubList);
      setForm((prev) => ({ ...prev, subcategory: finalSubList[0].name }));
      setSelectedSubcategoryId(null);
    }
  };

  const handleCreateSubcategory = async () => {
    const trimmed = newSubcategoryName.trim();
    if (!trimmed) {
      setSubcategoryError("Subcategory name cannot be empty");
      return;
    }
    if (trimmed.length > 50) {
      setSubcategoryError("Name must be 50 characters or less");
      return;
    }
    const duplicate = subcategories.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      setSubcategoryError(`"${trimmed}" already exists in ${section === "men" ? "Men" : "Women"}`);
      return;
    }

    setIsSavingSubcategory(true);
    setSubcategoryError("");
    try {
      const res = await adminApi.createSubcategory({ section, name: trimmed });
      const created = res.subcategory || { name: trimmed };
      setSubcategories((prev) => [...prev, { id: created.id, name: created.name }]);
      setForm((prev) => ({ ...prev, subcategory: created.name }));
      setSelectedSubcategoryId(created.id || null);
      setNewSubcategoryName("");
      setIsCreatingSubcategory(false);
      setSubcategorySuccess(`Created subcategory "${created.name}"`);
      setTimeout(() => setSubcategorySuccess(""), 4000);
    } catch {
      setSubcategories((prev) => [...prev, { name: trimmed }]);
      setForm((prev) => ({ ...prev, subcategory: trimmed }));
      setSelectedSubcategoryId(null);
      setNewSubcategoryName("");
      setIsCreatingSubcategory(false);
      setSubcategorySuccess(`Added "${trimmed}"`);
      setTimeout(() => setSubcategorySuccess(""), 4000);
    } finally {
      setIsSavingSubcategory(false);
    }
  };

  const handleSubcategorySelect = (subName: string) => {
    if (subName === "__custom__") {
      setIsCreatingSubcategory(true);
      return;
    }
    const matched = subcategories.find((s) => s.name === subName);
    setForm((prev) => ({ ...prev, subcategory: subName }));
    setSelectedSubcategoryId(matched?.id || null);
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
      const isUnstitched = form.category === "unstitched" || section === "men";
      const finalSizes = isUnstitched ? [] : selectedSizes;
      const sizeStockMap: Record<string, number> = {};
      let totalStock = 0;

      if (isUnstitched) {
        const qty = Math.max(0, Number(unstitchedQuantity) || 0);
        sizeStockMap["total"] = qty;
        totalStock = qty;
      } else {
        finalSizes.forEach((s) => {
          const qty = Math.max(0, Number(sizeQuantities[s] ?? 1));
          sizeStockMap[s] = qty;
          totalStock += qty;
        });
        sizeStockMap["total"] = totalStock;
      }

      const validColors = colorVariants.filter((c) => c.name.trim());
      const allColorsSoldOut = validColors.length > 0 && validColors.every((c) => c.isSoldOut);
      const calculatedSoldOut = allColorsSoldOut || totalStock <= 0;

      let updatedImages = [...existingImages];

      // Step 1: Upload new images if any
      if (newImageFiles.length > 0) {
        const { urls } = (await adminApi.uploadImages(id, newImageFiles)) as { urls: string[] };
        if (urls && urls.length > 0) {
          updatedImages = [...updatedImages, ...urls];
        }
      }

      // Step 2: Update product record
      if (!form.subcategory.trim()) {
        setError("Please select or add a subcategory");
        setIsSubmitting(false);
        return;
      }

      await adminApi.updateProduct(id, {
        name: form.name,
        category: form.category,
        subcategory: form.subcategory.trim(),
        section: section,
        subcategoryId: selectedSubcategoryId || undefined,
        regularPrice: Number(form.regularPrice) || Number(form.discountedPrice),
        discountedPrice: Number(form.discountedPrice),
        sizes: finalSizes,
        sizeStockMap,
        colorVariants: validColors.map((c, i) => ({
          name: c.name,
          hexCode: c.hexCode,
          imageSrc: updatedImages[i] || updatedImages[0] || "",
          isSoldOut: Boolean(c.isSoldOut),
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
        isSoldOut: calculatedSoldOut,
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

          {/* Section Selector */}
          <div>
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">
              Section *
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <button
                type="button"
                onClick={() => handleSectionChange("women")}
                className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all text-center cursor-pointer ${
                  section === "women"
                    ? "bg-[#1A1918] text-white border-[#1A1918] shadow-sm"
                    : "bg-white text-[#75706B] border-[#EAE5DE] hover:border-[#1A1918]"
                }`}
              >
                Women Collection
              </button>
              <button
                type="button"
                onClick={() => handleSectionChange("men")}
                className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all text-center cursor-pointer ${
                  section === "men"
                    ? "bg-[#1A1918] text-white border-[#1A1918] shadow-sm"
                    : "bg-white text-[#75706B] border-[#EAE5DE] hover:border-[#1A1918]"
                }`}
              >
                Men Collection
              </button>
            </div>
          </div>

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
                {CATEGORIES_BY_SECTION[section].map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#75706B] uppercase tracking-wider">
                  Subcategory *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingSubcategory((prev) => !prev);
                    setSubcategoryError("");
                  }}
                  className="text-xs text-[#C47D5A] hover:underline font-medium cursor-pointer"
                >
                  {isCreatingSubcategory ? "Choose from list" : "+ Add new"}
                </button>
              </div>
              {isCreatingSubcategory ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New subcategory name..."
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      maxLength={50}
                      className="flex-1 px-3 py-2 border border-[#C47D5A] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#C47D5A] bg-[#FFFDFC]"
                    />
                    <button
                      type="button"
                      onClick={handleCreateSubcategory}
                      disabled={isSavingSubcategory || !newSubcategoryName.trim()}
                      className="px-3 py-2 bg-[#C47D5A] hover:bg-[#A86947] text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1 shrink-0"
                    >
                      {isSavingSubcategory ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingSubcategory(false);
                        setSubcategoryError("");
                      }}
                      className="px-2.5 py-2 border border-[#EAE5DE] text-[#75706B] rounded-lg text-xs hover:bg-[#F5F3F0]"
                    >
                      Cancel
                    </button>
                  </div>
                  {subcategoryError && (
                    <p className="text-[11px] text-red-600 font-medium">{subcategoryError}</p>
                  )}
                </div>
              ) : (
                <select
                  name="subcategory"
                  value={form.subcategory}
                  onChange={(e) => handleSubcategorySelect(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
                >
                  {subcategories.map((sub) => (
                    <option key={sub.id || sub.name} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                  <option value="__custom__">+ Add new sub-category...</option>
                </select>
              )}
              {subcategorySuccess && (
                <p className="text-[11px] text-green-600 font-medium mt-1">{subcategorySuccess}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">SKU</label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder={section === "men" ? "e.g. AKIK-MEN-001" : "e.g. AKIK-ESD-EMB-1"}
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
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="rounded text-[#C47D5A] focus:ring-[#C47D5A]"
              />
              Product Active (Visible in Store)
            </label>
          </div>
        </div>

        {/* Stock & Sizes */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-[#1A1918]">Inventory & Sizes</h2>
          {form.category === "unstitched" || section === "men" ? (
            <div className="space-y-3">
              <p className="text-xs text-[#75706B] bg-[#FAF9F6] p-3 rounded-lg border border-[#EAE5DE]">
                {section === "men"
                  ? "Men's unstitched kurta set does not require size variants. Standard full unstitched fabric cut."
                  : "Unstitched category does not require size variants. Standard full fabric cut."}
              </p>
              <div>
                <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">
                  Available Stock Quantity *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    value={unstitchedQuantity}
                    onChange={(e) => setUnstitchedQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-32 px-3 py-2 border border-[#EAE5DE] rounded-lg text-sm font-semibold focus:outline-none focus:border-[#C47D5A] bg-[#FAF9F6] transition-colors"
                    required
                  />
                  <span className="text-xs text-[#75706B]">Pieces available</span>
                </div>
                <p className="text-xs text-[#A8A49F] mt-1.5">
                  Quantity is hidden from customers. If stock is 1, website displays &ldquo;Only 1 quantity&rdquo;. If 0, marked Sold Out.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#75706B] mb-2 uppercase tracking-wider">
                  Select Available Sizes
                </label>
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
              </div>

              {selectedSizes.length > 0 && (
                <div className="pt-3 border-t border-[#EAE5DE] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-[#75706B] uppercase tracking-wider">
                      Stock Quantity per Size
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#A8A49F]">Quick set:</span>
                      {[1, 2, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            const updated: Record<string, number> = {};
                            selectedSizes.forEach((s) => { updated[s] = preset; });
                            setSizeQuantities((prev) => ({ ...prev, ...updated }));
                          }}
                          className="px-2 py-0.5 text-[10px] font-medium bg-[#F5F3F0] hover:bg-[#EAE5DE] text-[#1A1918] rounded transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {selectedSizes.map((size) => (
                      <div
                        key={size}
                        className="flex items-center justify-between p-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg"
                      >
                        <span className="text-xs font-semibold text-[#1A1918]">Size {size}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={sizeQuantities[size] ?? 1}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setSizeQuantities((prev) => ({ ...prev, [size]: val }));
                            }}
                            className="w-16 px-2 py-1 text-center text-xs font-semibold border border-[#EAE5DE] rounded bg-white focus:outline-none focus:border-[#C47D5A]"
                          />
                          <span className="text-[10px] text-[#75706B]">pcs</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-[#A8A49F]">
                    Hidden from customers. If a size has 1 left, store displays &ldquo;Only 1 quantity&rdquo;.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Color Variants */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#1A1918]">Color Variants</h2>
            <button
              type="button"
              onClick={() => setColorVariants((prev) => [...prev, { name: "", hexCode: "#C47D5A", isSoldOut: false }])}
              className="text-xs text-[#C47D5A] hover:text-[#A86947] font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Color
            </button>
          </div>
          <div className="space-y-2.5">
            {colorVariants.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-[#EAE5DE] bg-[#FAF9F6]">
                <input
                  type="color"
                  value={c.hexCode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setColorVariants((prev) => prev.map((item, idx) => (idx === i ? { ...item, hexCode: val } : item)));
                  }}
                  className="w-9 h-9 rounded border border-[#EAE5DE] cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setColorVariants((prev) => prev.map((item, idx) => (idx === i ? { ...item, name: val } : item)));
                  }}
                  placeholder="Color name (e.g. Noir, Turquoise)"
                  className="flex-1 px-3 py-2 bg-white border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
                />
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium bg-white px-2.5 py-2 rounded-lg border border-[#EAE5DE] shrink-0">
                  <input
                    type="checkbox"
                    checked={c.isSoldOut}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setColorVariants((prev) =>
                        prev.map((item, idx) => (idx === i ? { ...item, isSoldOut: checked } : item))
                      );
                    }}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span className={c.isSoldOut ? "text-red-600 font-semibold" : "text-[#75706B]"}>
                    Sold Out
                  </span>
                </label>
                {colorVariants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setColorVariants((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
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
