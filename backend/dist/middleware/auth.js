"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.invalidateAdminAuthCache = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../config/supabase");
// In-memory micro-cache to prevent hammering Supabase admins table on every request
const adminAuthCache = new Map();
const ADMIN_CACHE_TTL_MS = 60 * 1000; // 60 seconds
const invalidateAdminAuthCache = (adminId) => {
    if (adminId) {
        adminAuthCache.delete(adminId);
    }
    else {
        adminAuthCache.clear();
    }
};
exports.invalidateAdminAuthCache = invalidateAdminAuthCache;
const requireAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.akik_admin_token;
    if ((!authHeader || !authHeader.startsWith("Bearer ")) && !cookieToken) {
        res.status(401).json({ error: "Unauthorized: No token provided" });
        return;
    }
    const token = cookieToken || (authHeader ? authHeader.split(" ")[1] : "");
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        res.status(500).json({ error: "Server configuration error: JWT_SECRET not configured" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Fast-path: Check memory cache first
        const cached = adminAuthCache.get(decoded.id);
        if (cached && Date.now() - cached.cachedAt < ADMIN_CACHE_TTL_MS) {
            req.admin = cached.admin;
            next();
            return;
        }
        // Database verification for token revocation / admin status check (HIGH-02)
        const { data: admin, error } = await supabase_1.supabase
            .from("admins")
            .select("id, name, email, role")
            .eq("id", decoded.id)
            .single();
        if (error || !admin) {
            adminAuthCache.delete(decoded.id);
            res.status(401).json({ error: "Unauthorized: Account not found or revoked" });
            return;
        }
        const payload = {
            id: admin.id,
            name: admin.name || "Admin",
            email: admin.email,
            role: admin.role || decoded.role || "admin",
        };
        adminAuthCache.set(decoded.id, { admin: payload, cachedAt: Date.now() });
        req.admin = payload;
        next();
    }
    catch {
        res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
};
exports.requireAdmin = requireAdmin;
