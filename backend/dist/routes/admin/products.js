"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../../config/supabase");
const auth_1 = require("../../middleware/auth");
const upload_1 = require("../../middleware/upload");
const slugify_1 = require("../../utils/slugify");
const sharp_1 = __importDefault(require("sharp"));
const client_s3_1 = require("@aws-sdk/client-s3");
const r2_1 = require("../../config/r2");
const validate_1 = require("../../middleware/validate");
const products_1 = require("../products");
const router = (0, express_1.Router)();
// All routes in this file require admin authentication
router.use(auth_1.requireAdmin);
// ─── GET /api/admin/products ─────────────────────────────────────────────────
// List ALL products (including inactive) for admin management with optional section filter
router.get("/", async (req, res) => {
    try {
        const { section } = req.query;
        let query = supabase_1.supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });
        if (section && typeof section === "string" && section.toLowerCase() !== "all") {
            query = query.eq("section", section.toLowerCase().trim());
        }
        const { data: products, error } = await query;
        if (error)
            throw error;
        res.json({ products: products || [], total: products?.length || 0 });
    }
    catch (err) {
        console.error("Admin GET /products error:", err);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});
// ─── POST /api/admin/products ────────────────────────────────────────────────
// Create a new product (without images — images uploaded separately)
router.post("/", (0, validate_1.validateBody)(validate_1.adminProductCreateSchema), async (req, res) => {
    const body = req.body;
    const slug = body.slug || (0, slugify_1.slugify)(body.name);
    try {
        // Check slug uniqueness
        const { data: existingSlug } = await supabase_1.supabase
            .from("products")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();
        if (existingSlug) {
            res.status(400).json({ error: `A product with slug "${slug}" already exists` });
            return;
        }
        // Check SKU uniqueness
        if (body.sku && typeof body.sku === "string" && body.sku.trim()) {
            const cleanSku = body.sku.trim();
            const { data: existingSku } = await supabase_1.supabase
                .from("products")
                .select("id")
                .eq("sku", cleanSku)
                .maybeSingle();
            if (existingSku) {
                res.status(400).json({ error: `A product with SKU "${cleanSku}" already exists. Please use a unique SKU.` });
                return;
            }
        }
        const cvList = Array.isArray(body.colorVariants) ? body.colorVariants : [];
        const allColorsSoldOut = cvList.length > 0 && cvList.every((cv) => cv.isSoldOut === true);
        const isSoldOut = body.isSoldOut !== undefined ? (body.isSoldOut || allColorsSoldOut) : allColorsSoldOut;
        const { data: product, error } = await supabase_1.supabase
            .from("products")
            .insert({
            slug,
            name: body.name,
            category: body.category,
            subcategory: body.subcategory,
            section: body.section || "women",
            subcategory_id: body.subcategoryId || null,
            regular_price: body.regularPrice || body.discountedPrice,
            discounted_price: body.discountedPrice,
            is_sold_out: isSoldOut,
            sizes: body.sizes || [],
            size_stock_map: body.sizeStockMap || {},
            color_variants: body.colorVariants || [],
            primary_image: body.primaryImage || "",
            secondary_image: body.secondaryImage || "",
            gallery_images: body.galleryImages || [],
            sku: body.sku ? body.sku.trim() : `AKIK-${Date.now()}`,
            rating: body.rating || 5.0,
            review_count: body.reviewCount || 0,
            description: body.description || "",
            fabric_details: body.fabricDetails || "",
            dimensions: body.dimensions,
            is_new_arrival: body.isNewArrival || false,
            is_best_seller: body.isBestSeller || false,
            is_featured: body.isFeatured || false,
            accordions: body.accordions || {},
            is_active: body.isActive !== undefined ? body.isActive : true,
        })
            .select()
            .single();
        if (error)
            throw error;
        (0, products_1.invalidateFeaturedCache)();
        res.status(201).json({ product });
    }
    catch (err) {
        console.error("Admin POST /products error:", err);
        const isSkuConflict = err?.message?.includes("products_sku_key") || err?.code === "23505";
        const errorMsg = isSkuConflict
            ? `A product with SKU "${body.sku}" already exists. Please use a unique SKU.`
            : err?.message || "Failed to create product";
        res.status(400).json({ error: errorMsg });
    }
});
// ─── GET /api/admin/products/:id ─────────────────────────────────────────────
// Get single product for editing
router.get("/:id", (0, validate_1.validateUuidParam)("id"), async (req, res) => {
    try {
        const { id } = req.params;
        const { data: product, error } = await supabase_1.supabase
            .from("products")
            .select("*")
            .eq("id", id)
            .single();
        if (error || !product) {
            res.status(404).json({ error: "Product not found" });
            return;
        }
        res.json({ product });
    }
    catch (err) {
        console.error("Admin GET /products/:id error:", err);
        res.status(500).json({ error: "Failed to fetch product" });
    }
});
// ─── PUT /api/admin/products/:id ─────────────────────────────────────────────
// Update a product's details
router.put("/:id", (0, validate_1.validateUuidParam)("id"), (0, validate_1.validateBody)(validate_1.adminProductUpdateSchema), async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    try {
        if (body.sku && typeof body.sku === "string" && body.sku.trim()) {
            const cleanSku = body.sku.trim();
            const { data: existingSku } = await supabase_1.supabase
                .from("products")
                .select("id")
                .eq("sku", cleanSku)
                .neq("id", id)
                .maybeSingle();
            if (existingSku) {
                res.status(400).json({ error: `Another product with SKU "${cleanSku}" already exists. Please use a unique SKU.` });
                return;
            }
        }
        const updateData = { updated_at: new Date().toISOString() };
        // Only update fields that were sent
        const fieldMap = {
            name: "name",
            slug: "slug",
            category: "category",
            subcategory: "subcategory",
            regularPrice: "regular_price",
            discountedPrice: "discounted_price",
            isSoldOut: "is_sold_out",
            sizes: "sizes",
            sizeStockMap: "size_stock_map",
            colorVariants: "color_variants",
            primaryImage: "primary_image",
            secondaryImage: "secondary_image",
            galleryImages: "gallery_images",
            sku: "sku",
            rating: "rating",
            reviewCount: "review_count",
            description: "description",
            fabricDetails: "fabric_details",
            dimensions: "dimensions",
            isNewArrival: "is_new_arrival",
            isBestSeller: "is_best_seller",
            isFeatured: "is_featured",
            accordions: "accordions",
            isActive: "is_active",
            section: "section",
            subcategoryId: "subcategory_id",
        };
        for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
            if (body[jsKey] !== undefined) {
                updateData[dbCol] = body[jsKey];
            }
        }
        if (Array.isArray(body.colorVariants) && body.colorVariants.length > 0) {
            const allColorsSold = body.colorVariants.every((cv) => cv.isSoldOut === true);
            if (body.isSoldOut === undefined) {
                updateData["is_sold_out"] = allColorsSold;
            }
        }
        const { data: product, error } = await supabase_1.supabase
            .from("products")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();
        if (error)
            throw error;
        (0, products_1.invalidateFeaturedCache)();
        res.json({ product });
    }
    catch (err) {
        console.error("Admin PUT /products/:id error:", err);
        const isSkuConflict = err?.message?.includes("products_sku_key") || err?.code === "23505";
        const errorMsg = isSkuConflict
            ? `A product with SKU "${body.sku}" already exists. Please use a unique SKU.`
            : err?.message || "Failed to update product";
        res.status(400).json({ error: errorMsg });
    }
});
// ─── DELETE /api/admin/products/:id ──────────────────────────────────────────
// Delete a product permanently
router.delete("/:id", (0, validate_1.validateUuidParam)("id"), async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase_1.supabase.from("products").delete().eq("id", id);
        if (error)
            throw error;
        (0, products_1.invalidateFeaturedCache)();
        res.json({ success: true, message: "Product deleted successfully" });
    }
    catch (err) {
        console.error("Admin DELETE /products/:id error:", err);
        res.status(500).json({ error: "Failed to delete product" });
    }
});
// ─── PATCH /api/admin/products/:id/stock ─────────────────────────────────────
// Quick stock toggle — mark product as sold out / back in stock
router.patch("/:id/stock", (0, validate_1.validateUuidParam)("id"), async (req, res) => {
    try {
        const { id } = req.params;
        const { isSoldOut, sizeStockMap } = req.body;
        const { data: product, error } = await supabase_1.supabase
            .from("products")
            .update({
            is_sold_out: isSoldOut,
            size_stock_map: sizeStockMap,
            updated_at: new Date().toISOString(),
        })
            .eq("id", id)
            .select()
            .single();
        if (error)
            throw error;
        (0, products_1.invalidateFeaturedCache)();
        res.json({ product });
    }
    catch (err) {
        console.error("Admin PATCH /products/:id/stock error:", err);
        res.status(500).json({ error: "Failed to update stock" });
    }
});
// ─── POST /api/admin/products/:id/images ─────────────────────────────────────
// Upload product images to Supabase Storage
router.post("/:id/images", (0, validate_1.validateUuidParam)("id"), upload_1.upload.array("images", 25), async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ error: "No images provided" });
            return;
        }
        const allowedExts = ["jpg", "jpeg", "png", "webp"];
        const uploadedUrls = [];
        for (const file of files) {
            const fileExt = file.originalname.split(".").pop()?.toLowerCase();
            if (!fileExt || !allowedExts.includes(fileExt)) {
                res.status(400).json({ error: `Invalid image file extension ".${fileExt}". Allowed: ${allowedExts.join(", ")}` });
                return;
            }
            // Compress & resize image to WebP (auto-orient EXIF, max 1000px, quality 75, effort 6)
            const compressedBuffer = await (0, sharp_1.default)(file.buffer)
                .rotate()
                .resize({ width: 1000, withoutEnlargement: true, fit: "inside" })
                .webp({ quality: 75, effort: 6 })
                .toBuffer();
            const key = `products/${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
            // Upload compressed image to Cloudflare R2
            await r2_1.r2Client.send(new client_s3_1.PutObjectCommand({
                Bucket: r2_1.R2_BUCKET,
                Key: key,
                Body: compressedBuffer,
                ContentType: "image/webp",
                CacheControl: "public, max-age=31536000, immutable",
            }));
            uploadedUrls.push((0, r2_1.getR2PublicUrl)(key));
        }
        res.json({
            success: true,
            urls: uploadedUrls,
            message: `${uploadedUrls.length} image(s) uploaded successfully`,
        });
    }
    catch (err) {
        console.error("Admin POST /products/:id/images error:", err);
        res.status(500).json({ error: "Failed to upload images" });
    }
});
exports.default = router;
