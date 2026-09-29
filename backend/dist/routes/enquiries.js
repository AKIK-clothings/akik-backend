"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const rateLimit_1 = require("../middleware/rateLimit");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// POST /api/enquiries — Submit a contact form enquiry
router.post("/", rateLimit_1.enquiryLimiter, (0, validate_1.validateBody)(validate_1.enquirySubmitSchema), async (req, res) => {
    try {
        const { name, phone, topic, message } = req.body;
        if (!name || !message) {
            res.status(400).json({ error: "Name and message are required" });
            return;
        }
        const { data, error } = await supabase_1.supabase
            .from("enquiries")
            .insert({ name, phone, topic, message })
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json({
            success: true,
            message: "Your enquiry has been received! Hafsa will reach out soon via WhatsApp.",
            id: data.id,
        });
    }
    catch (err) {
        console.error("POST /enquiries error:", err);
        res.status(500).json({ error: "Failed to submit enquiry" });
    }
});
exports.default = router;
