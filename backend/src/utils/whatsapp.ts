/**
 * Build a pre-filled WhatsApp message URL for admin notification
 * when a new order is placed.
 */
export function buildAdminWhatsAppMessage(order: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  items: Array<{
    name: string;
    selectedSize: string;
    selectedColor: string;
    quantity: number;
    unitPrice: number;
  }>;
  finalTotal: number;
  promoCode?: string;
  couponDiscount?: number;
  shippingFee: number;
  paymentId?: string;
}): string {
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || "919833088958";

  const itemLines = order.items
    .map(
      (item, i) =>
        `${i + 1}. ${item.name}\n   Size: ${item.selectedSize} | Color: ${item.selectedColor}\n   Qty: ${item.quantity} × ₹${item.unitPrice.toLocaleString("en-IN")}`
    )
    .join("\n\n");

  const discountLine =
    order.promoCode && order.couponDiscount
      ? `\n🏷️ *Promo Code:* ${order.promoCode} (–₹${order.couponDiscount.toLocaleString("en-IN")})`
      : "";

  const message = `🛍️ *New Order Received — AKIK*
━━━━━━━━━━━━━━━━━
📦 *Order No:* ${order.orderNumber}
💳 *Payment ID:* ${order.paymentId || "COD"}

👤 *Customer:*
Name: ${order.customerName}
Phone: ${order.customerPhone}
${order.customerEmail ? `Email: ${order.customerEmail}` : ""}

📍 *Delivery Address:*
${order.address}

🛒 *Items Ordered:*
${itemLines}

━━━━━━━━━━━━━━━━━
📦 Shipping: ${order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}${discountLine}
💰 *Total Paid: ₹${order.finalTotal.toLocaleString("en-IN")}*
━━━━━━━━━━━━━━━━━
Please confirm the order & dispatch ASAP! 🙏`;

  return `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Build a pre-filled WhatsApp confirmation URL to send TO the customer.
 * Opens wa.me on the customer's own number with their order receipt.
 */
export function buildCustomerWhatsAppMessage(order: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: Array<{
    name: string;
    selectedSize: string;
    selectedColor: string;
    quantity: number;
    unitPrice: number;
  }>;
  finalTotal: number;
  shippingFee: number;
  promoCode?: string;
  couponDiscount?: number;
}): string {
  // Normalise to E.164 — strip leading 0, add 91 if bare 10-digit Indian number
  let phone = order.customerPhone.replace(/\D/g, "");
  if (phone.length === 10) phone = `91${phone}`;

  const itemLines = order.items
    .map(
      (item, i) =>
        `${i + 1}. ${item.name}\n   Size: ${item.selectedSize} | Color: ${item.selectedColor} | Qty: ${item.quantity}\n   ₹${(item.unitPrice * item.quantity).toLocaleString("en-IN")}`
    )
    .join("\n\n");

  const discountLine =
    order.promoCode && order.couponDiscount
      ? `\n🏷️ Promo (${order.promoCode}): −₹${order.couponDiscount.toLocaleString("en-IN")}`
      : "";

  const message = `✅ *Order Confirmed — AKIK by Hafsa Khatri* ✨
━━━━━━━━━━━━━━━━━
Hi ${order.customerName}! Your payment was successful and your order has been placed. 🎉

📦 *Order No:* ${order.orderNumber}

🛒 *Items:*
${itemLines}

━━━━━━━━━━━━━━━━━
📦 Shipping: ${order.shippingFee === 0 ? "FREE ✓" : `₹${order.shippingFee}`}${discountLine}
💰 *Total Paid: ₹${order.finalTotal.toLocaleString("en-IN")}*

📍 *Delivering to:*
${order.address}

━━━━━━━━━━━━━━━━━
🕐 Your order will be *dispatched within 24-48 hours*. You'll receive tracking details on this WhatsApp number.

Thank you for choosing AKIK! If you have any questions, just reply here. 🙏`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
