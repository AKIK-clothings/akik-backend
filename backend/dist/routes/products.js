"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateFeaturedCache = void 0;
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const router = (0, express_1.Router)();
let cachedFeatured = null;
let cachedAllActiveProducts = null;
const productSlugCache = new Map();
const CATALOG_TTL_MS = 2 * 60 * 1000; // 2m in-memory server cache
const invalidateFeaturedCache = () => {
    cachedFeatured = null;
    cachedAllActiveProducts = null;
    productSlugCache.clear();
};
exports.invalidateFeaturedCache = invalidateFeaturedCache;
// GET /api/products — List active products with filtering & sorting
router.get("/", async (req, res) => {
    try {
        const { category, sub, sort = "featured", q, size, color, inStock, minPrice, maxPrice, limit = "100", section, } = req.query;
        let products = null;
        // Fast path: serve base active products from memory cache when no DB-specific text search is used
        const canUseBaseCache = !q &&
            sort === "featured" &&
            cachedAllActiveProducts &&
            Date.now() - cachedAllActiveProducts.cachedAt < CATALOG_TTL_MS;
        if (canUseBaseCache && cachedAllActiveProducts) {
            products = cachedAllActiveProducts.data;
        }
        else if (!q &&
            sort === "featured" &&
            !category &&
            !section &&
            !minPrice &&
            !maxPrice &&
            !inStock &&
            Number(limit) >= 100) {
            const { data, error } = await supabase_1.supabase
                .from("products")
                .select("*")
                .eq("is_active", true)
                .order("is_featured", { ascending: false })
                .order("is_best_seller", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(Number(limit));
            if (error)
                throw error;
            products = data || [];
            cachedAllActiveProducts = { data: products, cachedAt: Date.now() };
        }
        if (!products) {
            let query = supabase_1.supabase
                .from("products")
                .select("*")
                .eq("is_active", true);
            // Section filter ('women' | 'men') - backwards compatible: when omitted, all products returned
            if (section && typeof section === "string" && section.toLowerCase() !== "all") {
                query = query.eq("section", section.toLowerCase().trim());
            }
            // Category filter
            if (category && category !== "all") {
                query = query.eq("category", category);
            }
            // Price range filter
            if (minPrice)
                query = query.gte("discounted_price", Number(minPrice));
            if (maxPrice)
                query = query.lte("discounted_price", Number(maxPrice));
            // In-stock only
            if (inStock === "true")
                query = query.eq("is_sold_out", false);
            // Text search on name & description (sanitized against PostgREST injection - SEC-06)
            if (q && typeof q === "string") {
                const sanitized = q.replace(/[^a-zA-Z0-9\s]/g, "").trim();
                if (sanitized) {
                    query = query.or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%,subcategory.ilike.%${sanitized}%`);
                }
            }
            // Sorting
            switch (sort) {
                case "newest":
                    query = query.order("created_at", { ascending: false });
                    break;
                case "price-asc":
                    query = query.order("discounted_price", { ascending: true });
                    break;
                case "price-desc":
                    query = query.order("discounted_price", { ascending: false });
                    break;
                case "discount":
                    // Handled post-fetch
                    break;
                default: // featured
                    query = query
                        .order("is_featured", { ascending: false })
                        .order("is_best_seller", { ascending: false })
                        .order("created_at", { ascending: false });
            }
            query = query.limit(Number(limit));
            const { data, error } = await query;
            if (error)
                throw error;
            products = data || [];
        }
        else {
            // Apply lightweight filters in-memory on cached base product list
            products = products.filter((p) => {
                if (section && typeof section === "string" && section.toLowerCase() !== "all") {
                    if ((p.section || "women") !== section.toLowerCase().trim())
                        return false;
                }
                if (category && category !== "all" && p.category !== category)
                    return false;
                if (minPrice && p.discounted_price < Number(minPrice))
                    return false;
                if (maxPrice && p.discounted_price > Number(maxPrice))
                    return false;
                if (inStock === "true" && p.is_sold_out)
                    return false;
                return true;
            });
        }
        let result = products || [];
        // Post-fetch filters (subcategory, sizes, colors)
        if (sub) {
            const subs = (Array.isArray(sub) ? sub : [sub]).map((s) => String(s).toLowerCase().trim());
            result = result.filter((p) => {
                const pSub = (p.subcategory || "").toLowerCase().trim();
                if (!pSub)
                    return false;
                const pSubNormalized = pSub.replace(/[\s_-]+/g, "-");
                return subs.includes(pSub) || subs.some((s) => s.replace(/[\s_-]+/g, "-") === pSubNormalized);
            });
        }
        if (size) {
            const sizes = Array.isArray(size) ? size : [size];
            result = result.filter((p) => sizes.some((s) => p.sizes?.includes(s)));
        }
        if (color) {
            const colors = Array.isArray(color) ? color : [color];
            result = result.filter((p) => p.color_variants?.some((cv) => colors.includes(cv.name)));
        }
        if (sort === "discount") {
            result = [...result].sort((a, b) => b.regular_price - b.discounted_price - (a.regular_price - a.discounted_price));
        }
        res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
        res.json({ products: result, total: result.length });
    }
    catch (err) {
        console.error("GET /products error:", err);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});
// GET /api/products/featured — Featured products for homepage
router.get("/featured", async (_req, res) => {
    try {
        if (cachedFeatured && Date.now() - cachedFeatured.cachedAt < CATALOG_TTL_MS) {
            res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
            res.json(cachedFeatured.data);
            return;
        }
        const [bestsellersRes, newArrivalsRes] = await Promise.all([
            supabase_1.supabase
                .from("products")
                .select("*")
                .eq("is_active", true)
                .eq("is_best_seller", true)
                .limit(8),
            supabase_1.supabase
                .from("products")
                .select("*")
                .eq("is_active", true)
                .eq("is_new_arrival", true)
                .limit(8),
        ]);
        if (bestsellersRes.error)
            throw bestsellersRes.error;
        if (newArrivalsRes.error)
            throw newArrivalsRes.error;
        const result = {
            bestsellers: bestsellersRes.data || [],
            newArrivals: newArrivalsRes.data || [],
        };
        cachedFeatured = { data: result, cachedAt: Date.now() };
        res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
        res.json(result);
    }
    catch (err) {
        console.error("GET /products/featured error:", err);
        res.status(500).json({ error: "Failed to fetch featured products" });
    }
});
// GET /api/products/:slug — Single product detail
router.get("/:slug", async (req, res) => {
    try {
        const { slug } = req.params;
        const cached = productSlugCache.get(slug);
        if (cached && Date.now() - cached.cachedAt < CATALOG_TTL_MS) {
            res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
            res.json({ product: cached.data });
            return;
        }
        const { data: product, error } = await supabase_1.supabase
            .from("products")
            .select("*")
            .eq("slug", slug)
            .eq("is_active", true)
            .single();
        if (error || !product) {
            res.status(404).json({ error: "Product not found" });
            return;
        }
        productSlugCache.set(slug, { data: product, cachedAt: Date.now() });
        res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
        res.json({ product });
    }
    catch (err) {
        console.error("GET /products/:slug error:", err);
        res.status(500).json({ error: "Failed to fetch product" });
    }
});
exports.default = router;
