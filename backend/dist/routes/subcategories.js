"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const router = (0, express_1.Router)();
// Fallback subcategories matching 001 migration seed in case migration is not yet run
const FALLBACK_SUBCATEGORIES = [
    { id: "sub-men-1", section: "men", name: "Kurta Sets", slug: "kurta-sets" },
    { id: "sub-men-2", section: "men", name: "Premium Cotton Plain", slug: "premium-cotton-plain" },
    { id: "sub-men-3", section: "men", name: "Premium Cotton Self Designed", slug: "premium-cotton-self-designed" },
    { id: "sub-women-1", section: "women", name: "Embroidered Satin with Dupatta", slug: "embroidered-satin-with-dupatta" },
    { id: "sub-women-2", section: "women", name: "Luxury Cotton Satin", slug: "luxury-cotton-satin" },
    { id: "sub-women-3", section: "women", name: "Satin Lucknowi Collection", slug: "satin-lucknowi-collection" },
    { id: "sub-women-4", section: "women", name: "Rose Royale Collection", slug: "rose-royale-collection" },
    { id: "sub-women-5", section: "women", name: "PURE COTTON SUITS", slug: "pure-cotton-suits" },
];
// GET /api/subcategories — List sub-categories with optional section filter
router.get("/", async (req, res) => {
    try {
        const { section } = req.query;
        let query = supabase_1.supabase
            .from("sub_categories")
            .select("*")
            .order("created_at", { ascending: true });
        if (section && typeof section === "string" && section.toLowerCase() !== "all") {
            query = query.eq("section", section.toLowerCase().trim());
        }
        const { data, error } = await query;
        if (error) {
            console.warn("Failed to query sub_categories table, using fallback:", error.message);
            let fallback = FALLBACK_SUBCATEGORIES;
            if (section && typeof section === "string" && section.toLowerCase() !== "all") {
                fallback = fallback.filter((s) => s.section === section.toLowerCase().trim());
            }
            res.json({ subcategories: fallback });
            return;
        }
        res.json({ subcategories: data || [] });
    }
    catch (err) {
        console.error("GET /subcategories error:", err);
        res.status(500).json({ error: "Failed to fetch subcategories" });
    }
});
exports.default = router;
