import { Router, Request, Response } from "express";
import { supabase } from "../../config/supabase";
import { requireAdmin } from "../../middleware/auth";
import { upload } from "../../middleware/upload";
import { slugify } from "../../utils/slugify";
import {
  validateBody,
  validateUuidParam,
  adminProductCreateSchema,
  adminProductUpdateSchema,
} from "../../middleware/validate";

const router = Router();

// All routes in this file require admin authentication
router.use(requireAdmin);

// ─── GET /api/admin/products ─────────────────────────────────────────────────
// List ALL products (including inactive) for admin management
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ products: products || [], total: products?.length || 0 });
  } catch (err) {
    console.error("Admin GET /products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ─── POST /api/admin/products ────────────────────────────────────────────────
// Create a new product (without images — images uploaded separately)
router.post(
  "/",
  validateBody(adminProductCreateSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body;
      const slug = body.slug || slugify(body.name);

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existing) {
        res.status(400).json({ error: `A product with slug "${slug}" already exists` });
        return;
      }

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        slug,
        name: body.name,
        category: body.category,
        subcategory: body.subcategory,
        regular_price: body.regularPrice || body.discountedPrice,
        discounted_price: body.discountedPrice,
        is_sold_out: body.isSoldOut || false,
        sizes: body.sizes || [],
        size_stock_map: body.sizeStockMap || {},
        color_variants: body.colorVariants || [],
        primary_image: body.primaryImage || "",
        secondary_image: body.secondaryImage || "",
        gallery_images: body.galleryImages || [],
        sku: body.sku || `AKIK-${Date.now()}`,
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

    if (error) throw error;
    res.status(201).json({ product });
  } catch (err) {
    console.error("Admin POST /products error:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// ─── GET /api/admin/products/:id ─────────────────────────────────────────────
// Get single product for editing
router.get("/:id", validateUuidParam("id"), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({ product });
  } catch (err) {
    console.error("Admin GET /products/:id error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ─── PUT /api/admin/products/:id ─────────────────────────────────────────────
// Update a product's details
router.put(
  "/:id",
  validateUuidParam("id"),
  validateBody(adminProductUpdateSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const body = req.body;

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

      // Only update fields that were sent
      const fieldMap: Record<string, string> = {
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
      };

      for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
        if (body[jsKey] !== undefined) {
          updateData[dbCol] = body[jsKey];
        }
      }

      const { data: product, error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json({ product });
    } catch (err) {
      console.error("Admin PUT /products/:id error:", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);

// ─── DELETE /api/admin/products/:id ──────────────────────────────────────────
// Delete a product permanently
router.delete("/:id", validateUuidParam("id"), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("Admin DELETE /products/:id error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ─── PATCH /api/admin/products/:id/stock ─────────────────────────────────────
// Quick stock toggle — mark product as sold out / back in stock
router.patch("/:id/stock", validateUuidParam("id"), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isSoldOut, sizeStockMap } = req.body;

    const { data: product, error } = await supabase
      .from("products")
      .update({
        is_sold_out: isSoldOut,
        size_stock_map: sizeStockMap,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ product });
  } catch (err) {
    console.error("Admin PATCH /products/:id/stock error:", err);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

// ─── POST /api/admin/products/:id/images ─────────────────────────────────────
// Upload product images to Supabase Storage
router.post(
  "/:id/images",
  validateUuidParam("id"),
  upload.array("images", 10),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ error: "No images provided" });
        return;
      }

      const allowedExts = ["jpg", "jpeg", "png", "webp"];
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.originalname.split(".").pop()?.toLowerCase();
        if (!fileExt || !allowedExts.includes(fileExt)) {
          res.status(400).json({ error: `Invalid image file extension ".${fileExt}". Allowed: ${allowedExts.join(", ")}` });
          return;
        }

        const fileName = `products/${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      res.json({
        success: true,
        urls: uploadedUrls,
        message: `${uploadedUrls.length} image(s) uploaded successfully`,
      });
    } catch (err) {
      console.error("Admin POST /products/:id/images error:", err);
      res.status(500).json({ error: "Failed to upload images" });
    }
  }
);

export default router;
