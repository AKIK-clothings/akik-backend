import { Router, Request, Response } from "express";
import crypto from "crypto";
import { razorpay } from "../config/razorpay";
import { supabase } from "../config/supabase";
import { getNextOrderNumber } from "../utils/orderNumber";
import { buildAdminWhatsAppMessage } from "../utils/whatsapp";
import { checkoutLimiter } from "../middleware/rateLimit";
import {
  validateBody,
  checkoutCreateOrderSchema,
  checkoutVerifyPaymentSchema,
} from "../middleware/validate";

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────
interface CheckoutItemInput {
  productId: string;
  name?: string;
  selectedColor: { name: string; hexCode: string; imageSrc?: string };
  selectedSize: string;
  quantity: number;
}

interface CustomerAddressInput {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  deliveryNotes?: string;
}

interface VerifiedOrderData {
  verifiedItems: Array<{
    productId: string | null;
    name: string;
    selectedColor: { name: string; hexCode: string; imageSrc: string };
    selectedSize: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  couponDiscount: number;
  shippingFee: number;
  finalTotal: number;
  appliedPromoCode?: string;
}

// ─── Authoritative Server-Side Price Recalculation (SEC-01) ───────────────────
async function calculateAuthoritativeTotals(
  rawItems: CheckoutItemInput[],
  requestedPromoCode?: string
): Promise<VerifiedOrderData> {
  if (!rawItems || rawItems.length === 0) {
    throw new Error("Cart is empty");
  }

  const isUuid = (str?: string) =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  const verifiedItems: VerifiedOrderData["verifiedItems"] = [];
  let subtotal = 0;

  const uuidIds = rawItems.map(i => i.productId).filter(isUuid);
  const nonUuidIds = rawItems.map(i => i.productId).filter(id => !isUuid(id));
  const itemNames = rawItems.map(i => i.name).filter(Boolean) as string[];

  // Run bulk queries concurrently (fixes SEC-04 and SEC-08)
  const [uuidRes, slugRes, nameRes] = await Promise.all([
    uuidIds.length > 0 ? supabase.from("products").select("*").in("id", uuidIds) : Promise.resolve({ data: [] }),
    nonUuidIds.length > 0 ? supabase.from("products").select("*").in("slug", nonUuidIds) : Promise.resolve({ data: [] }),
    itemNames.length > 0 ? supabase.from("products").select("*").in("name", itemNames) : Promise.resolve({ data: [] })
  ]);

  const allProducts = [
    ...(uuidRes.data || []),
    ...(slugRes.data || []),
    ...(nameRes.data || [])
  ];

  // Create a fast lookup map
  const productMap = new Map();
  for (const p of allProducts) {
    productMap.set(p.id, p);
    productMap.set(p.slug, p);
    if (p.name) productMap.set(p.name, p);
  }

  for (const item of rawItems) {
    let product = productMap.get(item.productId);
    
    // Fallback check by name if product ID was from client mock data
    if (!product && item.name) {
      product = productMap.get(item.name);
    }

    if (!product) {
      throw new Error(`Product "${item.name || item.productId}" could not be found`);
    }

    if (!product.is_active) {
      throw new Error(`Product "${product.name}" is no longer available`);
    }
    if (product.is_sold_out) {
      throw new Error(`Product "${product.name}" is sold out`);
    }

    const unitPrice = product.discounted_price;
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    verifiedItems.push({
      productId: product.id,
      name: product.name,
      selectedColor: {
        name: item.selectedColor.name,
        hexCode: item.selectedColor.hexCode,
        imageSrc: item.selectedColor.imageSrc || product.primary_image || "",
      },
      selectedSize: item.selectedSize,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    });
  }

  // Authoritative shipping fee calculation: >= ₹3000 free shipping, else ₹150
  const shippingFee = subtotal >= 3000 ? 0 : 150;

  // Authoritative promo code discount verification
  let couponDiscount = 0;
  let appliedPromoCode: string | undefined = undefined;

  if (requestedPromoCode && requestedPromoCode.trim()) {
    const cleanCode = requestedPromoCode.trim().toUpperCase();
    const { data: promo } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", cleanCode)
      .eq("is_active", true)
      .single();

    if (promo) {
      const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
      const limitReached = promo.usage_limit && promo.usage_count >= promo.usage_limit;
      const belowMin = promo.min_order_value && subtotal < promo.min_order_value;

      if (!isExpired && !limitReached && !belowMin) {
        couponDiscount = Math.round((subtotal * promo.discount_percentage) / 100);
        appliedPromoCode = promo.code;
      }
    }
  }

  const finalTotal = Math.max(0, subtotal - couponDiscount + shippingFee);

  return {
    verifiedItems,
    subtotal,
    couponDiscount,
    shippingFee,
    finalTotal,
    appliedPromoCode,
  };
}

// ─── POST /api/checkout/create-order ─────────────────────────────────────────
// Step 1: Recalculate price server-side & create Razorpay order (SEC-01, SEC-05, SEC-10)
router.post(
  "/create-order",
  checkoutLimiter,
  validateBody(checkoutCreateOrderSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { items, promoCode } = req.body;

      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        res.status(503).json({ error: "Payment processor is not configured" });
        return;
      }

      // Server calculates authoritative totals; ignores client subtotal/prices completely
      const verified = await calculateAuthoritativeTotals(items, promoCode);

      const razorpayOrder = await razorpay.orders.create({
        amount: verified.finalTotal * 100, // in paise
        currency: "INR",
        receipt: `akik_${Date.now()}`,
        notes: {
          promoCode: verified.appliedPromoCode || "",
          subtotal: verified.subtotal.toString(),
          finalTotal: verified.finalTotal.toString(),
          itemCount: verified.verifiedItems.length.toString(),
        },
      });

      // CRIT-12: Do not return server keyId to client
      res.json({
        razorpayOrderId: razorpayOrder.id,
        amount: verified.finalTotal * 100,
        currency: "INR",
        calculated: {
          subtotal: verified.subtotal,
          couponDiscount: verified.couponDiscount,
          shippingFee: verified.shippingFee,
          finalTotal: verified.finalTotal,
        },
      });
    } catch (err: any) {
      console.error("POST /checkout/create-order error:", err);
      const isGatewayError =
        err?.statusCode >= 500 ||
        err?.name === "RazorpayError" ||
        err?.code === "ECONNREFUSED" ||
        err?.code === "ETIMEDOUT";

      const status = isGatewayError ? 502 : 400;
      const message =
        process.env.NODE_ENV === "production"
          ? isGatewayError
            ? "Payment processor temporarily unavailable. Please try again shortly."
            : "Failed to initiate payment"
          : err.message || "Failed to initiate payment";
      res.status(status).json({ error: message });
    }
  }
);

// ─── POST /api/checkout/verify-payment ───────────────────────────────────────
// Step 2: Verify HMAC signature → recalculate prices → save order to Supabase
router.post(
  "/verify-payment",
  checkoutLimiter,
  validateBody(checkoutVerifyPaymentSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        items,
        customer,
        promoCode,
      }: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
        items: CheckoutItemInput[];
        customer: CustomerAddressInput;
        promoCode?: string;
      } = req.body;

      if (!process.env.RAZORPAY_KEY_SECRET) {
        res.status(503).json({ error: "Payment processing is not configured" });
        return;
      }

      // ── HMAC Signature Verification (CRIT-20: strictly required) ────────────
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      const sigBuffer = Buffer.from(razorpaySignature || "", "utf8");
      const genBuffer = Buffer.from(generatedSignature, "utf8");

      if (sigBuffer.length !== genBuffer.length || !crypto.timingSafeEqual(sigBuffer, genBuffer)) {
        res.status(400).json({ error: "Payment verification failed — invalid signature" });
        return;
      }

      // ── Idempotency Check (HIGH-21) ──────────────────────────────────────────
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, order_number")
        .eq("razorpay_order_id", razorpayOrderId)
        .maybeSingle();

      if (existingOrder) {
        res.json({
          success: true,
          orderNumber: existingOrder.order_number,
          message: "Order already processed successfully.",
        });
        return;
      }

      // ── Server-side authoritative total recalculation (SEC-01) ───────────────
      const verified = await calculateAuthoritativeTotals(items, promoCode);

      // ── Build address string ──────────────────────────────────────────────────
      const addressParts = [
        customer.addressLine1,
        customer.addressLine2,
        customer.city,
        customer.state,
        customer.pinCode,
      ].filter(Boolean);
      const fullAddress = addressParts.join(", ");

      // ── Generate atomic order number (SEC-02) ─────────────────────────────────
      const orderNumber = await getNextOrderNumber();

      // ── Save order to Supabase ────────────────────────────────────────────────
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email || null,
          address_line1: customer.addressLine1,
          address_line2: customer.addressLine2 || null,
          city: customer.city,
          state: customer.state,
          pin_code: customer.pinCode,
          delivery_notes: customer.deliveryNotes || null,
          subtotal: verified.subtotal,
          coupon_discount: verified.couponDiscount,
          shipping_fee: verified.shippingFee,
          final_total: verified.finalTotal,
          promo_code: verified.appliedPromoCode || null,
          payment_method: "razorpay",
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          payment_status: "paid",
          status: "confirmed",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // ── Save order items with verified unit prices ────────────────────────────
      const orderItems = verified.verifiedItems.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        selected_color: item.selectedColor,
        selected_size: item.selectedSize,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        // Compensating transaction: purge the parent order to prevent orphaned records
        console.error("Order items insert failed, rolling back order record:", itemsError);
        await supabase.from("orders").delete().eq("id", order.id);
        throw itemsError;
      }

      // ── Atomic Promo increment (SEC-09) ───────────────────────────────────────
      if (verified.appliedPromoCode) {
        try {
          const { error: rpcErr } = await supabase.rpc("apply_promo_atomic", {
            p_code: verified.appliedPromoCode,
            p_subtotal: verified.subtotal,
          });
          if (rpcErr) {
            await supabase.rpc("increment_promo_usage", {
              promo_code: verified.appliedPromoCode,
            });
          }
        } catch {
          await supabase.rpc("increment_promo_usage", {
            promo_code: verified.appliedPromoCode,
          });
        }
      }

      // Mark WhatsApp as notified internally
      await supabase
        .from("orders")
        .update({ whatsapp_notified: true })
        .eq("id", order.id);

      // HIGH-13: Do not return admin WhatsApp URL containing full customer PII to browser client
      res.json({
        success: true,
        orderNumber,
        message: "Payment verified and order placed successfully!",
      });
    } catch (err: any) {
      console.error("POST /checkout/verify-payment error:", err);
      const message =
        process.env.NODE_ENV === "production"
          ? "Failed to save order after payment"
          : err.message || "Failed to save order after payment";
      res.status(500).json({ error: message });
    }
  }
);

// ─── POST /api/checkout/webhook ──────────────────────────────────────────────
// Asynchronous payment webhook listener from Razorpay (SEC-04)
router.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // CRIT-19: Strictly reject webhook if webhook secret is not configured
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured — rejecting webhook");
      res.status(503).json({ error: "Webhook processing unavailable" });
      return;
    }

    if (!webhookSignature) {
      res.status(400).json({ error: "Missing x-razorpay-signature header" });
      return;
    }

    const rawBody = (req as any).rawBody
      ? (req as any).rawBody.toString("utf8")
      : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const hookSigBuffer = Buffer.from(webhookSignature || "", "utf8");
    const expectedSigBuffer = Buffer.from(expectedSignature, "utf8");

    if (hookSigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(hookSigBuffer, expectedSigBuffer)) {
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        // Idempotently check if order exists in Supabase
        const { data: existingOrder } = await supabase
          .from("orders")
          .select("id, payment_status, razorpay_payment_id")
          .eq("razorpay_order_id", razorpayOrderId)
          .single();

        if (existingOrder) {
          if (existingOrder.payment_status !== "paid") {
            await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                status: "confirmed",
                razorpay_payment_id: razorpayPaymentId || existingOrder.razorpay_payment_id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingOrder.id);
          }
        } else {
          // Webhook arrived before client browser callback completed
          const orderNumber = await getNextOrderNumber();
          const amountPaid = paymentEntity?.amount ? paymentEntity.amount / 100 : 0;
          const notes = paymentEntity?.notes || {};

          await supabase.from("orders").insert({
            order_number: orderNumber,
            customer_name: paymentEntity?.email ? paymentEntity.email.split("@")[0] : "Customer",
            customer_phone: paymentEntity?.contact || "N/A",
            customer_email: paymentEntity?.email,
            address_line1: notes.address || "Captured via Razorpay Webhook",
            city: notes.city || "Unknown",
            state: notes.state || "Unknown",
            pin_code: notes.pinCode || "000000",
            subtotal: amountPaid,
            coupon_discount: 0,
            shipping_fee: 0,
            final_total: amountPaid,
            promo_code: notes.promoCode || null,
            payment_method: "razorpay",
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            payment_status: "paid",
            status: "confirmed",
            notes: "Order recorded via Razorpay webhook (browser redirect skipped).",
          });
        }
      }
    }

    res.json({ status: "ok" });
  } catch (err: any) {
    console.error("Razorpay webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
