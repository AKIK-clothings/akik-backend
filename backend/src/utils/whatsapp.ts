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
