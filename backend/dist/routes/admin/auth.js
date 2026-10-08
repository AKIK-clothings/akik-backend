"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../../config/supabase");
const rateLimit_1 = require("../../middleware/rateLimit");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/admin/login
router.post("/login", rateLimit_1.authLimiter, (0, validate_1.validateBody)(validate_1.adminLoginSchema), async (req, res) => {
    try {
        const rawEmail = req.body.email;
        const rawPassword = req.body.password;
        if (!rawEmail || !rawPassword) {
            res.status(400).json({ error: "Email and password are required" });
            return;
        }
        const cleanEmail = rawEmail.trim().toLowerCase();
        const cleanPassword = typeof rawPassword === "string" ? rawPassword.trim() : rawPassword;
        const { data: admin, error } = await supabase_1.supabase
            .from("admins")
            .select("*")
            .ilike("email", cleanEmail)
            .maybeSingle();
        if (error || !admin) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(cleanPassword, admin.password_hash);
        if (!isPasswordValid) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ error: "Server configuration error: JWT_SECRET not configured" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: admin.id, email: admin.email, role: admin.role || "admin" }, jwtSecret, { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") });
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
    }
    catch (err) {
        console.error("POST /admin/login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});
// GET /api/admin/me — Verify token and return admin info (cached via requireAdmin)
router.get("/me", auth_1.requireAdmin, (req, res) => {
    res.json({ admin: req.admin });
});
// POST /api/admin/logout
router.post("/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.akik_admin_token;
    const token = cookieToken || (authHeader ? authHeader.split(" ")[1] : "");
    if (token && process.env.JWT_SECRET) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            if (decoded?.id) {
                (0, auth_1.invalidateAdminAuthCache)(decoded.id);
            }
            else {
                (0, auth_1.invalidateAdminAuthCache)();
            }
        }
        catch {
            // Token invalid or expired; no-op on cache
        }
    }
    res.clearCookie("akik_admin_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.json({ success: true });
});
exports.default = router;
