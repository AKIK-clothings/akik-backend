"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminEnquiryUpdateSchema = exports.adminOrderStatusSchema = exports.adminPromoUpdateSchema = exports.adminPromoCreateSchema = exports.adminProductUpdateSchema = exports.adminProductCreateSchema = exports.enquirySubmitSchema = exports.promoValidateSchema = exports.adminLoginSchema = exports.checkoutVerifyPaymentSchema = exports.customerAddressSchema = exports.checkoutCreateOrderSchema = exports.checkoutItemSchema = exports.validateUuidParam = exports.validateBody = void 0;
const zod_1 = require("zod");
const validateBody = (schema) => async (req, res, next) => {
    try {
        req.body = await schema.parseAsync(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({
                error: "Validation failed",
                details: error.issues.map((e) => ({
                    field: e.path.join("."),
                    message: e.message,
                })),
            });
            return;
        }
        res.status(400).json({ error: "Invalid request payload" });
    }
};
exports.validateBody = validateBody;
// ─── UUID Param Validation Middleware (HIGH-05) ──────────────────────────────
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validateUuidParam = (paramName = "id") => (req, res, next) => {
    const val = req.params[paramName];
    if (!val || !uuidRegex.test(val)) {
        res.status(400).json({ error: `Invalid ${paramName} format: must be a valid UUID` });
        return;
    }
    next();
};
exports.validateUuidParam = validateUuidParam;
// ─── Checkout Schemas ─────────────────────────────────────────────────────────
exports.checkoutItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, "Product ID is required"),
    name: zod_1.z.string().trim().max(200, "Product name too long").optional(), // LOW-10
    selectedColor: zod_1.z.object({
        name: zod_1.z.string(),
        hexCode: zod_1.z.string(),
        imageSrc: zod_1.z.string().optional().default(""),
    }),
    selectedSize: zod_1.z.string().min(1, "Size is required"),
    quantity: zod_1.z.number().int().min(1, "Quantity must be at least 1").max(50),
});
exports.checkoutCreateOrderSchema = zod_1.z.object({
    items: zod_1.z.array(exports.checkoutItemSchema).min(1, "Cart cannot be empty"),
    promoCode: zod_1.z.string().trim().optional(),
});
exports.customerAddressSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    phone: zod_1.z
        .string()
        .trim()
        .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian phone number"),
    email: zod_1.z.string().trim().email("Invalid email address").optional().or(zod_1.z.literal("")),
    addressLine1: zod_1.z.string().trim().min(3, "Address is required").max(255),
    addressLine2: zod_1.z.string().trim().max(255).optional(),
    city: zod_1.z.string().trim().min(2, "City is required").max(100),
    state: zod_1.z.string().trim().min(2, "State is required").max(100),
    pinCode: zod_1.z.string().trim().regex(/^\d{6}$/, "Must be a 6-digit PIN code"),
    deliveryNotes: zod_1.z.string().trim().max(500).optional(),
});
exports.checkoutVerifyPaymentSchema = zod_1.z.object({
    razorpayOrderId: zod_1.z.string().min(1, "Order ID is required"),
    razorpayPaymentId: zod_1.z.string().min(1, "Payment ID is required"),
    razorpaySignature: zod_1.z.string().min(1, "Signature is required"),
    items: zod_1.z.array(exports.checkoutItemSchema).min(1, "Items are required"),
    customer: exports.customerAddressSchema,
    promoCode: zod_1.z.string().trim().optional(),
});
// ─── Admin Auth Schemas ──────────────────────────────────────────────────────
exports.adminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email("Valid email required"),
    password: zod_1.z.string().min(1, "Password is required"),
});
// ─── Promo Schemas ───────────────────────────────────────────────────────────
exports.promoValidateSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1, "Promo code is required"),
    subtotal: zod_1.z.number().positive("Subtotal must be positive").optional(),
});
// ─── Enquiry Schema ──────────────────────────────────────────────────────────
exports.enquirySubmitSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, "Name is required").max(100),
    phone: zod_1.z.string().trim().max(20).optional(),
    topic: zod_1.z.string().trim().max(100).optional(),
    message: zod_1.z.string().trim().min(5, "Message must be at least 5 characters").max(2000),
});
// ─── Admin Product Schemas (HIGH-07) ───────────────────────────────────────────
exports.adminProductCreateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Name is required").max(200),
    category: zod_1.z.string().trim().min(1, "Category is required").max(100),
    subcategory: zod_1.z.string().trim().max(100).optional().nullable(),
    discountedPrice: zod_1.z.number().int().positive("Discounted price must be positive").max(999999),
    regularPrice: zod_1.z.number().int().nonnegative().max(999999).optional().default(0),
    slug: zod_1.z.string().trim().min(1).max(200).optional(),
    sku: zod_1.z.string().trim().max(100).optional().nullable(),
    description: zod_1.z.string().trim().max(10000).optional().default(""),
    fabricDetails: zod_1.z.string().trim().max(5000).optional().default(""),
    dimensions: zod_1.z.string().trim().max(200).optional().nullable(),
    primaryImage: zod_1.z.string().trim().max(2048).optional().default(""),
    secondaryImage: zod_1.z.string().trim().max(2048).optional().default(""),
    galleryImages: zod_1.z.array(zod_1.z.string().max(2048)).optional().default([]),
    sizes: zod_1.z.array(zod_1.z.string().max(20)).optional().default([]),
    sizeStockMap: zod_1.z.record(zod_1.z.string(), zod_1.z.union([zod_1.z.boolean(), zod_1.z.number()])).optional().default({}),
    colorVariants: zod_1.z.array(zod_1.z.any()).optional().default([]),
    accordions: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional().default({}),
    isNewArrival: zod_1.z.boolean().optional().default(false),
    isBestSeller: zod_1.z.boolean().optional().default(false),
    isFeatured: zod_1.z.boolean().optional().default(false),
    isSoldOut: zod_1.z.boolean().optional().default(false),
    isActive: zod_1.z.boolean().optional().default(true),
});
exports.adminProductUpdateSchema = exports.adminProductCreateSchema.partial();
// ─── Admin Promo Schemas (HIGH-07) ─────────────────────────────────────────────
exports.adminPromoCreateSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1, "Code is required").max(50),
    discountPercentage: zod_1.z.number().int().min(1).max(100),
    description: zod_1.z.string().trim().max(500).optional().nullable(),
    minOrderValue: zod_1.z.number().int().nonnegative().max(999999).optional().default(0),
    isActive: zod_1.z.boolean().optional().default(true),
    usageLimit: zod_1.z.number().int().positive().nullable().optional(),
    expiresAt: zod_1.z.string().nullable().optional(),
});
exports.adminPromoUpdateSchema = exports.adminPromoCreateSchema.partial();
// ─── Admin Order Schemas (HIGH-07) ─────────────────────────────────────────────
exports.adminOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["new", "confirmed", "dispatched", "delivered", "cancelled"]),
    notes: zod_1.z.string().trim().max(1000).optional().nullable(),
});
// ─── Admin Enquiry Schemas (HIGH-07) ───────────────────────────────────────────
exports.adminEnquiryUpdateSchema = zod_1.z.object({
    isRead: zod_1.z.boolean().optional().default(true),
});
