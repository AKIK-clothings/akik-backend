import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validateBody =
  (schema: z.ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
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

// ─── UUID Param Validation Middleware (HIGH-05) ──────────────────────────────
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const validateUuidParam =
  (paramName: string = "id") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const val = req.params[paramName];
    if (!val || !uuidRegex.test(val)) {
      res.status(400).json({ error: `Invalid ${paramName} format: must be a valid UUID` });
      return;
    }
    next();
  };

// ─── Checkout Schemas ─────────────────────────────────────────────────────────

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  name: z.string().trim().max(200, "Product name too long").optional(), // LOW-10
  selectedColor: z.object({
    name: z.string(),
    hexCode: z.string(),
    imageSrc: z.string().optional().default(""),
  }),
  selectedSize: z.string().min(1, "Size is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(50),
});

export const checkoutCreateOrderSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Cart cannot be empty"),
  promoCode: z.string().trim().optional(),
});

export const customerAddressSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian phone number"),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  addressLine1: z.string().trim().min(3, "Address is required").max(255),
  addressLine2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2, "City is required").max(100),
  state: z.string().trim().min(2, "State is required").max(100),
  pinCode: z.string().trim().regex(/^\d{6}$/, "Must be a 6-digit PIN code"),
  deliveryNotes: z.string().trim().max(500).optional(),
});

export const checkoutVerifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, "Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Payment ID is required"),
  razorpaySignature: z.string().min(1, "Signature is required"),
  items: z.array(checkoutItemSchema).min(1, "Items are required"),
  customer: customerAddressSchema,
  promoCode: z.string().trim().optional(),
});

// ─── Admin Auth Schemas ──────────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

// ─── Promo Schemas ───────────────────────────────────────────────────────────

export const promoValidateSchema = z.object({
  code: z.string().trim().min(1, "Promo code is required"),
  subtotal: z.number().positive("Subtotal must be positive").optional(),
});

// ─── Enquiry Schema ──────────────────────────────────────────────────────────

export const enquirySubmitSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  phone: z.string().trim().max(20).optional(),
  topic: z.string().trim().max(100).optional(),
  message: z.string().trim().min(5, "Message must be at least 5 characters").max(2000),
});

// ─── Admin Product Schemas (HIGH-07) ───────────────────────────────────────────

export const adminProductCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  category: z.string().trim().min(1, "Category is required").max(100),
  subcategory: z.string().trim().max(100).optional().nullable(),
  discountedPrice: z.number().int().positive("Discounted price must be positive").max(999999),
  regularPrice: z.number().int().nonnegative().max(999999).optional().default(0),
  slug: z.string().trim().min(1).max(200).optional(),
  sku: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().max(10000).optional().default(""),
  fabricDetails: z.string().trim().max(5000).optional().default(""),
  dimensions: z.string().trim().max(200).optional().nullable(),
  primaryImage: z.string().trim().max(2048).optional().default(""),
  secondaryImage: z.string().trim().max(2048).optional().default(""),
  galleryImages: z.array(z.string().max(2048)).optional().default([]),
  sizes: z.array(z.string().max(20)).optional().default([]),
  sizeStockMap: z.record(z.string(), z.union([z.boolean(), z.number()])).optional().default({}),
  colorVariants: z.array(z.any()).optional().default([]),
  accordions: z.record(z.string(), z.any()).optional().default({}),
  isNewArrival: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  isSoldOut: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const adminProductUpdateSchema = adminProductCreateSchema.partial();

// ─── Admin Promo Schemas (HIGH-07) ─────────────────────────────────────────────

export const adminPromoCreateSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(50),
  discountPercentage: z.number().int().min(1).max(100),
  description: z.string().trim().max(500).optional().nullable(),
  minOrderValue: z.number().int().nonnegative().max(999999).optional().default(0),
  isActive: z.boolean().optional().default(true),
  usageLimit: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

export const adminPromoUpdateSchema = adminPromoCreateSchema.partial();

// ─── Admin Order Schemas (HIGH-07) ─────────────────────────────────────────────

export const adminOrderStatusSchema = z.object({
  status: z.enum(["new", "confirmed", "dispatched", "delivered", "cancelled"]),
  notes: z.string().trim().max(1000).optional().nullable(),
});

// ─── Admin Enquiry Schemas (HIGH-07) ───────────────────────────────────────────

export const adminEnquiryUpdateSchema = z.object({
  isRead: z.boolean().optional().default(true),
});
