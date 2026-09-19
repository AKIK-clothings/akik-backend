import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../../config/supabase";
import { authLimiter } from "../../middleware/rateLimit";
import { validateBody, adminLoginSchema } from "../../middleware/validate";

const router = Router();

// POST /api/admin/login
router.post("/login", authLimiter, validateBody(adminLoginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const { data: admin, error } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !admin) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
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

// GET /api/admin/me — Verify token and return admin info (used on page load)
router.get("/me", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.akik_admin_token;

    if (!authHeader?.startsWith("Bearer ") && !cookieToken) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const token = cookieToken || (authHeader ? authHeader.split(" ")[1] : "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string; email: string; role: string;
    };

    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, name, email, role")
      .eq("id", decoded.id)
      .single();

    if (error || !admin) {
      res.status(401).json({ error: "Admin not found" });
      return;
    }

    res.json({ admin });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// POST /api/admin/logout
router.post("/logout", (req: Request, res: Response): void => {
  res.clearCookie("akik_admin_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({ success: true });
});

export default router;
