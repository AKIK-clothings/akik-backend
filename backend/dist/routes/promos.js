"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const rateLimit_1 = require("../middleware/rateLimit");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// POST /api/promos/validate — Validate a promo code against current cart subtotal
router.post("/validate", rateLimit_1.promoLimiter, (0, validate_1.validateBody)(validate_1.promoValidateSchema), async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        if (!code || typeof code !== "string") {
            res.status(400).json({ valid: false, message: "Please enter a promo code" });
            return;
        }
        if (!subtotal || typeof subtotal !== "number") {
            res.status(400).json({ valid: false, message: "Invalid subtotal" });
            return;
        }
        const { data: promo, error } = await supabase_1.supabase
            .from("promo_codes")
            .select("*")
            .eq("code", code.trim().toUpperCase())
            .eq("is_active", true)
            .single();
        if (error || !promo) {
            res.json({ valid: false, message: "Invalid or expired promo code" });
            return;
        }
        // Check expiry
        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
            res.json({ valid: false, message: "This promo code has expired" });
            return;
        }
        // Check usage limit
        if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
            res.json({ valid: false, message: "This promo code has reached its usage limit" });
            return;
        }
        // Check minimum order value
        if (promo.min_order_value && subtotal < promo.min_order_value) {
            res.json({
                valid: false,
                message: `Minimum order of ₹${promo.min_order_value.toLocaleString("en-IN")} required for this code`,
            });
            return;
        }
        const discountAmount = Math.round((subtotal * promo.discount_percentage) / 100);
        res.json({
            valid: true,
            message: `${promo.description} — ₹${discountAmount.toLocaleString("en-IN")} off applied!`,
            promo: {
                code: promo.code,
                discountPercentage: promo.discount_percentage,
                description: promo.description,
                discountAmount,
            },
        });
    }
    catch (err) {
        console.error("POST /promos/validate error:", err);
        res.status(500).json({ valid: false, message: "Failed to validate promo code" });
    }
});
exports.default = router;
