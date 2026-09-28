"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Printer,
  Copy,
  CheckCheck,
  Truck,
  Package,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { CONTACT_INFO } from "@/data/contactInfo";

export interface OrderReceiptData {
  orderNumber: string;
  customerName: string;
  customerPhoneMasked: string;
  customerEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode?: string;
  subtotal: number;
  promoCode?: string | null;
  couponDiscount: number;
  shippingFee: number;
  finalTotal: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt?: string;
  items: Array<{
    name: string;
    color: string;
    image?: string;
    size: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

interface OrderReceiptCardProps {
  order: OrderReceiptData;
  showTrackerLink?: boolean;
}

export const OrderReceiptCard: React.FC<OrderReceiptCardProps> = ({
  order,
  showTrackerLink = true,
}) => {
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const firstName = order.customerName ? order.customerName.split(" ")[0] : "Customer";
  const totalItemCount = order.items.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const hasSavings = order.couponDiscount > 0;

  const handleCopyOrderNumber = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
      case "confirmed":
        return {
          title: "Your order is confirmed",
          sub: "We have received your payment and our atelier is preparing your ensemble.",
          pill: "Confirmed",
        };
      case "processing":
      case "tailoring":
        return {
          title: "Your ensemble is in tailoring",
          sub: "Our master artisans are conducting stitching, finishing and final quality checks.",
          pill: "In Tailoring",
        };
      case "dispatched":
        return {
          title: "Your order is dispatched",
          sub: "Your parcel is on the way with our trusted express courier partner.",
          pill: "Dispatched",
        };
      case "delivered":
        return {
          title: "Your order has been delivered",
          sub: "Delivered safely to your destination. Thank you for choosing AKIK.",
          pill: "Delivered",
        };
      default:
        return {
          title: `Your order is ${status}`,
          sub: "Payment processed successfully. Your order is logged in our system.",
          pill: status,
        };
    }
  };

  const statusInfo = getStatusText(order.status);

  return (
    <div className="w-full max-w-xl mx-auto font-sans text-[#1F1E1D]">
      {/* Printable Invoice Header (Hidden on screen, shown when printed) */}
      <div className="hidden print:block mb-8 pb-6 border-b border-gray-300">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-serif font-bold text-black">AKIK by Hafsa Khatri</h1>
            <p className="text-xs text-gray-600 mt-1">Boutique Luxury Fashion Atelier</p>
            <p className="text-xs text-gray-600">Mumbai, Maharashtra, India</p>
            <p className="text-xs text-gray-600">WhatsApp / Direct: {CONTACT_INFO.phone}</p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold uppercase tracking-wider text-black">Tax Invoice</h2>
            <p className="text-xs font-mono font-bold mt-1">No: {order.orderNumber}</p>
            <p className="text-xs text-gray-600">
              Date: {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <p className="text-xs text-gray-600">Payment: PAID ({order.paymentStatus})</p>
          </div>
        </div>
      </div>

      {/* Brand Header */}
      <div className="text-left mb-4 px-1 flex items-center justify-between">
        <div>
          <Link href="/" className="inline-block">
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1E1D]">
              AKIK
            </span>
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-[#C47D5A] font-semibold pl-2 border-l border-[#C47D5A]/40 ml-2">
            Haute Couture
          </span>
        </div>
        <button
          onClick={handlePrint}
          className="print:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EAE5DE] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#75706B] hover:text-[#1F1E1D] transition-colors shadow-sm"
          title="Print official receipt / bill"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Bill</span>
        </button>
      </div>

      {/* Section 1: Order Summary Accordion (Match Reference Image) */}
      <div className="bg-[#FAF9F6] sm:bg-white rounded-2xl border border-[#EAE5DE] shadow-sm overflow-hidden mb-6">
        {/* Accordion Bar */}
        <div
          onClick={() => setIsSummaryOpen(!isSummaryOpen)}
          className="w-full px-5 py-4 flex items-center justify-between border-b border-[#EAE5DE] cursor-pointer hover:bg-gray-50/50 transition-colors select-none"
        >
          <div className="flex items-center gap-1.5 text-sm font-medium text-[#1E6091] hover:underline">
            <span>Order summary</span>
            {isSummaryOpen ? (
              <ChevronUp className="w-4 h-4 text-[#1E6091]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#1E6091]" />
            )}
          </div>
          <div className="text-right">
            {hasSavings && (
              <span className="text-xs text-[#75706B] line-through mr-2 font-mono">
                ₹{(order.subtotal + order.shippingFee).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            )}
            <span className="font-bold text-base sm:text-lg text-[#1F1E1D] font-mono">
              ₹{order.finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Collapsible Content */}
        {isSummaryOpen && (
          <div className="p-5 sm:p-6 space-y-4 animate-fade-in">
            {/* Items List */}
            <div className="space-y-4">
              {order.items.map((item, idx) => {
                const itemSavings = hasSavings && order.subtotal > 0
                  ? Math.round((order.couponDiscount * item.lineTotal) / order.subtotal)
                  : 0;

                return (
                  <div key={idx} className="flex items-center gap-3.5 sm:gap-4">
                    {/* Thumbnail with Quantity Badge */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden border border-[#EAE5DE] bg-white flex items-center justify-center shadow-xs">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#FAF9F6] flex items-center justify-center text-[#C47D5A]">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      {/* Quantity Badge on Top Right */}
                      <span className="absolute -top-1.5 -right-1.5 bg-[#1F1E1D] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                        {item.quantity}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1F1E1D] leading-snug line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#75706B] mt-0.5">
                        {item.color} ( {item.size} )
                      </p>
                      {itemSavings > 0 && order.promoCode && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[#008060] bg-[#E3F1DF] px-2 py-0.5 rounded mt-1">
                          <Tag className="w-3 h-3" />
                          <span>
                            {order.promoCode.toUpperCase()} (-₹{itemSavings.toLocaleString("en-IN")})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="text-right shrink-0">
                      {itemSavings > 0 && (
                        <p className="text-xs text-[#75706B] line-through font-mono">
                          ₹{item.lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-[#1F1E1D] font-mono">
                        ₹{(item.lineTotal - itemSavings).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Complimentary Shipping Protection / Assurance Row */}
              <div className="flex items-center gap-3.5 sm:gap-4 pt-1">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl border border-[#EAE5DE] bg-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-7 h-7 text-[#1E6091]" />
                  <span className="absolute -top-1.5 -right-1.5 bg-[#1F1E1D] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                    1
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1F1E1D]">Insured Express Delivery</p>
                  <p className="text-xs text-[#75706B] mt-0.5">Atelier transit protection</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                    FREE
                  </span>
                </div>
              </div>
            </div>

            {/* Line Item Totals */}
            <div className="pt-4 border-t border-[#EAE5DE] space-y-2 text-sm text-[#75706B]">
              <div className="flex justify-between items-center">
                <span>Subtotal · {totalItemCount} {totalItemCount === 1 ? "item" : "items"}</span>
                <span className="font-mono text-[#1F1E1D]">
                  ₹{order.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Shipping</span>
                <span className="font-semibold text-emerald-700 font-mono">
                  {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                </span>
              </div>

              {hasSavings && (
                <div className="flex justify-between items-center text-[#008060]">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon Discount</span>
                  </span>
                  <span className="font-mono">
                    −₹{order.couponDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Total Row */}
              <div className="flex justify-between items-baseline pt-3 border-t border-[#EAE5DE]">
                <span className="text-base font-bold text-[#1F1E1D]">Total</span>
                <div className="text-right">
                  <span className="text-xs text-[#75706B] uppercase font-semibold mr-1.5">INR</span>
                  <span className="text-xl sm:text-2xl font-bold text-[#1F1E1D] font-mono">
                    ₹{order.finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Total Savings Pill (Exact Match to Reference Image) */}
              {hasSavings && (
                <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-[#1F1E1D]">
                  <Tag className="w-3.5 h-3.5 text-[#1F1E1D]" />
                  <span className="tracking-wide">
                    TOTAL SAVINGS ₹{order.couponDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Thank You Header with Checkmark (Exact Match to Reference Image) */}
      <div className="flex items-center gap-4 mb-5 px-1">
        {/* Circle Checkmark Icon */}
        <div className="w-12 h-12 rounded-full border-2 border-[#1E6091] flex items-center justify-center text-[#1E6091] shrink-0 bg-blue-50/40">
          <Check className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <p className="text-xs text-[#75706B] font-medium tracking-wide">
            Confirmation #{order.orderNumber}
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1F1E1D] leading-tight">
            Thank you, {firstName}!
          </h2>
        </div>
      </div>

      {/* Section 3: Status Message Card (Exact Match to Reference Image) */}
      <div className="bg-white rounded-2xl border border-[#EAE5DE] p-5 sm:p-6 shadow-sm mb-6 space-y-1">
        <h3 className="text-base font-bold text-[#1F1E1D]">
          {statusInfo.title}
        </h3>
        <p className="text-xs sm:text-sm text-[#75706B] leading-relaxed">
          {statusInfo.sub}
        </p>
      </div>

      {/* Section 4: Order Credentials & Tracking Info Card */}
      <div className="bg-[#FAF9F6] rounded-2xl border border-[#EAE5DE] p-5 sm:p-6 shadow-sm mb-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAE5DE] pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#C47D5A]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F1E1D]">
              Order Credentials for Tracking
            </h4>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
            Payment: {order.paymentStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-[#EAE5DE]">
            <p className="text-[11px] text-[#75706B] uppercase tracking-wider">Order Number</p>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono font-bold text-sm text-[#1F1E1D]">
                {order.orderNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                className="text-[#75706B] hover:text-[#C47D5A] transition-colors p-1"
                title="Copy order number"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[#EAE5DE]">
            <p className="text-[11px] text-[#75706B] uppercase tracking-wider">Registered Mobile</p>
            <p className="font-mono font-bold text-sm text-[#1F1E1D] mt-1">
              {order.customerPhoneMasked}
            </p>
          </div>
        </div>

        {order.addressLine1 && (
          <div className="text-xs text-[#75706B] pt-1">
            <span className="font-medium text-[#1F1E1D]">Delivery Address: </span>
            <span>
              {[order.addressLine1, order.addressLine2, order.city, order.state, order.pinCode]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        )}

        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 text-xs text-[#1E6091] flex items-start gap-2">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#1E6091]" />
          <p className="leading-relaxed">
            <strong>No login or password needed.</strong> Save your Order Number ({order.orderNumber}) and mobile number to check live tailoring & dispatch progress anytime.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 print:hidden">
          {showTrackerLink && (
            <Link
              href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
              className="flex-1 py-3 px-4 bg-[#1F1E1D] hover:bg-[#C47D5A] text-white text-xs font-semibold uppercase tracking-wider rounded-xl text-center transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Track Live Status</span>
            </Link>
          )}

          <a
            href={`https://wa.me/${CONTACT_INFO.phoneRaw}?text=${encodeURIComponent(
              `Hi AKIK, I have placed order ${order.orderNumber} for ₹${order.finalTotal}. Could you please confirm and share tailoring updates? Thank you!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#1DAD58] text-white text-xs font-semibold uppercase tracking-wider rounded-xl text-center transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
