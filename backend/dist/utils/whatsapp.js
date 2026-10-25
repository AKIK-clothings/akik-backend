"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminWhatsAppMessage = buildAdminWhatsAppMessage;
exports.buildCustomerWhatsAppMessage = buildCustomerWhatsAppMessage;
/**
 * Build a pre-filled WhatsApp message URL for admin notification
 * when a new order is placed.
 */
function buildAdminWhatsAppMessage(order) {
    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || "919833088958";
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
 * Build a pre-filled WhatsApp confirmation URL to send TO the customer.
 * Opens wa.me on the customer's own number with their order receipt.
 */
function buildCustomerWhatsAppMessage(order) {
    // Normalise to E.164 — strip leading 0, add 91 if bare 10-digit Indian number
    let phone = order.customerPhone.replace(/\D/g, "");
    if (phone.length === 10)
        phone = `91${phone}`;
    const itemLines = order.items
        .map((item, i) => `${i + 1}. ${item.name}\n   Size: ${item.selectedSize} | Color: ${item.selectedColor} | Qty: ${item.quantity}\n   ₹${(item.unitPrice * item.quantity).toLocaleString("en-IN")}`)
        .join("\n\n");
    const discountLine = order.promoCode && order.couponDiscount
        ? `\n🏷️ Promo (${order.promoCode}): −₹${order.couponDiscount.toLocaleString("en-IN")}`
        : "";
    const isCod = order.paymentMethod?.toLowerCase() === "cod";
    const introLine = isCod
        ? `Hi ${order.customerName}! Your order has been placed with Cash on Delivery. 🎉`
        : `Hi ${order.customerName}! Your payment was successful and your order has been placed. 🎉`;
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
🔍 *Track Order Live:* https://akikbyhafsakhatri.in/track-order?order=${order.orderNumber}&phone=${order.customerPhone.replace(/\D/g, "").slice(-10)}

Thank you for choosing AKIK! If you have any questions, just reply here. 🙏`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
