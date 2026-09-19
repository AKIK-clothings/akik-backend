import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase";
import { enquiryLimiter } from "../middleware/rateLimit";
import { validateBody, enquirySubmitSchema } from "../middleware/validate";

const router = Router();

// POST /api/enquiries — Submit a contact form enquiry
router.post("/", enquiryLimiter, validateBody(enquirySubmitSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, topic, message } = req.body;

    if (!name || !message) {
      res.status(400).json({ error: "Name and message are required" });
      return;
    }

    const { data, error } = await supabase
      .from("enquiries")
      .insert({ name, phone, topic, message })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Your enquiry has been received! Hafsa will reach out soon via WhatsApp.",
      id: data.id,
    });
  } catch (err) {
    console.error("POST /enquiries error:", err);
    res.status(500).json({ error: "Failed to submit enquiry" });
  }
});

export default router;
