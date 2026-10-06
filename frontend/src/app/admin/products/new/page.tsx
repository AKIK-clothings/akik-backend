"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, Plus, Minus } from "lucide-react";
import { adminApi } from "@/lib/api";

const CATEGORIES_BY_SECTION: Record<"women" | "men", Array<{ value: string; label: string }>> = {
  women: [
    { value: "unstitched", label: "Unstitched" },
    { value: "stitched", label: "Stitched" },
    { value: "kids", label: "Kids" },
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

export default function AdminNewProductPage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    category: "unstitched",
    subcategory: "Embroidered Satin with Dupatta",
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
    fabricCare: "Dry clean or gentle cold hand wash.",
    stitchingDetails: "Comes with 2.5-inch inner margins for tailoring.",
    shippingReturns: "Dispatched within 24-48 hours. 7-day exchanges across India.",
  });

  const [selectedSizes, setSelectedSizes] = useState<string[]>(["S", "M", "L", "XL", "XXL", "XXXL"]);
  const [unstitchedQuantity, setUnstitchedQuantity] = useState<number>(1);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({
    S: 1, M: 1, L: 1, XL: 1, XXL: 1, XXXL: 1, "Free Size": 1,
  });
  const [colorVariants, setColorVariants] = useState<{ name: string; hexCode: string; isSoldOut: boolean }[]>([
    { name: "", hexCode: "#C47D5A", isSoldOut: false },
  ]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load subcategories whenever section changes
  React.useEffect(() => {
    let mounted = true;
    const loadSubcategories = async () => {
      try {
        const res = await adminApi.getSubcategories(section);
        if (!mounted) return;
        if (res && res.subcategories && res.subcategories.length > 0) {
          const list = res.subcategories.map((s) => ({ id: s.id, name: s.name }));
          setSubcategories(list);
          setForm((prev) => ({ ...prev, subcategory: list[0].name }));
          setSelectedSubcategoryId(list[0].id || null);
        } else {
          const defaults = DEFAULT_SUBCATEGORIES[section].map((name) => ({ name }));
          setSubcategories(defaults);
          setForm((prev) => ({ ...prev, subcategory: defaults[0].name }));
          setSelectedSubcategoryId(null);
        }
      } catch {
        if (!mounted) return;
        const defaults = DEFAULT_SUBCATEGORIES[section].map((name) => ({ name }));
        setSubcategories(defaults);
        setForm((prev) => ({ ...prev, subcategory: defaults[0].name }));
        setSelectedSubcategoryId(null);
      }
    };
    loadSubcategories();
    return () => {
      mounted = false;
    };
  }, [section]);

  const handleSectionChange = (newSection: "women" | "men") => {
    setSection(newSection);
    const defaultCat = newSection === "men" ? "kurta-sets" : "unstitched";
    const defaultCare =
      newSection === "men"
        ? "Gentle hand wash with mild detergent or dry clean."
        : "Dry clean or gentle cold hand wash.";
    const defaultStitching =
      newSection === "men"
        ? "Unstitched kurta set fabric ready for custom tailoring."
        : "Comes with 2.5-inch inner margins for tailoring.";
    const defaultSub = DEFAULT_SUBCATEGORIES[newSection][0];
    setForm((prev) => ({
      ...prev,
      category: defaultCat,
      subcategory: defaultSub,
      fabricCare: defaultCare,
      stitchingDetails: defaultStitching,
    }));
    setSelectedSubcategoryId(null);
    setIsCreatingSubcategory(false);
    setNewSubcategoryName("");
    setSubcategoryError("");
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
      // Offline / migration not run fallback
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
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
      const isSoldOut = allColorsSoldOut || totalStock <= 0;

      if (!form.subcategory.trim()) {
        setError("Please select or add a subcategory");
        setIsSubmitting(false);
        return;
      }

      const { product } = (await adminApi.createProduct({
        name: form.name,
        category: form.category,
        subcategory: form.subcategory.trim(),
        section: section,
        subcategoryId: selectedSubcategoryId || undefined,
        regularPrice: Number(form.regularPrice) || Number(form.discountedPrice),
        discountedPrice: Number(form.discountedPrice),
        isSoldOut,
        sizes: finalSizes,
        sizeStockMap,
        colorVariants: validColors.map((c) => ({
          name: c.name.trim(),
          hexCode: c.hexCode,
          isSoldOut: Boolean(c.isSoldOut),
        })),
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
      })) as { product: { id: string } };

      // Step 2: Upload images if any
      if (imageFiles.length > 0) {
        const { urls } = (await adminApi.uploadImages(product.id, imageFiles)) as { urls: string[] };

        // Update product with first image as primary, retaining section
        await adminApi.updateProduct(product.id, {
          section,
          primaryImage: urls[0] || "",
          secondaryImage: urls[1] || "",
          galleryImages: urls,
          colorVariants: colorVariants
            .filter((c) => c.name)
            .map((c, i) => ({
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
            <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Product Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              placeholder={section === "men" ? "e.g. Pure Cotton Self Designed Kurta Set" : "e.g. Blue Lavish on Black Satin Embroidered Suit"}
              className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Category *</label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] bg-white transition-colors">
                {CATEGORIES_BY_SECTION[section].map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#75706B] uppercase tracking-wider">Subcategory *</label>
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
                  className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] bg-white transition-colors"
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
              placeholder={section === "men" ? "AKIK-MEN-001" : "AKIK-ESD-001"}
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
          <p className="text-xs text-[#A8A49F]">First image will be the primary display image. Up to 25 images, 10MB each.</p>
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
                    className="w-32 px-3 py-2 border border-[#EAE5DE] rounded-lg text-sm font-semibold focus:outline-none focus:border-[#C47D5A] bg-white transition-colors"
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedSizes.includes(size)
                          ? "bg-[#1A1918] text-white border-[#1A1918]"
                          : "bg-white text-[#75706B] border-[#EAE5DE] hover:border-[#1A1918]"
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
            <div>
              <h2 className="font-semibold text-[#1A1918]">Color Variants</h2>
              <p className="text-xs text-[#75706B]">Set shade name and mark out-of-stock per color</p>
            </div>
            <button
              type="button"
              onClick={() => setColorVariants((prev) => [...prev, { name: "", hexCode: "#C47D5A", isSoldOut: false }])}
              className="flex items-center gap-1.5 text-xs text-[#C47D5A] hover:text-[#A86947] font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Color
            </button>
          </div>
          <div className="space-y-2.5">
            {colorVariants.map((color, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-[#EAE5DE] bg-[#FAF9F6]">
                <input
                  type="color"
                  value={color.hexCode}
                  onChange={(e) =>
                    setColorVariants((prev) =>
                      prev.map((c, idx) => (idx === i ? { ...c, hexCode: e.target.value } : c))
                    )
                  }
                  className="w-9 h-9 rounded border border-[#EAE5DE] cursor-pointer shrink-0"
                />
                <input
                  value={color.name}
                  placeholder="Color name (e.g. Midnight Black)"
                  onChange={(e) =>
                    setColorVariants((prev) =>
                      prev.map((c, idx) => (idx === i ? { ...c, name: e.target.value } : c))
                    )
                  }
                  className="flex-1 px-3 py-2 bg-white border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]"
                />
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium bg-white px-2.5 py-2 rounded-lg border border-[#EAE5DE] shrink-0">
                  <input
                    type="checkbox"
                    checked={color.isSoldOut}
                    onChange={(e) =>
                      setColorVariants((prev) =>
                        prev.map((c, idx) => (idx === i ? { ...c, isSoldOut: e.target.checked } : c))
                      )
                    }
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span className={color.isSoldOut ? "text-red-600 font-semibold" : "text-[#75706B]"}>
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
