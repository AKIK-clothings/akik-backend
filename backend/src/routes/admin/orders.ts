import { Router, Request, Response } from "express";
import { supabase } from "../../config/supabase";
import { requireAdmin } from "../../middleware/auth";
import {
  validateBody,
  validateUuidParam,
  adminOrderStatusSchema,
} from "../../middleware/validate";

const router = Router();
router.use(requireAdmin);

// GET /api/admin/orders — List all orders with filters
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = "1", limit = "20", date } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Number(limit));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from("orders")
      .select("*, order_items(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status && status !== "all") {
      query = query.eq("status", status as string);
    }

    // Date filter: treat YYYY-MM-DD as IST day (UTC+5:30)
    if (date && typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // IST start of day = date T00:00:00+05:30 = date-1 T18:30:00Z
      // IST end of day   = date T23:59:59+05:30 = date   T18:29:59Z
      const [y, m, d] = date.split("-").map(Number);
      const istStart = new Date(Date.UTC(y, m - 1, d) - 5.5 * 60 * 60 * 1000);
      const istEnd   = new Date(istStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      query = query
        .gte("created_at", istStart.toISOString())
        .lte("created_at", istEnd.toISOString());
    }

    const { data: orders, error, count } = await query;
    if (error) throw error;

    res.json({
      orders: orders || [],
      total: count || 0,
      page: pageNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err) {
    console.error("Admin GET /orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// GET /api/admin/dashboard — Quick stats for dashboard
router.get("/stats/overview", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      productsRes,
      ordersRes,
      newOrdersRes,
      revenueRes,
      enquiriesRes,
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["new", "confirmed"]),
      supabase.from("orders").select("final_total").eq("payment_status", "paid"),
      supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("is_read", false),
    ]);

    const totalRevenue = (revenueRes.data || []).reduce(
      (sum, order) => sum + (order.final_total || 0),
      0
    );

    res.json({
      totalProducts: productsRes.count || 0,
      totalOrders: ordersRes.count || 0,
      newOrders: newOrdersRes.count || 0,
      totalRevenue,
      unreadEnquiries: enquiriesRes.count || 0,
    });
  } catch (err) {
    console.error("Admin GET /orders/stats/overview error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/admin/orders/:id — Single order detail (HIGH-05)
router.get("/:id", validateUuidParam("id"), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .single();

    if (error || !order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json({ order });
  } catch (err) {
    console.error("Admin GET /orders/:id error:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// PATCH /api/admin/orders/:id/status — Update order status (HIGH-05, HIGH-07)
router.patch(
  "/:id/status",
  validateUuidParam("id"),
  validateBody(adminOrderStatusSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (notes !== undefined) updateData.notes = notes;

      const { data: order, error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json({ order });
    } catch (err) {
      console.error("Admin PATCH /orders/:id/status error:", err);
      res.status(500).json({ error: "Failed to update order status" });
    }
  }
);

export default router;
