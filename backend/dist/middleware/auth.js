"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.invalidateAdminAuthCache = exports.isTokenRevoked = exports.revokeAdminToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../config/supabase");
// In-memory micro-cache to prevent hammering Supabase admins table on every request
const adminAuthCache = new Map();
const ADMIN_CACHE_TTL_MS = 60 * 1000; // 60 seconds
// In-memory token revocation store (keyed by SHA-256 hash of JWT, value = expiry ms)
const revokedTokens = new Map();
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
const revokeAdminToken = (token, expSeconds) => {
    if (!token)
        return;
    const now = Date.now();
    // Prune expired entries periodically
    if (revokedTokens.size > 500) {
        for (const [k, expMs] of revokedTokens.entries()) {
            if (expMs <= now)
                revokedTokens.delete(k);
        }
    }
    const expiresAtMs = expSeconds ? expSeconds * 1000 : now + 7 * 24 * 60 * 60 * 1000;
    revokedTokens.set(hashToken(token), expiresAtMs);
};
exports.revokeAdminToken = revokeAdminToken;
const isTokenRevoked = (token) => {
    const key = hashToken(token);
    const expiresAtMs = revokedTokens.get(key);
    if (!expiresAtMs)
        return false;
    if (expiresAtMs <= Date.now()) {
        revokedTokens.delete(key);
        return false;
    }
    return true;
};
exports.isTokenRevoked = isTokenRevoked;
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
        if ((0, exports.isTokenRevoked)(token)) {
            res.status(401).json({ error: "Unauthorized: Token has been revoked" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret, { algorithms: ["HS256"] });
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
