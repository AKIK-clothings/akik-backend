import { Router, Request, Response } from "express";
import { supabase } from "../../config/supabase";
import { requireAdmin } from "../../middleware/auth";
import {
  validateBody,
  validateUuidParam,
  adminEnquiryUpdateSchema,
} from "../../middleware/validate";

const router = Router();
router.use(requireAdmin);

// GET /api/admin/enquiries — List all enquiries (newest first)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { unread } = req.query;

    let query = supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (unread === "true") query = query.eq("is_read", false);

    const { data: enquiries, error } = await query;
    if (error) throw error;

    res.json({ enquiries: enquiries || [] });
  } catch (err) {
    console.error("Admin GET /enquiries error:", err);
    res.status(500).json({ error: "Failed to fetch enquiries" });
  }
});

// PATCH /api/admin/enquiries/:id/read — Mark as read (HIGH-05, HIGH-07)
router.patch(
  "/:id/read",
  validateUuidParam("id"),
  validateBody(adminEnquiryUpdateSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isRead = true } = req.body;

      const { data: enquiry, error } = await supabase
        .from("enquiries")
        .update({ is_read: isRead })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json({ enquiry });
    } catch (err) {
      console.error("Admin PATCH /enquiries/:id/read error:", err);
      res.status(500).json({ error: "Failed to update enquiry" });
    }
  }
);

export default router;
