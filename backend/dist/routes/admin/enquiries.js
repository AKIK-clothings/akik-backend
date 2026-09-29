"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../../config/supabase");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.requireAdmin);
// GET /api/admin/enquiries — List all enquiries (newest first)
router.get("/", async (req, res) => {
    try {
        const { unread } = req.query;
        let query = supabase_1.supabase
            .from("enquiries")
            .select("*")
            .order("created_at", { ascending: false });
        if (unread === "true")
            query = query.eq("is_read", false);
        const { data: enquiries, error } = await query;
        if (error)
            throw error;
        res.json({ enquiries: enquiries || [] });
    }
    catch (err) {
        console.error("Admin GET /enquiries error:", err);
        res.status(500).json({ error: "Failed to fetch enquiries" });
    }
});
// PATCH /api/admin/enquiries/:id/read — Mark as read (HIGH-05, HIGH-07)
router.patch("/:id/read", (0, validate_1.validateUuidParam)("id"), (0, validate_1.validateBody)(validate_1.adminEnquiryUpdateSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { isRead = true } = req.body;
        const { data: enquiry, error } = await supabase_1.supabase
            .from("enquiries")
            .update({ is_read: isRead })
            .eq("id", id)
            .select()
            .single();
        if (error)
            throw error;
        res.json({ enquiry });
    }
    catch (err) {
        console.error("Admin PATCH /enquiries/:id/read error:", err);
        res.status(500).json({ error: "Failed to update enquiry" });
    }
});
exports.default = router;
