import { Router, Request, Response } from "express";
import { supabase } from "../../config/supabase";
import { requireAdmin } from "../../middleware/auth";
import {
  validateBody,
  validateUuidParam,
  adminPromoCreateSchema,
  adminPromoUpdateSchema,
} from "../../middleware/validate";

const router = Router();
router.use(requireAdmin);

// GET /api/admin/promos — List all promo codes
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data: promos, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ promos: promos || [] });
  } catch (err) {
    console.error("Admin GET /promos error:", err);
    res.status(500).json({ error: "Failed to fetch promo codes" });
  }
});

// POST /api/admin/promos — Create promo code (HIGH-07)
router.post(
  "/",
  validateBody(adminPromoCreateSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, discountPercentage, description, minOrderValue, isActive, usageLimit, expiresAt } = req.body;

      const { data: promo, error } = await supabase
        .from("promo_codes")
        .insert({
          code: code.trim().toUpperCase(),
          discount_percentage: discountPercentage,
          description: description || null,
          min_order_value: minOrderValue || 0,
          is_active: isActive !== undefined ? isActive : true,
          usage_limit: usageLimit || null,
          expires_at: expiresAt || null,
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ promo });
    } catch (err) {
      console.error("Admin POST /promos error:", err);
      res.status(500).json({ error: "Failed to create promo code" });
    }
  }
);

// PUT /api/admin/promos/:id — Update promo code (HIGH-05, HIGH-07)
router.put(
  "/:id",
  validateUuidParam("id"),
  validateBody(adminPromoUpdateSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { discountPercentage, description, minOrderValue, isActive, usageLimit, expiresAt } = req.body;

      const updateData: Record<string, unknown> = {};
      if (discountPercentage !== undefined) updateData.discount_percentage = discountPercentage;
      if (description !== undefined) updateData.description = description;
      if (minOrderValue !== undefined) updateData.min_order_value = minOrderValue;
      if (isActive !== undefined) updateData.is_active = isActive;
      if (usageLimit !== undefined) updateData.usage_limit = usageLimit;
      if (expiresAt !== undefined) updateData.expires_at = expiresAt;

      const { data: promo, error } = await supabase
        .from("promo_codes")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json({ promo });
    } catch (err) {
      console.error("Admin PUT /promos/:id error:", err);
      res.status(500).json({ error: "Failed to update promo code" });
    }
  }
);

// DELETE /api/admin/promos/:id — Delete promo code (HIGH-05)
router.delete("/:id", validateUuidParam("id"), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Admin DELETE /promos/:id error:", err);
    res.status(500).json({ error: "Failed to delete promo code" });
  }
});

export default router;
