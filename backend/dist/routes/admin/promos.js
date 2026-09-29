"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../../config/supabase");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.requireAdmin);
// GET /api/admin/promos — List all promo codes
router.get("/", async (_req, res) => {
    try {
        const { data: promos, error } = await supabase_1.supabase
            .from("promo_codes")
            .select("*")
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        res.json({ promos: promos || [] });
    }
    catch (err) {
        console.error("Admin GET /promos error:", err);
        res.status(500).json({ error: "Failed to fetch promo codes" });
    }
});
// POST /api/admin/promos — Create promo code (HIGH-07)
router.post("/", (0, validate_1.validateBody)(validate_1.adminPromoCreateSchema), async (req, res) => {
    try {
        const { code, discountPercentage, description, minOrderValue, isActive, usageLimit, expiresAt } = req.body;
        const { data: promo, error } = await supabase_1.supabase
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
        if (error)
            throw error;
        res.status(201).json({ promo });
    }
    catch (err) {
        console.error("Admin POST /promos error:", err);
        res.status(500).json({ error: "Failed to create promo code" });
    }
});
// PUT /api/admin/promos/:id — Update promo code (HIGH-05, HIGH-07)
router.put("/:id", (0, validate_1.validateUuidParam)("id"), (0, validate_1.validateBody)(validate_1.adminPromoUpdateSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { discountPercentage, description, minOrderValue, isActive, usageLimit, expiresAt } = req.body;
        const updateData = {};
        if (discountPercentage !== undefined)
            updateData.discount_percentage = discountPercentage;
        if (description !== undefined)
            updateData.description = description;
        if (minOrderValue !== undefined)
            updateData.min_order_value = minOrderValue;
        if (isActive !== undefined)
            updateData.is_active = isActive;
        if (usageLimit !== undefined)
            updateData.usage_limit = usageLimit;
        if (expiresAt !== undefined)
            updateData.expires_at = expiresAt;
        const { data: promo, error } = await supabase_1.supabase
            .from("promo_codes")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();
        if (error)
            throw error;
        res.json({ promo });
    }
    catch (err) {
        console.error("Admin PUT /promos/:id error:", err);
        res.status(500).json({ error: "Failed to update promo code" });
    }
});
// DELETE /api/admin/promos/:id — Delete promo code (HIGH-05)
router.delete("/:id", (0, validate_1.validateUuidParam)("id"), async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase_1.supabase.from("promo_codes").delete().eq("id", id);
        if (error)
            throw error;
        res.json({ success: true });
    }
    catch (err) {
        console.error("Admin DELETE /promos/:id error:", err);
        res.status(500).json({ error: "Failed to delete promo code" });
    }
});
exports.default = router;
