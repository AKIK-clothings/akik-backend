import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { apiLimiter } from "./middleware/rateLimit";
import { supabase } from "./config/supabase";

dotenv.config();

// Route imports
import productsRouter from "./routes/products";
import promosRouter from "./routes/promos";
import enquiriesRouter from "./routes/enquiries";
import checkoutRouter from "./routes/checkout";
import adminAuthRouter from "./routes/admin/auth";
import adminProductsRouter from "./routes/admin/products";
import adminOrdersRouter from "./routes/admin/orders";
import adminPromosRouter from "./routes/admin/promos";
import adminEnquiriesRouter from "./routes/admin/enquiries";

const app = express();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 5000;

// ─── Server Hardening & Security Headers (SEC-08) ─────────────────────────────
app.use(helmet());
app.disable("x-powered-by");
app.use(compression());
app.use(cookieParser());

// ─── Strict CORS Origin Validation (SEC-03) ───────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://akikbyhafsakhatri.in",
  "https://www.akikbyhafsakhatri.in",
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean)
    .forEach((origin) => ALLOWED_ORIGINS.push(origin));
}

if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.push("http://localhost:3000", "http://127.0.0.1:3000");
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const isWhitelisted =
        ALLOWED_ORIGINS.includes(origin) ||
        /^https:\/\/akik-[a-zA-Z0-9_.-]+\.vercel\.app$/.test(origin);

      if (isWhitelisted) {
        callback(null, true);
      } else {
        callback(new Error(`Blocked by CORS policy: Origin ${origin} is not allowed`));
      }
    },
    credentials: true,
  })
);

// Preserve rawBody buffer for Razorpay Webhook HMAC signature verification (LOW-17)
app.use(
  express.json({
    limit: "256kb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "256kb" }));

// Global rate limiting for API endpoints (SEC-05)
app.use("/api/", apiLimiter);

// ─── Health & Readiness Check ──────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    const start = Date.now();
    const { error } = await supabase.from("products").select("id").limit(1);
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
  } catch (err: any) {
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
app.use("/api/products", productsRouter);
app.use("/api/promos", promosRouter);
app.use("/api/enquiries", enquiriesRouter);
app.use("/api/checkout", checkoutRouter);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/orders", adminOrdersRouter);
app.use("/api/admin/promos", adminPromosRouter);
app.use("/api/admin/enquiries", adminEnquiriesRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler (CRIT-11) ───────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error";
    res.status(500).json({ error: message });
  }
);

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

export default app;
