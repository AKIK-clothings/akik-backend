import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../../config/supabase";
import { authLimiter } from "../../middleware/rateLimit";
import { validateBody, adminLoginSchema } from "../../middleware/validate";
import { requireAdmin, invalidateAdminAuthCache } from "../../middleware/auth";

const router = Router();

// POST /api/admin/login
router.post("/login", authLimiter, validateBody(adminLoginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const rawEmail = req.body.email;
    const rawPassword = req.body.password;

    if (!rawEmail || !rawPassword) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const cleanEmail = rawEmail.trim().toLowerCase();
    const cleanPassword = typeof rawPassword === "string" ? rawPassword.trim() : rawPassword;

    const { data: admin, error } = await supabase
      .from("admins")
      .select("*")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (error || !admin) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(cleanPassword, admin.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role || "admin" },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"] }
    );

    res.cookie("akik_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error("POST /admin/login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/admin/me — Verify token and return admin info (cached via requireAdmin)
router.get("/me", requireAdmin, (req: Request, res: Response): void => {
  res.json({ admin: req.admin });
});

// POST /api/admin/logout
router.post("/logout", (req: Request, res: Response): void => {
  invalidateAdminAuthCache();
  res.clearCookie("akik_admin_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({ success: true });
});

export default router;
