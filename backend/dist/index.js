"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const rateLimit_1 = require("./middleware/rateLimit");
const supabase_1 = require("./config/supabase");
dotenv_1.default.config();
// Route imports
const products_1 = __importDefault(require("./routes/products"));
const promos_1 = __importDefault(require("./routes/promos"));
const enquiries_1 = __importDefault(require("./routes/enquiries"));
const checkout_1 = __importDefault(require("./routes/checkout"));
const auth_1 = __importDefault(require("./routes/admin/auth"));
const products_2 = __importDefault(require("./routes/admin/products"));
const orders_1 = __importDefault(require("./routes/admin/orders"));
const promos_2 = __importDefault(require("./routes/admin/promos"));
const enquiries_2 = __importDefault(require("./routes/admin/enquiries"));
const subcategories_1 = __importDefault(require("./routes/subcategories"));
const subcategories_2 = __importDefault(require("./routes/admin/subcategories"));
const app = (0, express_1.default)();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 5000;
// ─── Server Hardening & Security Headers (SEC-08) ─────────────────────────────
app.use((0, helmet_1.default)());
app.disable("x-powered-by");
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
// ─── Strict CORS Origin Validation (SEC-03) ───────────────────────────────────
const ALLOWED_ORIGINS = [
    "https://akikbyhafsakhatri.in",
    "https://www.akikbyhafsakhatri.in",
    "https://akikcreationsbyhy.com",
    "https://www.akikcreationsbyhy.com",
    "https://akik-web.vercel.app",
];
if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(",")
        .map((origin) => origin.trim().replace(/\/$/, ""))
        .filter(Boolean)
        .forEach((origin) => {
        if (!ALLOWED_ORIGINS.includes(origin))
            ALLOWED_ORIGINS.push(origin);
    });
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin)
            return callback(null, true);
        const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
            /\.vercel\.app$/.test(origin) ||
            /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
            /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
            /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin);
        if (isAllowed) {
            callback(null, true);
        }
        else {
            callback(new Error(`Blocked by CORS policy: Origin ${origin} is not allowed`));
        }
    },
    credentials: true,
}));
// Preserve rawBody buffer for Razorpay Webhook HMAC signature verification (LOW-17)
app.use(express_1.default.json({
    limit: "256kb",
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express_1.default.urlencoded({ extended: true, limit: "256kb" }));
// Global rate limiting for API endpoints (SEC-05)
app.use("/api/", rateLimit_1.apiLimiter);
// ─── Health & Readiness Check ──────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
    try {
        const start = Date.now();
        const { error } = await supabase_1.supabase.from("products").select("id").limit(1);
        const dbLatencyMs = Date.now() - start;
        if (error) {
            res.status(503).json({
                status: "degraded",
                service: "AKIK by Hafsa Khatri — Backend API",
                database: "disconnected",
                error: error.message,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        res.json({
            status: "ok",
            service: "AKIK by Hafsa Khatri — Backend API",
            database: "connected",
            dbLatencyMs,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        res.status(503).json({
            status: "error",
            service: "AKIK by Hafsa Khatri — Backend API",
            database: "unreachable",
            error: err?.message || "Internal database probe error",
            timestamp: new Date().toISOString(),
        });
    }
});
// ─── Public Routes ────────────────────────────────────────────────────────────
app.use("/api/products", products_1.default);
app.use("/api/subcategories", subcategories_1.default);
app.use("/api/promos", promos_1.default);
app.use("/api/enquiries", enquiries_1.default);
app.use("/api/checkout", checkout_1.default);
// ─── Admin Routes ─────────────────────────────────────────────────────────────
app.use("/api/admin", auth_1.default);
app.use("/api/admin/products", products_2.default);
app.use("/api/admin/subcategories", subcategories_2.default);
app.use("/api/admin/orders", orders_1.default);
app.use("/api/admin/promos", promos_2.default);
app.use("/api/admin/enquiries", enquiries_2.default);
// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});
// ─── Global Error Handler (CRIT-11) ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    const message = process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error";
    res.status(500).json({ error: message });
});
// ─── Process Error Handlers (MED-15) ──────────────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
});
// ─── Start Server with Timeouts (LOW-18) ─────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 AKIK Backend API running on 0.0.0.0:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
server.timeout = 30000;
server.headersTimeout = 35000;
exports.default = app;
