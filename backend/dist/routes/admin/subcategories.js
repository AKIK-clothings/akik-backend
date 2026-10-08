"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../../config/supabase");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const slugify_1 = require("../../utils/slugify");
const router = (0, express_1.Router)();
router.use(auth_1.requireAdmin);
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
// ─── GET /api/admin/subcategories ─────────────────────────────────────────────
// List all subcategories, optionally filtered by section
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
            console.warn("Admin sub_categories query failed, using fallback:", error.message);
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
        console.error("Admin GET /subcategories error:", err);
        res.status(500).json({ error: "Failed to fetch subcategories" });
    }
});
// ─── POST /api/admin/subcategories ────────────────────────────────────────────
// Create a new sub-category within a section
// Slugifies name, validates uniqueness case-insensitively, and returns existing if duplicate
router.post("/", (0, validate_1.validateBody)(validate_1.subcategoryCreateSchema), async (req, res) => {
    try {
        const { section, name } = req.body;
        const cleanName = name.trim();
        const slug = (0, slugify_1.slugify)(cleanName);
        if (!slug) {
            res.status(400).json({ error: "Invalid subcategory name: generated slug is empty" });
            return;
        }
        // Check if duplicate subcategory already exists within this section (case-insensitive)
        const { data: existing, error: findError } = await supabase_1.supabase
            .from("sub_categories")
            .select("*")
            .eq("section", section)
            .or(`slug.eq.${slug},name.ilike.${cleanName}`)
            .maybeSingle();
        if (!findError && existing) {
            res.status(200).json({
                subcategory: existing,
                message: `Subcategory "${existing.name}" already exists for ${section}.`,
            });
            return;
        }
        // Insert new subcategory
        const { data: created, error: insertError } = await supabase_1.supabase
            .from("sub_categories")
            .insert({
            section,
            name: cleanName,
            slug,
        })
            .select()
            .single();
        if (insertError) {
            // If unique constraint violation race condition occurred, retrieve existing
            if (insertError.code === "23505") {
                const { data: raceMatch } = await supabase_1.supabase
                    .from("sub_categories")
                    .select("*")
                    .eq("section", section)
                    .eq("slug", slug)
                    .maybeSingle();
                if (raceMatch) {
                    res.status(200).json({
                        subcategory: raceMatch,
                        message: `Subcategory "${raceMatch.name}" already exists for ${section}.`,
                    });
                    return;
                }
            }
            throw insertError;
        }
        res.status(201).json({
            subcategory: created,
            message: `Subcategory "${created.name}" created successfully.`,
        });
    }
    catch (err) {
        console.error("Admin POST /subcategories error:", err);
        res.status(500).json({ error: err?.message || "Failed to create subcategory" });
    }
});
exports.default = router;
