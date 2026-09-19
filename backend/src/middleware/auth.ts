import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase";

interface AdminPayload {
  id: string;
  email: string;
  role: string;
}

// Extend Express Request to carry admin info
declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.akik_admin_token;

  if ((!authHeader || !authHeader.startsWith("Bearer ")) && !cookieToken) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  const token = cookieToken || (authHeader ? authHeader.split(" ")[1] : "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AdminPayload;

    // Database verification for token revocation / admin status check (HIGH-02)
    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, email, role")
      .eq("id", decoded.id)
      .single();

    if (error || !admin) {
      res.status(401).json({ error: "Unauthorized: Account not found or revoked" });
      return;
    }

    req.admin = { id: admin.id, email: admin.email, role: admin.role || decoded.role || "admin" };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};
