import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase";

interface AdminPayload {
  id: string;
  name?: string;
  email: string;
  role: string;
}

interface CachedAdminRecord {
  admin: AdminPayload;
  cachedAt: number;
}

// In-memory micro-cache to prevent hammering Supabase admins table on every request
const adminAuthCache = new Map<string, CachedAdminRecord>();
const ADMIN_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export const invalidateAdminAuthCache = (adminId?: string): void => {
  if (adminId) {
    adminAuthCache.delete(adminId);
  } else {
    adminAuthCache.clear();
  }
};

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

    // Fast-path: Check memory cache first
    const cached = adminAuthCache.get(decoded.id);
    if (cached && Date.now() - cached.cachedAt < ADMIN_CACHE_TTL_MS) {
      req.admin = cached.admin;
      next();
      return;
    }

    // Database verification for token revocation / admin status check (HIGH-02)
    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, name, email, role")
      .eq("id", decoded.id)
      .single();

    if (error || !admin) {
      adminAuthCache.delete(decoded.id);
      res.status(401).json({ error: "Unauthorized: Account not found or revoked" });
      return;
    }

    const payload: AdminPayload = {
      id: admin.id,
      name: admin.name || "Admin",
      email: admin.email,
      role: admin.role || decoded.role || "admin",
    };

    adminAuthCache.set(decoded.id, { admin: payload, cachedAt: Date.now() });
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};
