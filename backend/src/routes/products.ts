import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase";

const router = Router();

// GET /api/products — List active products with filtering & sorting
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      sub,
      sort = "featured",
      q,
      size,
      color,
      inStock,
      minPrice,
      maxPrice,
      limit = "100",
    } = req.query;

    let query = supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    // Category filter
    if (category && category !== "all") {
      query = query.eq("category", category as string);
    }

    // Price range filter
    if (minPrice) query = query.gte("discounted_price", Number(minPrice));
    if (maxPrice) query = query.lte("discounted_price", Number(maxPrice));

    // In-stock only
    if (inStock === "true") query = query.eq("is_sold_out", false);

    // Text search on name & description (sanitized against PostgREST injection - SEC-06)
    if (q && typeof q === "string") {
      const sanitized = q.replace(/[^a-zA-Z0-9\s]/g, "").trim();
      if (sanitized) {
        query = query.or(
          `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%,subcategory.ilike.%${sanitized}%`
        );
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

    const { data: products, error } = await query;
    if (error) throw error;

    let result = products || [];

    // Post-fetch filters (JSONB fields)
    if (sub) {
      const subs = Array.isArray(sub) ? sub : [sub];
      result = result.filter((p) => subs.includes(p.subcategory));
    }

    if (size) {
      const sizes = Array.isArray(size) ? size : [size];
      result = result.filter((p) =>
        sizes.some((s) => p.sizes?.includes(s))
      );
    }

    if (color) {
      const colors = Array.isArray(color) ? color : [color];
      result = result.filter((p) =>
        p.color_variants?.some((cv: { name: string }) =>
          colors.includes(cv.name)
        )
      );
    }

    if (sort === "discount") {
      result = result.sort(
        (a, b) =>
          b.regular_price - b.discounted_price - (a.regular_price - a.discounted_price)
      );
    }

    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json({ products: result, total: result.length });
  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/featured — Featured products for homepage
router.get("/featured", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [bestsellersRes, newArrivalsRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_best_seller", true)
        .limit(8),
      supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_new_arrival", true)
        .limit(8),
    ]);

    if (bestsellersRes.error) throw bestsellersRes.error;
    if (newArrivalsRes.error) throw newArrivalsRes.error;

    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json({
      bestsellers: bestsellersRes.data || [],
      newArrivals: newArrivalsRes.data || [],
    });
  } catch (err) {
    console.error("GET /products/featured error:", err);
    res.status(500).json({ error: "Failed to fetch featured products" });
  }
});

// GET /api/products/:slug — Single product detail
router.get("/:slug", async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({ product });
  } catch (err) {
    console.error("GET /products/:slug error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

export default router;
