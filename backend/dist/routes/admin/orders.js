"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateStatsOverviewCache = void 0;
const express_1 = require("express");
const supabase_1 = require("../../config/supabase");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.requireAdmin);
// GET /api/admin/orders — List all orders with filters
router.get("/", async (req, res) => {
    try {
        const { status, page = "1", limit = "20", date } = req.query;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Number(limit));
        const from = (pageNum - 1) * limitNum;
        const to = from + limitNum - 1;
        let query = supabase_1.supabase
            .from("orders")
            .select("*, order_items(*)", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(from, to);
        if (status && status !== "all") {
            query = query.eq("status", status);
        }
        // Date filter: treat YYYY-MM-DD as IST day (UTC+5:30)
        if (date && typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            // IST start of day = date T00:00:00+05:30 = date-1 T18:30:00Z
            // IST end of day   = date T23:59:59+05:30 = date   T18:29:59Z
            const [y, m, d] = date.split("-").map(Number);
            const istStart = new Date(Date.UTC(y, m - 1, d) - 5.5 * 60 * 60 * 1000);
            const istEnd = new Date(istStart.getTime() + 24 * 60 * 60 * 1000 - 1);
            query = query
                .gte("created_at", istStart.toISOString())
                .lte("created_at", istEnd.toISOString());
        }
        const { data: orders, error, count } = await query;
        if (error)
            throw error;
        res.json({
            orders: orders || [],
            total: count || 0,
            page: pageNum,
            totalPages: Math.ceil((count || 0) / limitNum),
        });
    }
    catch (err) {
        console.error("Admin GET /orders error:", err);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});
let cachedStatsOverview = null;
const STATS_OVERVIEW_TTL_MS = 30 * 1000; // 30 seconds
const invalidateStatsOverviewCache = () => {
    cachedStatsOverview = null;
};
exports.invalidateStatsOverviewCache = invalidateStatsOverviewCache;
// GET /api/admin/dashboard — Quick stats for dashboard (cached 30s)
router.get("/stats/overview", async (_req, res) => {
    try {
        if (cachedStatsOverview && Date.now() - cachedStatsOverview.cachedAt < STATS_OVERVIEW_TTL_MS) {
            res.json(cachedStatsOverview.data);
            return;
        }
        const [productsRes, ordersRes, newOrdersRes, revenueRes, enquiriesRes,] = await Promise.all([
            supabase_1.supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
            supabase_1.supabase.from("orders").select("*", { count: "exact", head: true }),
            supabase_1.supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["new", "confirmed"]),
            supabase_1.supabase.from("orders").select("final_total").eq("payment_status", "paid"),
            supabase_1.supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("is_read", false),
        ]);
        const totalRevenue = (revenueRes.data || []).reduce((sum, order) => sum + (order.final_total || 0), 0);
        const result = {
            totalProducts: productsRes.count || 0,
            totalOrders: ordersRes.count || 0,
            newOrders: newOrdersRes.count || 0,
            totalRevenue,
            unreadEnquiries: enquiriesRes.count || 0,
        };
        cachedStatsOverview = { data: result, cachedAt: Date.now() };
        res.json(result);
    }
    catch (err) {
        console.error("Admin GET /orders/stats/overview error:", err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});
// GET /api/admin/orders/:id — Single order detail (HIGH-05)
router.get("/:id", (0, validate_1.validateUuidParam)("id"), async (req, res) => {
    try {
        const { id } = req.params;
        const { data: order, error } = await supabase_1.supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("id", id)
            .single();
        if (error || !order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        res.json({ order });
    }
    catch (err) {
        console.error("Admin GET /orders/:id error:", err);
        res.status(500).json({ error: "Failed to fetch order" });
    }
});
// PATCH /api/admin/orders/:id/status — Update order status (HIGH-05, HIGH-07)
router.patch("/:id/status", (0, validate_1.validateUuidParam)("id"), (0, validate_1.validateBody)(validate_1.adminOrderStatusSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const updateData = {
            status,
            updated_at: new Date().toISOString(),
        };
        if (notes !== undefined)
            updateData.notes = notes;
        const { data: order, error } = await supabase_1.supabase
            .from("orders")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();
        if (error)
            throw error;
        (0, exports.invalidateStatsOverviewCache)();
        res.json({ order });
    }
    catch (err) {
        console.error("Admin PATCH /orders/:id/status error:", err);
        res.status(500).json({ error: "Failed to update order status" });
    }
});
exports.default = router;
