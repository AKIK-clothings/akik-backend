"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminWhatsAppMessage = buildAdminWhatsAppMessage;
exports.buildCustomerWhatsAppMessage = buildCustomerWhatsAppMessage;
/**
 * Build a pre-filled WhatsApp message URL for admin notification
 * when a new order is placed.
 */
function buildAdminWhatsAppMessage(order) {
    const adminNumber = (process.env.ADMIN_WHATSAPP_NUMBER || "919220269593").replace(/\D/g, "");
    const itemLines = order.items
        .map((item, i) => `${i + 1}. ${item.name}\n   Size: ${item.selectedSize} | Color: ${item.selectedColor}\n   Qty: ${item.quantity} × ₹${item.unitPrice.toLocaleString("en-IN")}`)
        .join("\n\n");
    const discountLine = order.promoCode && order.couponDiscount
        ? `\n🏷️ *Promo Code:* ${order.promoCode} (–₹${order.couponDiscount.toLocaleString("en-IN")})`
        : "";
    const isCod = order.paymentMethod?.toLowerCase() === "cod";
    const paymentMethodLabel = isCod ? "Cash on Delivery (COD)" : "Online Payment (Razorpay)";
    const paymentStatusLabel = isCod ? "Pending (Collect on Delivery)" : "Paid ✓";
    const totalLabel = isCod ? "Payable on Delivery" : "Total Paid";
    const message = `🛍️ *New Order Received — AKIK*
━━━━━━━━━━━━━━━━━
📦 *Order No:* ${order.orderNumber}
💳 *Payment Method:* ${paymentMethodLabel}
📊 *Payment Status:* ${paymentStatusLabel}
${order.paymentId ? `🔖 *Payment ID:* ${order.paymentId}` : ""}

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
💰 *${totalLabel}: ₹${order.finalTotal.toLocaleString("en-IN")}*
━━━━━━━━━━━━━━━━━
Please confirm the order & dispatch ASAP! 🙏`;
    return `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
}
/**
 * Build a pre-filled WhatsApp order-confirmation URL that the customer sends
 * TO the boutique's business WhatsApp number (store receives the receipt).
 * NOTE: recipient must be the business number, never the customer's own phone.
 * Opens WhatsApp addressed to the business number with the order receipt pre-filled.
 */
function buildCustomerWhatsAppMessage(order) {
    // Recipient = boutique business WhatsApp (configurable via BUSINESS_WHATSAPP_NUMBER)
    const recipient = (process.env.BUSINESS_WHATSAPP_NUMBER || "919220269593").replace(/\D/g, "");
    const itemLines = order.items
        .map((item, i) => `${i + 1}. ${item.name}\n   Size: ${item.selectedSize} | Color: ${item.selectedColor} | Qty: ${item.quantity}\n   ₹${(item.unitPrice * item.quantity).toLocaleString("en-IN")}`)
        .join("\n\n");
    const discountLine = order.promoCode && order.couponDiscount
        ? `\n🏷️ Promo (${order.promoCode}): −₹${order.couponDiscount.toLocaleString("en-IN")}`
        : "";
    const isCod = order.paymentMethod?.toLowerCase() === "cod";
    const introLine = isCod
        ? `Hi AKIK! I'm ${order.customerName} and I've just placed a Cash on Delivery order. 🎉`
        : `Hi AKIK! I'm ${order.customerName} — my payment was successful and my order has been placed. 🎉`;
    const totalLine = isCod
        ? `💵 *Amount Payable on Delivery: ₹${order.finalTotal.toLocaleString("en-IN")}* (Cash or UPI to delivery agent)`
        : `💰 *Total Paid: ₹${order.finalTotal.toLocaleString("en-IN")}*`;
    const message = `✅ *Order Confirmed — AKIK by Hafsa Khatri* ✨
━━━━━━━━━━━━━━━━━
${introLine}

📦 *Order No:* ${order.orderNumber}
💳 *Payment Method:* ${isCod ? "Cash on Delivery (Pending)" : "Online Payment (Paid)"}

🛒 *Items:*
${itemLines}

━━━━━━━━━━━━━━━━━
📦 Shipping: ${order.shippingFee === 0 ? "FREE ✓" : `₹${order.shippingFee}`}${discountLine}
${totalLine}

📍 *Delivering to:*
${order.address}

━━━━━━━━━━━━━━━━━
🕐 Your order will be *dispatched within 24-48 hours*.
🔍 *Track Order Live:* ${process.env.FRONTEND_URL || "https://www.akikcreationsbyhy.com"}/track-order?order=${order.orderNumber}&phone=${order.customerPhone.replace(/\D/g, "").slice(-10)}

Thank you, AKIK! Please confirm my order. 🙏`;
    return `https://api.whatsapp.com/send?phone=${recipient}&text=${encodeURIComponent(message)}`;
}
