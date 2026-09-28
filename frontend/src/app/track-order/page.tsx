"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Scissors,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { CONTACT_INFO } from "@/data/contactInfo";
import { api } from "@/lib/api";

interface TrackedOrder {
  orderNumber: string;
  customerName: string;
  customerPhoneMasked: string;
  city: string;
  state: string;
  subtotal: number;
  couponDiscount: number;
  shippingFee: number;
  finalTotal: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{
    name: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

interface SavedRecentOrder {
  orderNumber: string;
  phone: string;
  date: string;
  total: number;
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") || "";
  const initialPhone = searchParams.get("phone") || "";

  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [phone, setPhone] = useState(initialPhone);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [recentOrders, setRecentOrders] = useState<SavedRecentOrder[]>([]);

  // Load saved recent orders from browser localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("akik_recent_orders");
      if (saved) {
        const parsed: SavedRecentOrder[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentOrders(parsed.slice(0, 3));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-fetch if order and phone are present in URL (e.g. from WhatsApp link)
  useEffect(() => {
    if (initialOrder && initialPhone) {
      handleLookup(initialOrder, initialPhone);
    }
  }, [initialOrder, initialPhone]);

  const handleLookup = async (orderNum: string, phoneNum: string) => {
    if (!orderNum.trim()) {
      setError("Please enter your order number (e.g. AKIK-10001)");
      return;
    }
    const cleanPhone = phoneNum.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.trackOrder(orderNum, cleanPhone);
      setOrder(res.order);
      // Persist to recent orders in localStorage
      try {
        const currentRecent: SavedRecentOrder[] = JSON.parse(
          localStorage.getItem("akik_recent_orders") || "[]"
        );
        const filtered = currentRecent.filter((o) => o.orderNumber !== res.order.orderNumber);
        const updated = [
          {
            orderNumber: res.order.orderNumber,
            phone: cleanPhone,
            date: new Date(res.order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            }),
            total: res.order.finalTotal,
          },
          ...filtered,
        ].slice(0, 3);
        localStorage.setItem("akik_recent_orders", JSON.stringify(updated));
        setRecentOrders(updated);
      } catch {
        // ignore
      }
    } catch (err: any) {
      setOrder(null);
      setError(
        err.message ||
          "We couldn't locate an order with these details. Please double-check your order number and phone number."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(orderNumber, phone);
  };

  const getStatusStep = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
      case "confirmed":
        return 1;
      case "processing":
      case "tailoring":
        return 2;
      case "dispatched":
        return 3;
      case "delivered":
        return 4;
      default:
        return 1;
    }
  };

  const activeStep = order ? getStatusStep(order.status) : 1;

  const STATUS_STEPS = [
    { title: "Order Placed", desc: "Payment received & logged" },
    { title: "Confirmed", desc: "Verified with AKIK atelier" },
    { title: "In Tailoring", desc: "Finishing & quality checks" },
    { title: "Dispatched", desc: "Handed over to courier" },
    { title: "Delivered", desc: "Safely received at address" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C47D5A]/10 text-[#C47D5A] text-xs uppercase tracking-widest font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Live Order Tracking</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1F1E1D] font-normal tracking-wide">
          Track Your AKIK Order
        </h1>
        <p className="text-xs sm:text-sm text-[#75706B] mt-2 leading-relaxed">
          No login or password needed. Simply enter your Order Number and Mobile Number to view live order and tailoring updates.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-white rounded-2xl border border-[#EAE5DE] p-6 sm:p-8 shadow-sm mb-10">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-0 sm:flex sm:gap-4 sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1F1E1D]">
              Order Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AKIK-10001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 text-sm bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg focus:outline-none focus:border-[#C47D5A] font-mono"
            />
          </div>

          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1F1E1D]">
              10-Digit Mobile Number
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg focus:outline-none focus:border-[#C47D5A]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#1F1E1D] hover:bg-[#C47D5A] text-white text-xs font-semibold uppercase tracking-widest rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Track Order</span>
              </>
            )}
          </button>
        </form>

        {/* Saved Recent Orders Chips */}
        {recentOrders.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#EAE5DE]/80 flex flex-wrap items-center gap-2 text-xs text-[#75706B]">
            <span className="font-semibold text-[#1F1E1D]">Recent on this device:</span>
            {recentOrders.map((ro) => (
              <button
                key={ro.orderNumber}
                type="button"
                onClick={() => {
                  setOrderNumber(ro.orderNumber);
                  setPhone(ro.phone);
                  handleLookup(ro.orderNumber, ro.phone);
                }}
                className="px-2.5 py-1 rounded bg-[#FAF9F6] border border-[#EAE5DE] text-[#1F1E1D] hover:border-[#C47D5A] hover:text-[#C47D5A] font-mono transition-colors"
              >
                {ro.orderNumber} (₹{ro.total.toLocaleString("en-IN")})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3 mb-8">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Order Not Found</p>
            <p className="text-xs text-amber-800 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Order Status Display */}
      {order && (
        <div className="space-y-8 animate-fade-in">
          {/* Milestone Stepper */}
          <div className="bg-white rounded-2xl border border-[#EAE5DE] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAE5DE] gap-2">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#C47D5A] font-bold">
                  Order Status
                </span>
                <h2 className="font-serif text-2xl text-[#1F1E1D] font-normal mt-0.5">
                  {order.orderNumber}
                </h2>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full uppercase tracking-wider">
                  Payment: {order.paymentStatus}
                </span>
                <p className="text-xs text-[#75706B] mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Stepper Steps */}
            <div className="pt-8">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = idx <= activeStep;
                  const isCurrent = idx === activeStep;

                  return (
                    <div key={step.title} className="flex flex-col items-center text-center space-y-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? "bg-[#1F1E1D] text-white shadow-md"
                            : "bg-[#F4EFEA] text-[#A8A49F] border border-[#EAE5DE]"
                        } ${isCurrent ? "ring-4 ring-[#C47D5A]/30 bg-[#C47D5A]" : ""}`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : idx === 2 ? (
                          <Scissors className="w-4 h-4" />
                        ) : idx === 3 ? (
                          <Truck className="w-4 h-4" />
                        ) : (
                          <Package className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            isDone ? "text-[#1F1E1D]" : "text-[#75706B]"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-[10px] text-[#A8A49F] mt-0.5 leading-snug">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Items & Shipping Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items Column (2/3) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5DE] p-6 shadow-sm space-y-4">
              <h3 className="font-serif text-lg text-[#1F1E1D] font-normal border-b border-[#EAE5DE] pb-3">
                Items in This Ensemble ({order.items.length})
              </h3>
              <div className="divide-y divide-[#EAE5DE]">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-[#1F1E1D]">{item.name}</p>
                      <p className="text-xs text-[#75706B] mt-0.5">
                        Size: <span className="font-semibold text-[#1F1E1D]">{item.size}</span> | Shade: {item.color} | Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#1F1E1D] shrink-0 font-mono">
                      ₹{item.lineTotal.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price summary */}
              <div className="pt-4 border-t border-[#EAE5DE] space-y-2 text-xs text-[#75706B]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{order.subtotal.toLocaleString("en-IN")}</span>
                </div>
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Coupon Discount</span>
                    <span className="font-mono">−₹{order.couponDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1F1E1D] pt-2 border-t border-[#EAE5DE]">
                  <span>Total Paid</span>
                  <span className="font-mono text-base text-[#C47D5A]">
                    ₹{order.finalTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Destination & Concierge (1/3) */}
            <div className="space-y-6">
              {/* Delivery Details */}
              <div className="bg-white rounded-2xl border border-[#EAE5DE] p-6 shadow-sm space-y-3">
                <h4 className="font-serif text-sm font-semibold text-[#1F1E1D]">
                  Destination Details
                </h4>
                <div className="text-xs text-[#75706B] space-y-1 leading-relaxed">
                  <p className="font-bold text-[#1F1E1D]">{order.customerName}</p>
                  <p>Registered Phone: {order.customerPhoneMasked}</p>
                  <p className="flex items-center gap-1 text-[#1F1E1D] mt-2">
                    <MapPin className="w-3.5 h-3.5 text-[#C47D5A]" />
                    <span>{order.city}, {order.state}</span>
                  </p>
                </div>
              </div>

              {/* Instant WhatsApp Support */}
              <div className="bg-[#FAF9F6] rounded-2xl border border-[#EAE5DE] p-6 text-center space-y-3">
                <p className="font-serif text-sm text-[#1F1E1D]">Need custom updates?</p>
                <p className="text-xs text-[#75706B] leading-relaxed">
                  Have questions about tailoring, custom sizing, or delivery schedules? Chat directly with Hafsa on WhatsApp.
                </p>
                <a
                  href={`https://wa.me/${CONTACT_INFO.phoneRaw}?text=${encodeURIComponent(
                    `Hello AKIK,\n\nI am tracking my order ${order.orderNumber}. Could you please share the latest update on its dispatch status? Thank you!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#25D366] hover:bg-[#1DAD58] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                  <span>Enquire on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] font-sans pb-24">
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
            <Loader2 className="w-7 h-7 text-[#C47D5A] animate-spin mb-3" />
            <p className="text-xs uppercase tracking-widest text-[#75706B]">Loading Order Tracker...</p>
          </div>
        }
      >
        <TrackOrderContent />
      </Suspense>
    </main>
  );
}
